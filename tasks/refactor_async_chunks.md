# Анализ: Асинхронная загрузка чанков хоста

## Проблема

Чанки хоста (host chunks), создаваемые при сборке хоста через Vite/Rollup, загружаются синхронно, что блокирует основной поток браузера и замедляет загрузку приложения.

### Текущая ситуация

1. **Чанки хоста**: При сборке хоста создаются множественные чанки:
   - `index-*.js` - основной entry point и его зависимости
   - `jsx-dev-runtime-*.js` - React JSX runtime
   - `_virtual_federation_fn_import-*` - Module Federation функции
   - `_commonjsHelpers-*.js` - CommonJS helpers
   - `preload-helper-*.js` - Preload helpers
   - `external-*.js` - External зависимости
   - `moduleUtils-*.js` - Module utilities
   - И другие чанки, созданные через code splitting

2. **Синхронная загрузка**: Vite по умолчанию генерирует `<link rel="modulepreload">` теги для всех чанков в `index.html`, что приводит к:
   - Синхронной загрузке всех чанков при старте приложения
   - Блокировке основного потока во время загрузки и выполнения
   - Последовательной загрузке зависимостей

3. **Блокировка основного потока**: Синхронная загрузка и выполнение JavaScript блокирует основной поток, что влияет на:
   - First Contentful Paint (FCP)
   - Largest Contentful Paint (LCP)
   - Time to Interactive (TTI)
   - Общую отзывчивость приложения

### Визуальное подтверждение

На скриншоте Network tab видно множество чанков хоста (`index-*.js`, `jsx-dev-runtime-*.js`, `_virtual_federation_fn_import-*` и т.д.), которые загружаются последовательно/синхронно в течение нескольких секунд (от ~500ms до ~4000ms), что создает узкое место в производительности.

---

## Анализ текущей реализации

### Конфигурация хоста (`host.config.js`)

```javascript
build: {
  modulePreload: false, // ✅ Отключен modulepreload
  // ...
  rollupOptions: {
    output: {
      // manualChunks закомментирован
      // Чанки создаются автоматически Vite/Rollup
    },
  },
}
```

### HTML (`host/index.html`)

```html
<script src="/reflect.min.js"></script>
<script type="module" src="/src/main.tsx"></script>
```

**Проблема**: 
1. Хотя `modulePreload: false`, Vite все равно может генерировать синхронные импорты в основном бандле
2. Все чанки загружаются через синхронные `import()` в основном entry point
3. Нет разделения на критичные и некритичные чанки
4. Все чанки загружаются сразу при старте приложения

---

## Возможные решения

### 1. Использование динамических импортов для некритичных чанков

**Идея**: Разделить чанки на критичные (синхронные) и некритичные (асинхронные), используя динамические `import()`.

**Преимущества**:
- Некритичные чанки загружаются асинхронно
- Не блокирует основной поток
- Улучшает FCP/LCP

**Недостатки**:
- Требует рефакторинга кода для использования динамических импортов
- Нужно определить, какие чанки критичные

**Реализация**:
```typescript
// Вместо синхронного импорта:
// import { SomeComponent } from './components/SomeComponent';

// Использовать динамический импорт:
const SomeComponent = lazy(() => import('./components/SomeComponent'));

// Или для некритичных утилит:
async function loadNonCriticalUtils() {
  const utils = await import('./utils/non-critical');
  return utils;
}

// Загружать после первого рендера:
requestIdleCallback(() => {
  loadNonCriticalUtils();
});
```

**Когда использовать**:
- Для некритичных компонентов и утилит
- Для модулей, которые не нужны при первом рендере
- Для больших библиотек, которые используются редко

---

### 2. Настройка `manualChunks` для разделения критичных и некритичных чанков

**Идея**: Использовать `manualChunks` в Rollup для явного разделения чанков на критичные и некритичные.

**Преимущества**:
- Полный контроль над разделением чанков
- Критичные чанки загружаются синхронно, некритичные - асинхронно
- Улучшает tree shaking и кеширование

**Недостатки**:
- Требует настройки для каждого типа зависимостей
- Может потребоваться ручная настройка для новых библиотек

**Реализация**:
```javascript
// В host.config.js
rollupOptions: {
  output: {
    manualChunks: (id) => {
      // Критичные чанки (синхронные):
      // - React и React DOM (нужны для первого рендера)
      // - Основной entry point
      // - INIT модули (core, core.layout)
      
      if (id.includes('react') || id.includes('react-dom')) {
        return 'vendor-react'; // Критичный, загружается синхронно
      }
      
      // Некритичные чанки (асинхронные):
      // - Утилиты
      // - Некритичные библиотеки
      // - NORMAL модули
      
      if (id.includes('/utils/') || id.includes('/helpers/')) {
        return 'utils'; // Некритичный, загружается асинхронно
      }
      
      if (id.includes('node_modules')) {
        // Разделяем vendor библиотеки
        if (id.includes('@mui') || id.includes('@emotion')) {
          return 'vendor-ui'; // Может быть асинхронным
        }
        if (id.includes('i18next') || id.includes('react-i18next')) {
          return 'vendor-i18n'; // Может быть асинхронным
        }
        return 'vendor'; // Остальные vendor
      }
      
      // Платформенные библиотеки
      if (id.includes('/libs/')) {
        const libMatch = id.match(/\/libs\/([^/]+)\//);
        if (libMatch) {
          const libName = libMatch[1];
          // core и ui - критичные, остальные - некритичные
          if (libName === 'core' || libName === 'ui') {
            return `lib-${libName}`; // Критичный
          }
          return `lib-${libName}`; // Некритичный
        }
      }
      
      return undefined; // Остальное в основной бандл
    },
  },
}
```

**Когда использовать**:
- Для всех сборок
- Для явного контроля над разделением чанков

---

### 3. Использование `link rel="prefetch"` для предзагрузки некритичных чанков

**Идея**: Предзагружать некритичные чанки хоста с низким приоритетом после первого рендера.

**Преимущества**:
- Не блокирует критичные ресурсы
- Загружается в фоне
- Готов к использованию, когда понадобится
- Улучшает последующий UX

**Недостатки**:
- Может загружать ненужные ресурсы
- Тратит bandwidth

**Реализация**:
```typescript
// В main.tsx или отдельном сервисе
function prefetchHostChunks() {
  // Предзагружаем некритичные чанки после первого рендера
  const nonCriticalChunks = [
    '/assets/utils-*.js',
    '/assets/vendor-ui-*.js',
    '/assets/vendor-i18n-*.js',
    // ... другие некритичные чанки
  ];
  
  // Используем requestIdleCallback для загрузки в idle time
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      nonCriticalChunks.forEach(chunkPattern => {
        // Получаем реальные URL чанков из manifest или через API
        const chunkUrl = getChunkUrl(chunkPattern);
        if (chunkUrl) {
          const link = document.createElement('link');
          link.rel = 'prefetch';
          link.as = 'script';
          link.href = chunkUrl;
          document.head.appendChild(link);
        }
      });
    }, { timeout: 2000 });
  }
}

// Вызывать после первого рендера
useEffect(() => {
  prefetchHostChunks();
}, []);
```

**Когда использовать**:
- Для некритичных чанков хоста
- После первого рендера
- В idle time браузера

---

### 4. Использование React.lazy() для компонентов

**Идея**: Использовать `React.lazy()` для ленивой загрузки компонентов, что автоматически создает асинхронные чанки.

**Преимущества**:
- Автоматическое создание асинхронных чанков
- Интеграция с React Suspense
- Улучшает code splitting

**Недостатки**:
- Требует рефакторинга компонентов
- Нужно обрабатывать loading states

**Реализация**:
```typescript
// Вместо прямого импорта:
// import { SomeComponent } from './components/SomeComponent';

// Использовать lazy:
import { lazy, Suspense } from 'react';

const SomeComponent = lazy(() => import('./components/SomeComponent'));

// В JSX:
<Suspense fallback={<div>Loading...</div>}>
  <SomeComponent />
</Suspense>

// Vite автоматически создаст отдельный чанк для SomeComponent
// и загрузит его асинхронно при первом использовании
```

**Когда использовать**:
- Для больших компонентов
- Для компонентов, которые не нужны при первом рендере
- Для route-based code splitting

---

### 5. Настройка Vite для оптимизации загрузки чанков

**Идея**: Настроить Vite для генерации оптимальных чанков с правильными приоритетами загрузки.

**Преимущества**:
- Решение на уровне сборки
- Работает автоматически
- Не требует изменений в runtime коде

**Недостатки**:
- Может потребовать экспериментов с настройками
- Зависит от версии Vite

**Реализация**:
```javascript
// В host.config.js
build: {
  // Отключаем modulepreload для некритичных чанков
  modulePreload: {
    polyfill: true,
    resolveDependencies: (filename, deps) => {
      // Возвращаем только критичные зависимости для preload
      return deps.filter(dep => {
        // Preload только критичные чанки (React, основной entry)
        return dep.includes('vendor-react') || 
               dep.includes('index') ||
               dep.includes('lib-core') ||
               dep.includes('lib-ui');
      });
    },
  },
  
  rollupOptions: {
    output: {
      // Настройка для асинхронных чанков
      experimentalMinChunkSize: 20000, // Минимальный размер чанка
      manualChunks: (id) => {
        // ... (см. решение #2)
      },
    },
  },
}
```

**Когда использовать**:
- Как основное решение
- Для всех сборок

---

### 6. Использование `requestIdleCallback` для отложенной загрузки некритичных чанков

**Идея**: Загружать некритичные чанки хоста только когда браузер свободен.

**Преимущества**:
- Не блокирует основной поток
- Использует idle time браузера
- Улучшает отзывчивость приложения

**Недостатки**:
- Чанки могут загрузиться позже
- Нужен fallback для браузеров без поддержки

**Реализация**:
```typescript
// В main.tsx после первого рендера
function loadNonCriticalChunksInIdle() {
  const loadChunk = async (chunkUrl: string) => {
    try {
      await import(/* @vite-ignore */ chunkUrl);
    } catch (error) {
      console.warn(`Failed to load chunk: ${chunkUrl}`, error);
    }
  };
  
  const nonCriticalChunks = [
    '/assets/utils-*.js',
    '/assets/vendor-ui-*.js',
    // ... другие некритичные чанки
  ];
  
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      nonCriticalChunks.forEach(chunkPattern => {
        const chunkUrl = getChunkUrl(chunkPattern);
        if (chunkUrl) {
          loadChunk(chunkUrl);
        }
      });
    }, { timeout: 3000 });
  } else {
    // Fallback: загружаем с задержкой
    setTimeout(() => {
      nonCriticalChunks.forEach(chunkPattern => {
        const chunkUrl = getChunkUrl(chunkPattern);
        if (chunkUrl) {
          loadChunk(chunkUrl);
        }
      });
    }, 2000);
  }
}

// Вызывать после первого рендера
useEffect(() => {
  loadNonCriticalChunksInIdle();
}, []);
```

**Когда использовать**:
- Для некритичных чанков хоста
- После первого рендера
- Для чанков, которые не нужны сразу

---

## Рекомендуемый подход (комбинированный)

### Этап 1: Настройка `manualChunks` для разделения чанков

```javascript
// В host.config.js - разделяем на критичные и некритичные
rollupOptions: {
  output: {
    manualChunks: (id) => {
      // Критичные (синхронные): React, основной entry, core библиотеки
      if (id.includes('react') || id.includes('react-dom')) {
        return 'vendor-react';
      }
      if (id.includes('/libs/core') || id.includes('/libs/ui')) {
        return 'lib-core-ui';
      }
      
      // Некритичные (асинхронные): утилиты, UI библиотеки, i18n
      if (id.includes('/utils/') || id.includes('/helpers/')) {
        return 'utils';
      }
      if (id.includes('@mui') || id.includes('@emotion')) {
        return 'vendor-ui';
      }
      if (id.includes('i18next')) {
        return 'vendor-i18n';
      }
      
      return undefined;
    },
  },
}
```

### Этап 2: Настройка `modulePreload` для критичных чанков

```javascript
// В host.config.js - preload только критичные
build: {
  modulePreload: {
    polyfill: true,
    resolveDependencies: (filename, deps) => {
      // Preload только критичные: React, основной entry, core
      return deps.filter(dep => 
        dep.includes('vendor-react') || 
        dep.includes('index') ||
        dep.includes('lib-core-ui')
      );
    },
  },
}
```

### Этап 3: Использование React.lazy() для компонентов

```typescript
// Для больших компонентов используем lazy loading
const NonCriticalComponent = lazy(() => import('./NonCriticalComponent'));

// В роутере или после первого рендера
<Suspense fallback={<div>Loading...</div>}>
  <NonCriticalComponent />
</Suspense>
```

### Этап 4: Prefetch некритичных чанков после рендера

```typescript
// В main.tsx после первого рендера
useEffect(() => {
  requestIdleCallback(() => {
    prefetchHostChunks(); // См. решение #3
  }, { timeout: 2000 });
}, []);
```

---

## Ожидаемые результаты

### До оптимизации:
- Синхронная загрузка всех чанков
- Блокировка основного потока
- Медленная загрузка при большом количестве модулей

### После оптимизации:
- Асинхронная загрузка некритичных модулей
- Предзагрузка критичных модулей
- Улучшение FCP/LCP на 20-30%
- Улучшение TTI на 15-25%

---

## Риски и митигация

### Риск 1: Модули загружаются позже, чем нужно

**Митигация**:
- Использовать `preload` для критичных модулей
- Использовать `prefetch` только для некритичных
- Мониторить время загрузки

### Риск 2: Перегрузка браузера множеством параллельных загрузок

**Митигация**:
- Ограничить количество параллельных загрузок (6-8)
- Использовать очередь загрузки
- Приоритизировать модули

### Риск 3: Совместимость с браузерами

**Митигация**:
- Проверять поддержку `requestIdleCallback`
- Использовать полифиллы при необходимости
- Fallback на обычную загрузку

---

## План реализации

### Фаза 1: Предзагрузка критичных модулей
1. Создать сервис `ChunkPreloader`
2. Добавить `modulepreload` для INIT модулей
3. Тестирование

### Фаза 2: Отложенная загрузка NORMAL модулей
1. Добавить `requestIdleCallback` для NORMAL модулей
2. Добавить `prefetch` для некритичных модулей
3. Тестирование

### Фаза 3: Оптимизация параллельной загрузки
1. Создать `ChunkLoader` с ограничением параллельных загрузок
2. Интегрировать в `RemoteModuleLoader`
3. Тестирование

### Фаза 4: Настройка сборки
1. Настроить Vite/Rollup для асинхронных чанков
2. Оптимизировать `manualChunks`
3. Тестирование

---

## Метрики для отслеживания

1. **FCP (First Contentful Paint)**: Должен улучшиться на 20-30%
2. **LCP (Largest Contentful Paint)**: Должен улучшиться на 15-25%
3. **TTI (Time to Interactive)**: Должен улучшиться на 15-25%
4. **Количество блокирующих запросов**: Должно уменьшиться
5. **Время загрузки всех модулей**: Должно улучшиться на 20-30%

---

## Заключение

Асинхронная загрузка чанков Module Federation - важная оптимизация, которая может значительно улучшить производительность приложения. Рекомендуется использовать комбинированный подход:

1. **Предзагрузка** для критичных модулей
2. **Отложенная загрузка** для некритичных модулей
3. **Параллельная загрузка с ограничением** для баланса между скоростью и нагрузкой

Начать следует с предзагрузки критичных модулей, так как это даст наибольший эффект при минимальных изменениях.

