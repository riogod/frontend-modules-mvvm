# Рефакторинг: Оптимизация загрузки модулей

## Проблема

Текущая реализация загружает 102 модуля за ~14 секунд. Основные проблемы:

1. **102 отдельных HTTP-запроса** для конфигов модулей (`module_config-*.js`)
2. **Каждый файл ~20.4 kB** - большой размер из-за включения всех зависимостей и dev-полей
3. **Последовательная обработка** в `ModulesDiscoveryHandler.processModules()`

## Решение

### 1. Оптимизация размера конфигов

#### 1.1. Tree-shaking конфигов

**Проблема:** Конфиги включают все зависимости, даже неиспользуемые.

**Решение:**
1. **Минификация конфигов** - уже включена через `minify: 'esbuild'`
2. **Удаление неиспользуемых полей** из конфигов в проде
3. **Оптимизация импортов** - использовать named imports вместо default

#### 1.2. Оптимизация структуры конфигов

**Текущая структура:**
```typescript
export default {
  ROUTES: () => routes,
  onModuleInit: (bootstrap) => { ... },
  I18N: (i18n) => { ... },
  mockModuleInfo: { ... }, // Используется только в dev
  mockModuleData: { ... }, // Используется только в dev
} as ModuleConfig;
```

**Оптимизация:**
1. **Удалить `mockModuleInfo` и `mockModuleData` в проде** - они нужны только для dev/server
2. **Ленивая загрузка i18n** - загружать переводы только при необходимости
3. **Оптимизация routes** - использовать более компактный формат

#### 1.3. Создание плагина для удаления dev-полей

**Файл:** `config/vite-config/plugins/removeDevFields.js`

Плагин будет:
- Удалять `mockModuleInfo` и `mockModuleData` из конфигов в проде
- Оптимизировать структуру конфигов для уменьшения размера
- Сохранять все необходимые поля для runtime

### 2. Параллелизация обработки модулей

#### 2.1. Изменение `processModules`

**Файл:** `host/src/bootstrap/handlers/ModulesDiscoveryHandler.ts`

**Было:**
```typescript
for (const entry of manifestEntries) {
  const module = await this.createModule(entry);
  if (module) {
    modules.push(module);
  }
}
```

**Станет:**
```typescript
// Используем Promise.allSettled для безопасной обработки ошибок
// Это гарантирует, что все промисы будут обработаны, даже если некоторые отклонятся
const modulePromises = manifestEntries.map(entry => 
  this.createModule(entry)
);

const results = await Promise.allSettled(modulePromises);

results.forEach((result, index) => {
  if (result.status === 'fulfilled' && result.value) {
    modules.push(result.value);
  } else {
    const entry = manifestEntries[index];
    const error = result.status === 'rejected' ? result.reason : new Error('Unknown error');
    log.warn(`Failed to create module ${entry.name}`, { 
      prefix: 'bootstrap.handlers.ModulesDiscoveryHandler.processModules',
      error: error instanceof Error ? error.message : String(error),
    });
  }
});
```

**Альтернативный вариант (с явной обработкой ошибок):**
```typescript
const modulePromises = manifestEntries.map(async (entry) => {
  try {
    return await this.createModule(entry);
  } catch (error) {
    log.warn(`Failed to create module ${entry.name}`, { 
      prefix: 'bootstrap.handlers.ModulesDiscoveryHandler.processModules',
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
});

const results = await Promise.all(modulePromises);
modules.push(...results.filter((m): m is Module => m !== null));
```

**Рекомендация:** Использовать `Promise.allSettled` - это более безопасный подход, который гарантирует обработку всех промисов независимо от их статуса.

### 3. Детальный план реализации

#### Этап 1: Оптимизация размера конфигов

1. **Создать плагин для удаления dev-полей**
   - Удаляет `mockModuleInfo` и `mockModuleData` в проде
   - Оптимизирует структуру конфигов

2. **Добавить плагин в host.config.js**
   ```javascript
   import { removeDevFieldsPlugin } from './plugins/removeDevFields.js';
   
   plugins: [
     // ...
     removeDevFieldsPlugin(),
   ]
   ```

#### Этап 2: Параллелизация обработки

1. **Изменить `ModulesDiscoveryHandler.processModules`**
   - Заменить последовательный цикл на `Promise.all`
   - Добавить обработку ошибок для каждого модуля
   - Сохранить логирование для отладки

#### Этап 3: Тестирование

1. **Проверить загрузку в dev режиме** - должно работать как раньше
2. **Проверить загрузку в проде** - конфиги должны быть меньше
3. **Измерить производительность** - должно быть быстрее за счет параллелизации

### 4. Ожидаемые результаты

#### До оптимизации:
- 102 HTTP-запроса для конфигов
- ~20.4 kB на конфиг (включая dev-поля)
- ~14 секунд на загрузку всех модулей
- Последовательная обработка модулей

#### После оптимизации:
- 102 HTTP-запроса для конфигов (количество не изменится)
- ~10-15 kB на конфиг (уменьшение за счет удаления dev-полей)
- ~8-10 секунд на загрузку всех модулей (улучшение за счет параллелизации)
- Параллельная обработка модулей

**Улучшение:** 
- ~30-40% сокращение размера конфигов
- ~30-40% сокращение времени загрузки за счет параллелизации

### 5. Дополнительные оптимизации

#### 5.1. Объединение Federation Shared Chunks

**Проблема:** Множество мелких файлов `__federation_shared_*.js` (каждый ~0.4 kB)
- `__federation_shared_react-i18next-COkLJYrd.js` (0.4 kB)
- `__federation_shared_i18next-BDCYzffr.js` (0.4 kB)
- И другие shared зависимости

**Решение:** Настроить `manualChunks` для объединения shared зависимостей

**Файл:** `config/vite-config/host.config.js`

```javascript
rollupOptions: {
  output: {
    manualChunks: (id) => {
      // Объединяем federation shared зависимости в один чанк
      if (id.includes('__federation_shared')) {
        return 'federation-shared';
      }
      // ... остальная логика
    }
  }
}
```

**Ожидаемый эффект:** Сокращение количества запросов с ~10-15 до 1 для shared зависимостей

#### 5.2. Оптимизация размера чанков

**Проблема:** 4.1 MB ресурсов (несжато) - большой размер

**Решение:** Настроить стратегию разбиения чанков

```javascript
manualChunks: (id) => {
  // Объединяем мелкие shared зависимости
  if (id.includes('__federation_shared')) {
    return 'federation-shared';
  }
  
  // Группируем vendor библиотеки
  if (id.includes('node_modules')) {
    // React и связанные
    if (id.includes('react') || id.includes('react-dom')) {
      return 'vendor-react';
    }
    // i18next
    if (id.includes('i18next') || id.includes('react-i18next')) {
      return 'vendor-i18n';
    }
    // Router
    if (id.includes('@riogz/router')) {
      return 'vendor-router';
    }
    // MUI и Emotion
    if (id.includes('@mui') || id.includes('@emotion')) {
      return 'vendor-ui';
    }
    // Остальные vendor
    return 'vendor';
  }
  
  // Платформенные библиотеки
  if (id.includes('/libs/')) {
    const libMatch = id.match(/\/libs\/([^/]+)\//);
    if (libMatch) {
      return `lib-${libMatch[1]}`;
    }
  }
}
```

#### 5.3. Предзагрузка критичных ресурсов

**Проблема:** Множество запросов загружаются последовательно

**Решение:** Использовать `<link rel="preload">` для критичных ресурсов

**Файл:** `host/index.html` или через плагин Vite

```html
<link rel="preload" href="/assets/federation-shared.js" as="script">
<link rel="preload" href="/assets/vendor-react.js" as="script">
```

Или через плагин:
```javascript
{
  name: 'preload-critical',
  transformIndexHtml(html) {
    return html.replace(
      '<head>',
      '<head>\n  <link rel="preload" href="/assets/federation-shared.js" as="script">'
    );
  }
}
```

#### 5.4. Оптимизация загрузки remoteEntry.js

**Проблема:** 102 модуля = 102 запроса для remoteEntry.js файлов

**Решение:** 
1. Использовать HTTP/2 multiplexing (уже работает, но можно оптимизировать)
2. Предзагружать критичные модули
3. Ленивая загрузка некритичных модулей

#### 5.5. Оптимизация размера конфигов модулей

**Проблема:** Каждый `module_config-*.js` ~20.4 kB

**Дополнительные оптимизации:**
1. **Удаление неиспользуемых импортов** - tree-shaking должен работать лучше
2. **Минификация строк** - использовать более короткие имена
3. **Удаление source maps** для конфигов (если не нужны для отладки)

#### 5.6. Кеширование и дедупликация

**Проблема:** Возможное дублирование зависимостей между модулями

**Решение:**
1. Убедиться, что все shared зависимости правильно настроены
2. Использовать агрессивное кеширование для статических ресурсов
3. Настроить правильные заголовки кеширования на сервере

### 6. Дополнительные оптимизации (будущее)

1. **HTTP/2 Server Push** - предзагружать критичные конфиги
2. **Service Worker кеширование** - кешировать конфиги на клиенте
3. **Ленивая загрузка** - загружать только нужные модули
4. **Сжатие конфигов** - использовать более компактный формат (JSON вместо JS)
5. **Оптимизация i18n** - ленивая загрузка переводов
6. **Code splitting по маршрутам** - загружать модули только при переходе на маршрут

### 7. Файлы для изменения

#### Новые файлы:
- `config/vite-config/plugins/removeDevFields.js` - плагин удаления dev-полей

#### Изменяемые файлы:
- `host/src/bootstrap/handlers/ModulesDiscoveryHandler.ts` - параллелизация `processModules`
- `config/vite-config/host.config.js` - добавление плагина удаления dev-полей
- `config/vite-config/module.config.js` - оптимизация сборки модулей (опционально)

### 8. Риски и митигация

#### Риск 1: Проблемы с удалением dev-полей
**Митигация:** Плагин должен работать только в проде, в dev все поля остаются

#### Риск 2: Ошибки при параллельной обработке
**Митигация:** Добавить обработку ошибок для каждого модуля, продолжать загрузку остальных

#### Риск 3: Совместимость с dev режимом
**Митигация:** Плагин удаления dev-полей работает только в проде, dev режим не изменяется

### 9. Метрики успеха

1. **Размер конфигов:** уменьшение на 30-40% (с ~20.4 kB до ~10-15 kB)
2. **Время загрузки:** < 10 секунд (вместо 14)
3. **Параллелизация:** все модули обрабатываются параллельно
4. **Совместимость:** Dev режим работает как раньше

### 10. Приоритет реализации

1. **Высокий:** Параллелизация обработки модулей
2. **Высокий:** Оптимизация размера конфигов (удаление dev-полей)
3. **Высокий:** Объединение Federation Shared Chunks (5.1)
4. **Средний:** Оптимизация размера чанков через manualChunks (5.2)
5. **Средний:** Предзагрузка критичных ресурсов (5.3)
6. **Низкий:** Дополнительные оптимизации (HTTP/2, Service Worker, ленивая загрузка i18n)

### 11. Анализ текущих метрик

**Текущее состояние:**
- 147 HTTP-запросов
- 55.5 kB transferred (сжато)
- 4.1 MB resources (несжато)
- Finish: 14.11 s
- DOMContentLoaded: 482 ms (быстро!)

**Основные проблемы:**
1. Множество мелких federation shared файлов (~0.4 kB каждый)
2. Большой размер несжатых ресурсов (4.1 MB)
3. Долгая загрузка после DOMContentLoaded (13.6 секунд)

**Потенциал оптимизации:**
- Объединение shared chunks: -10-15 запросов
- Оптимизация чанков: -20-30% размера
- Параллелизация: -30-40% времени загрузки
- Предзагрузка: -1-2 секунды для критичных ресурсов

**Ожидаемый результат после всех оптимизаций:**
- ~130-135 HTTP-запросов (вместо 147)
- ~2.8-3.2 MB resources (вместо 4.1 MB)
- ~8-10 секунд Finish (вместо 14.11 s)

