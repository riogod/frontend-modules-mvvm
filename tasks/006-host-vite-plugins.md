# Задача 006: Vite плагины для Host Application

## Статус: ✅ Выполнена

## Описание

Создание Vite плагинов в пакете `@platform/vite-config`: `moduleAliases` (создание алиасов для LOCAL модулей) и `manifestMiddleware` (endpoint `/app/start` для манифеста). Плагины интегрируются с `createHostConfig` и обеспечивают работу CLI Runner с Vite dev server.

## Зависимости

- **Задача 001**: Реструктуризация проекта (модули в packages/)
- **Задача 004**: Менеджер конфигураций CLI (генерация манифеста)

## Подзадачи

### 1. Создание директории плагинов в @platform/vite-config

- [ ] Создать директорию `config/vite-config/plugins/`

### 2. Создание типов для манифеста (ЕДИНЫЙ ИСТОЧНИК)

**⚠️ ВАЖНО**: Типы манифеста в `plugins/types.ts` являются **единственным источником истины** для всего проекта. Они используются в:

- Задача 007: `ModulesDiscoveryHandler` (import из `@platform/vite-config/plugins/types`)
- Задача 009: Build утилиты (import из `../plugins/types`)

- [ ] Создать `config/vite-config/plugins/types.ts`:

  ```typescript
  /**
   * 🔑 ЕДИНЫЙ ИСТОЧНИК ТИПОВ МАНИФЕСТА
   *
   * Эти типы используются во всём проекте:
   * - config/vite-config/plugins/ — Vite плагины
   * - config/vite-config/build/ — Build утилиты
   * - host/src/bootstrap/ — Bootstrap handlers (через реэкспорт)
   */

  export interface ModuleManifestEntry {
    name: string;
    version?: string;
    loadType: 'init' | 'normal';
    loadPriority?: number;
    remoteEntry: string;
    dependencies?: string[];
    featureFlags?: string[];
    accessPermissions?: string[];
  }

  export interface AppManifest {
    modules: ModuleManifestEntry[];
    user?: {
      permissions: string[];
      featureFlags: string[];
    };
  }

  export interface ModuleAliasesOptions {
    /**
     * Манифест с описанием модулей
     */
    manifest: AppManifest | null;

    /**
     * Путь к директории packages/
     */
    packagesDir: string;
  }

  export interface ManifestMiddlewareOptions {
    /**
     * Манифест для отдачи на /app/start
     */
    manifest: AppManifest | null;

    /**
     * Дефолтные user данные для dev режима
     */
    defaultUser?: {
      permissions: string[];
      featureFlags: string[];
    };
  }
  ```

### 3. Создание moduleAliases плагина

- [ ] Создать `config/vite-config/plugins/moduleAliases.ts`:

  ````typescript
  import path from 'path';
  import type { Plugin, UserConfig } from 'vite';
  import type { ModuleAliasesOptions } from './types';

  /**
   * Vite плагин для создания алиасов LOCAL модулей
   *
   * Читает манифест и для модулей с remoteEntry === '' создает алиас:
   *   @platform/module-{name} → packages/{name}/src
   *
   * Это позволяет импортировать LOCAL модули с HMR в dev режиме
   *
   * @example
   * ```typescript
   * createModuleAliasesPlugin({
   *   manifest,
   *   packagesDir: path.resolve(__dirname, '../packages'),
   * })
   * ```
   */
  export function createModuleAliasesPlugin(
    options: ModuleAliasesOptions,
  ): Plugin {
    const { manifest, packagesDir } = options;

    if (!manifest) {
      return {
        name: 'platform-module-aliases-noop',
      };
    }

    // Извлекаем локальные модули (remoteEntry === '')
    const localModules = manifest.modules
      .filter((m) => m.remoteEntry === '' && m.loadType === 'normal')
      .map((m) => m.name);

    return {
      name: 'platform-module-aliases',

      config(config: UserConfig) {
        const aliases: Record<string, string> = {};

        // Создаем алиасы для каждого локального модуля
        localModules.forEach((moduleName) => {
          const modulePath = path.resolve(packagesDir, moduleName, 'src');

          // Основной алиас для модуля
          aliases[`@platform/module-${moduleName}`] = modulePath;

          // Алиас для подпутей внутри модуля
          aliases[`@platform/module-${moduleName}/`] = `${modulePath}/`;
        });

        if (localModules.length > 0) {
          console.log(
            '[platform-module-aliases] Created aliases for:',
            localModules,
          );
        }

        return {
          resolve: {
            alias: {
              ...config.resolve?.alias,
              ...aliases,
            },
          },
        };
      },
    };
  }
  ````

### 4. Создание manifestMiddleware плагина

- [ ] Создать `config/vite-config/plugins/manifestMiddleware.ts`:

  ````typescript
  import type { Plugin, ViteDevServer } from 'vite';
  import type { ManifestMiddlewareOptions } from './types';

  /**
   * Vite плагин для создания /app/start endpoint в dev режиме
   *
   * Возвращает манифест модулей для Bootstrap приложения.
   * В production этот endpoint обслуживается бэкендом.
   *
   * @example
   * ```typescript
   * createManifestMiddleware({
   *   manifest,
   *   defaultUser: {
   *     permissions: ['admin'],
   *     featureFlags: ['feature1'],
   *   },
   * })
   * ```
   */
  export function createManifestMiddleware(
    options: ManifestMiddlewareOptions,
  ): Plugin {
    const { manifest, defaultUser } = options;

    if (!manifest) {
      return {
        name: 'platform-manifest-middleware-noop',
      };
    }

    return {
      name: 'platform-manifest-middleware',

      configureServer(server: ViteDevServer) {
        server.middlewares.use('/app/start', (req, res, next) => {
          if (req.method !== 'GET') {
            return next();
          }

          // Добавляем user данные для dev режима
          const devManifest = {
            ...manifest,
            user: manifest.user ||
              defaultUser || {
                permissions: [],
                featureFlags: [],
              },
          };

          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Cache-Control', 'no-cache');

          res.end(JSON.stringify(devManifest, null, 2));

          console.log('[platform-manifest-middleware] Served /app/start');
        });
      },
    };
  }
  ````

### 5. Создание утилиты для загрузки манифеста

- [ ] Создать `config/vite-config/plugins/loadManifest.ts`:

  ```typescript
  import fs from 'fs';
  import path from 'path';
  import type { AppManifest } from './types';

  export interface LoadManifestOptions {
    /**
     * Путь к директории проекта (dirname)
     */
    dirname: string;

    /**
     * Путь к файлу манифеста относительно корня проекта
     * @default '../.launcher/current-manifest.json'
     */
    manifestPath?: string;

    /**
     * Путь к директории packages/ для fallback
     * @default '../packages'
     */
    packagesDir?: string;

    /**
     * Создать fallback манифест если файл не найден
     * @default true
     */
    createFallback?: boolean;
  }

  /**
   * Загружает манифест из файла или создает fallback
   */
  export function loadManifest(
    options: LoadManifestOptions,
  ): AppManifest | null {
    const {
      dirname,
      manifestPath = '../.launcher/current-manifest.json',
      packagesDir = '../packages',
      createFallback = true,
    } = options;

    const fullManifestPath = path.resolve(dirname, manifestPath);

    // Пытаемся загрузить манифест из файла
    try {
      if (fs.existsSync(fullManifestPath)) {
        const manifest = JSON.parse(fs.readFileSync(fullManifestPath, 'utf-8'));
        console.log(
          '[loadManifest] Loaded manifest with',
          manifest.modules?.length || 0,
          'modules',
        );
        return manifest;
      }
    } catch (error) {
      console.warn('[loadManifest] Failed to load manifest:', error);
    }

    // Создаем fallback если разрешено
    if (createFallback) {
      return createFallbackManifest(dirname, packagesDir);
    }

    console.log('[loadManifest] No manifest found');
    return null;
  }

  /**
   * Создает fallback манифест со всеми модулями как LOCAL
   */
  function createFallbackManifest(
    dirname: string,
    packagesDir: string,
  ): AppManifest {
    const fullPackagesDir = path.resolve(dirname, packagesDir);
    const modules: AppManifest['modules'] = [];

    // INIT модули всегда локальные
    modules.push(
      {
        name: 'core',
        version: '1.0.0',
        loadType: 'init',
        loadPriority: 0,
        remoteEntry: '',
      },
      {
        name: 'core.layout',
        version: '1.0.0',
        loadType: 'init',
        loadPriority: 2,
        remoteEntry: '',
      },
    );

    // Сканируем packages/ для NORMAL модулей
    if (fs.existsSync(fullPackagesDir)) {
      const packageDirs = fs
        .readdirSync(fullPackagesDir, { withFileTypes: true })
        .filter((d) => d.isDirectory());

      packageDirs.forEach((dir) => {
        modules.push({
          name: dir.name,
          version: '1.0.0',
          loadType: 'normal',
          loadPriority: 1,
          remoteEntry: '',
        });
      });
    }

    console.log(
      '[loadManifest] Created fallback manifest with',
      modules.length,
      'modules',
    );

    return { modules };
  }
  ```

### 6. Создание index.ts для плагинов

- [ ] Создать `config/vite-config/plugins/index.ts`:

  ```typescript
  export { createModuleAliasesPlugin } from './moduleAliases';
  export { createManifestMiddleware } from './manifestMiddleware';
  export { loadManifest } from './loadManifest';
  export type {
    AppManifest,
    ModuleManifestEntry,
    ModuleAliasesOptions,
    ManifestMiddlewareOptions,
  } from './types';
  ```

### 7. Обновление экспортов @platform/vite-config

- [ ] Обновить `config/vite-config/index.js`:

  ```javascript
  export { createBaseConfig } from './base.config.js';
  export { createHostConfig } from './host.config.js';
  export { createLibConfig } from './lib.config.js';
  export { createViteConfig } from './createViteConfig.js';

  // Плагины для MFE
  export {
    createModuleAliasesPlugin,
    createManifestMiddleware,
    loadManifest,
  } from './plugins/index.js';
  ```

- [ ] Обновить `config/vite-config/index.d.ts` с типами

### 8. Обновление host/vite.config.mts

- [ ] Обновить `host/vite.config.mts` для использования плагинов:

  ```typescript
  import { defineConfig } from 'vite';
  import {
    createViteConfig,
    createModuleAliasesPlugin,
    createManifestMiddleware,
    loadManifest,
  } from '@platform/vite-config';
  import path from 'path';

  // Загружаем манифест (с fallback)
  const manifest = loadManifest({
    dirname: __dirname,
    manifestPath: '../.launcher/current-manifest.json',
    packagesDir: '../packages',
    createFallback: true,
  });

  export default defineConfig(
    createViteConfig({
      type: 'host',
      dirname: __dirname,
      plugins: [
        // Плагин для алиасов локальных модулей
        createModuleAliasesPlugin({
          manifest,
          packagesDir: path.resolve(__dirname, '../packages'),
        }),

        // Middleware для /app/start (только в dev)
        createManifestMiddleware({
          manifest,
          defaultUser: {
            permissions: ['api.module.load.permission'],
            featureFlags: ['api.module.load.feature'],
          },
        }),
      ],
    }),
  );
  ```

### 9. Добавление логирования и отладки

- [ ] Добавить DEBUG режим в плагины:

  ```typescript
  // В moduleAliases.ts
  if (process.env.DEBUG) {
    console.log('[platform-module-aliases] Configuration:');
    console.log('  Packages dir:', packagesDir);
    console.log('  Local modules:', localModules);
    console.log('  Aliases:', aliases);
  }

  // В manifestMiddleware.ts
  if (process.env.DEBUG) {
    console.log(
      '[platform-manifest-middleware] Manifest content:',
      JSON.stringify(manifest, null, 2),
    );
  }
  ```

### 10. Тестирование плагинов

- [ ] Запустить `npm run dev` (без CLI Runner, с fallback манифестом)
- [ ] Проверить, что fallback манифест создается корректно
- [ ] Запустить через CLI Runner с различными конфигурациями
- [ ] Проверить, что `/app/start` возвращает корректный JSON
- [ ] Проверить, что алиасы работают для LOCAL модулей
- [ ] Проверить HMR для модулей из packages/

## Definition of Done (DoD)

1. ✅ Плагины размещены в `config/vite-config/plugins/`
2. ✅ Плагин `createModuleAliasesPlugin` создает алиасы для LOCAL модулей
3. ✅ Плагин `createManifestMiddleware` создает endpoint `/app/start`
4. ✅ Утилита `loadManifest` загружает манифест или создает fallback
5. ✅ **Типы манифеста (`AppManifest`, `ModuleManifestEntry`) — единый источник для всего проекта**
6. ✅ Типы экспортированы из `@platform/vite-config/plugins/types`
7. ✅ Алиасы позволяют импортировать модули как `@platform/module-{name}`
8. ✅ `/app/start` возвращает корректный JSON манифест
9. ✅ Fallback работает при отсутствии манифеста (все LOCAL)
10. ✅ HMR работает для LOCAL модулей
11. ✅ Плагины интегрированы в `host/vite.config.mts`

## Архитектура

```
config/vite-config/
├── plugins/                          # 🆕 Плагины для MFE
│   ├── types.ts                     # 🔑 ЕДИНЫЙ ИСТОЧНИК типов манифеста
│   ├── moduleAliases.ts             # Плагин алиасов для LOCAL модулей
│   ├── manifestMiddleware.ts        # Middleware для /app/start
│   ├── loadManifest.ts              # Утилита загрузки манифеста
│   └── index.ts                     # Экспорты
├── build/                           # 🆕 Build утилиты (задача 009)
│   ├── utils.ts                     # Использует ../plugins/types
│   ├── generateManifest.ts
│   └── index.ts
├── base.config.ts
├── host.config.ts                   # Использует плагины
├── lib.config.ts
├── module.config.ts                 # 🆕 Из задачи 002
├── index.js                         # Экспорт всего
└── index.d.ts                       # Типы
```

### Граф зависимостей типов

```
config/vite-config/plugins/types.ts    ← 🔑 ЕДИНЫЙ ИСТОЧНИК
       │
       ├────────────────────────────────────────────────────┐
       │                                                    │
       ▼                                                    ▼
config/vite-config/                              host/src/bootstrap/
├── plugins/moduleAliases.ts                     └── interface.ts
├── plugins/manifestMiddleware.ts                    │
├── plugins/loadManifest.ts                          │ re-export types
└── build/generateManifest.ts                        │
                                                     ▼
                                              ModulesDiscoveryHandler.ts
```

```
                    ┌─────────────────┐
                    │   CLI Runner    │
                    │ (npm start)     │
                    └────────┬────────┘
                             │
                             ▼
              ┌──────────────────────────────┐
              │ .launcher/current-manifest.json │
              └──────────────┬───────────────┘
                             │
                    loadManifest()
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
        ▼                    ▼                    ▼
┌───────────────────┐ ┌──────────────────┐ ┌───────────────┐
│ moduleAliases     │ │ manifestMiddle   │ │ Vite Dev      │
│    Plugin         │ │     ware         │ │ Server        │
└───────┬───────────┘ └────────┬─────────┘ └───────────────┘
        │                      │
        │ Creates aliases      │ Serves /app/start
        │ for LOCAL modules    │
        ▼                      ▼
┌───────────────────────────────────────────────────────┐
│                   Host Application                     │
│  import('@platform/module-todo') ──► packages/todo/src │
│  fetch('/app/start') ──► manifest JSON                 │
└───────────────────────────────────────────────────────┘
```

## Пример работы алиасов

```typescript
// В host/src/modules/modules.ts
// До (старый способ - прямой импорт):
import TodoConfig from './todo/config/module_config';

// После (через алиас - работает для packages/):
import TodoConfig from '@platform/module-todo/config/module_config';

// Или динамический импорт:
config: import('@platform/module-todo/config/module_config').then(
  (m) => m.default,
);
```

## Пример ответа /app/start

```json
{
  "modules": [
    {
      "name": "core",
      "version": "1.0.0",
      "loadType": "init",
      "loadPriority": 0,
      "remoteEntry": ""
    },
    {
      "name": "core.layout",
      "version": "1.0.0",
      "loadType": "init",
      "loadPriority": 2,
      "remoteEntry": ""
    },
    {
      "name": "todo",
      "version": "1.0.0",
      "loadType": "normal",
      "loadPriority": 1,
      "remoteEntry": "",
      "dependencies": []
    },
    {
      "name": "api_example",
      "version": "1.2.3",
      "loadType": "normal",
      "loadPriority": 2,
      "remoteEntry": "https://staging.example.com/modules/api_example/remoteEntry.js",
      "dependencies": ["core", "todo"],
      "featureFlags": ["api.module.load.feature"],
      "accessPermissions": ["api.module.load.permission"]
    }
  ],
  "user": {
    "permissions": ["api.module.load.permission"],
    "featureFlags": ["api.module.load.feature"]
  }
}
```

## Преимущества размещения в @platform/vite-config

| Аспект            | host/plugins/           | @platform/vite-config/plugins/ |
| ----------------- | ----------------------- | ------------------------------ |
| Централизация     | ❌ Разбросано           | ✅ Всё в одном месте           |
| Переиспользование | ❌ Только host          | ✅ Любой проект                |
| Консистентность   | ❌ Отдельно от конфигов | ✅ Рядом с createHostConfig    |
| Типы              | ❌ Дублирование         | ✅ Единые типы                 |
| Обновление        | ❌ Вручную в host       | ✅ Через npm update            |

## Риски и митигация

| Риск                             | Вероятность | Влияние | Митигация                        |
| -------------------------------- | ----------- | ------- | -------------------------------- |
| Конфликт алиасов с существующими | Низкая      | Высокое | Проверка существующих алиасов    |
| Проблемы с HMR                   | Средняя     | Среднее | Тестирование на всех модулях     |
| Некорректный JSON в манифесте    | Низкая      | Высокое | Валидация манифеста при загрузке |

## Время выполнения

Ожидаемое время: **4-6 часов**

## Примечания

- Плагины работают только в dev режиме
- В production `/app/start` обслуживается бэкендом
- Алиасы создаются только для модулей с `remoteEntry === ''`
- INIT модули всегда локальные, их алиасы не нужны (импортируются напрямую)
- Fallback манифест создается автоматически при отсутствии `.launcher/current-manifest.json`
- **Типы манифеста в `plugins/types.ts` — единственный источник истины**, НЕ дублировать в других местах
