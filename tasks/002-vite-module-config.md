# Задача 002: Централизованная Vite конфигурация для MFE модулей

## Статус: ✅ Выполнена

## Описание

Создание функции `createModuleConfig()` в пакете `@platform/vite-config` для единообразной настройки MFE модулей. Конфигурация включает настройку Module Federation с shared dependencies, exposes и поддержку локальных настроек через `vite.config.local.mts`.

## Зависимости

- **Задача 001**: Реструктуризация проекта (должна быть завершена)

## Подзадачи

### 1. Создание module.config.ts в @platform/vite-config
- [ ] Создать файл `config/vite-config/module.config.ts`
- [ ] Реализовать функцию `createModuleConfig()`:
  ```typescript
  interface ModuleConfigOptions {
    dirname: string;
    moduleName: string;
    localConfigPath?: string;
    exposes?: Record<string, string>;
    shared?: Record<string, any>;
  }
  
  export function createModuleConfig(options: ModuleConfigOptions) {
    // Базовые shared зависимости
    const defaultShared = {
      'react': { singleton: true, requiredVersion: false },
      'react-dom': { singleton: true, requiredVersion: false },
      'mobx': { singleton: true, requiredVersion: false },
      'mobx-react-lite': { singleton: true, requiredVersion: false },
      '@platform/core': { singleton: true, requiredVersion: false },
      '@platform/ui': { singleton: true, requiredVersion: false },
      '@platform/common': { singleton: true, requiredVersion: false },
    };
    // ...
  }
  ```

### 2. Интеграция с vite.config.local.mts
- [ ] Реализовать загрузку локальной конфигурации:
  ```typescript
  // Загружаем локальную конфигурацию если она есть
  let localConfig = {};
  const localPath = path.resolve(dirname, localConfigPath || './vite.config.local.mts');
  
  try {
    const loaded = await import(localPath);
    localConfig = loaded.default || loaded;
  } catch (e) {
    console.log(`No local config found for ${moduleName}`);
  }
  ```
- [ ] Объединить базовые и локальные настройки Federation

### 3. Настройка Federation plugin
- [ ] Добавить зависимость `@originjs/vite-plugin-federation` (уже есть в devDependencies)
- [ ] Настроить Federation с динамическими exposes:
  ```typescript
  federation({
    name: localConfig.name || moduleName,
    filename: 'remoteEntry.js',
    exposes: {
      './Config': './src/config/module_config.ts',
      ...(localConfig.exposes || {}),
    },
    shared: {
      ...defaultShared,
      ...(localConfig.shared || {}),
    },
    remotes: localConfig.remotes || {},
  })
  ```

### 4. Обновление экспортов в index.ts
- [ ] Добавить экспорт в `config/vite-config/index.ts`:
  ```typescript
  export { createModuleConfig } from './module.config.js';
  ```
- [ ] Обновить `config/vite-config/index.d.ts` с типами

### 5. Создание vite.config.mts для модуля todo
- [ ] Создать `packages/todo/vite.config.mts`:
  ```typescript
  import { defineConfig } from 'vite';
  import { createModuleConfig } from '@platform/vite-config';
  
  export default defineConfig(
    createModuleConfig({
      dirname: __dirname,
      moduleName: 'module-todo',
    })
  );
  ```
- [ ] Создать `packages/todo/vite.config.local.mts`:
  ```typescript
  export default {
    name: 'module-todo',
    exposes: {},
    shared: {},
    base: process.env.NODE_ENV === 'production' ? '/modules/todo/' : '/',
    remotes: {},
  };
  ```

### 6. Создание vite.config.mts для модуля api_example
- [ ] Создать `packages/api_example/vite.config.mts`:
  ```typescript
  import { defineConfig } from 'vite';
  import { createModuleConfig } from '@platform/vite-config';
  
  export default defineConfig(
    createModuleConfig({
      dirname: __dirname,
      moduleName: 'module-api-example',
    })
  );
  ```
- [ ] Создать `packages/api_example/vite.config.local.mts`:
  ```typescript
  export default {
    name: 'module-api-example',
    exposes: {},
    shared: {},
    base: process.env.NODE_ENV === 'production' ? '/modules/api_example/' : '/',
    remotes: {},
  };
  ```

### 7. Настройка build output
- [ ] Настроить output для production build:
  ```typescript
  build: {
    target: 'esnext',
    minify: process.env.NODE_ENV === 'production',
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        format: 'esm',
      },
    },
  }
  ```

### 8. Тестирование сборки
- [ ] Добавить скрипты в корневой package.json:
  ```json
  {
    "scripts": {
      "build:module:todo": "cd packages/todo && vite build",
      "build:module:api": "cd packages/api_example && vite build"
    }
  }
  ```
- [ ] Выполнить тестовую сборку модуля todo
- [ ] Проверить, что `remoteEntry.js` генерируется корректно
- [ ] Проверить размер бандлов и shared chunks

## Definition of Done (DoD)

1. ✅ Функция `createModuleConfig()` создана в `@platform/vite-config`
2. ✅ Поддержка загрузки локальной конфигурации из `vite.config.local.mts`
3. ✅ Базовые shared dependencies настроены как singleton
4. ✅ Module Federation плагин корректно настроен
5. ✅ `vite.config.mts` создан для модулей `todo` и `api_example`
6. ✅ `vite.config.local.mts` создан для каждого модуля
7. ✅ Тестовая сборка модулей проходит успешно
8. ✅ `remoteEntry.js` генерируется в output директории
9. ✅ Shared dependencies не дублируются в бандлах модулей
10. ✅ TypeScript типы экспортированы корректно

## Архитектура конфигураций

```
config/vite-config/
  ├── base.config.ts          # Базовая конфигурация
  ├── host.config.ts          # Конфигурация для Host
  ├── lib.config.ts           # Конфигурация для библиотек
  ├── module.config.ts        # 🆕 Конфигурация для MFE модулей
  └── index.ts                # Экспорты

packages/todo/
  ├── vite.config.mts         # 🆕 Использует createModuleConfig()
  └── vite.config.local.mts   # 🆕 Локальные настройки Federation

packages/api_example/
  ├── vite.config.mts         # 🆕 Использует createModuleConfig()
  └── vite.config.local.mts   # 🆕 Локальные настройки Federation
```

## Shared Dependencies (по умолчанию)

| Зависимость | Singleton | Описание |
|-------------|-----------|----------|
| react | ✅ | Основной UI фреймворк |
| react-dom | ✅ | DOM рендеринг |
| mobx | ✅ | State management |
| mobx-react-lite | ✅ | MobX React bindings |
| @platform/core | ✅ | Базовые сервисы |
| @platform/ui | ✅ | UI компоненты |
| @platform/common | ✅ | Общие утилиты |

## Риски и митигация

| Риск | Вероятность | Влияние | Митигация |
|------|-------------|---------|-----------|
| Несовместимость версий Federation | Средняя | Высокое | Зафиксировать версию плагина |
| Проблемы с shared dependencies | Средняя | Среднее | Проверить через bundle analyzer |
| Циклические зависимости | Низкая | Высокое | Проверить граф зависимостей |

## Время выполнения

Ожидаемое время: **6-8 часов**

## Примечания

- Эта задача критична для работы Module Federation
- Shared dependencies должны быть идентичны в Host и всех модулях
- `vite.config.local.mts` позволяет модулям настраивать специфичные параметры без изменения централизованной конфигурации
- В dev режиме Federation не используется (модули загружаются через Vite алиасы)

