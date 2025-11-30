# Задача 007: ModulesDiscoveryHandler

## Статус: ⚪ Не начата

## Описание

Создание нового Bootstrap handler `ModulesDiscoveryHandler`, который загружает манифест модулей с `/app/start` и подготавливает модули для дальнейшей обработки. Handler определяет способ загрузки каждого модуля (LOCAL через Vite алиас или REMOTE через Module Federation).

**Важно**: Типы манифеста (`AppManifest`, `ModuleManifestEntry`) импортируются из `@platform/vite-config/plugins/types` — единого источника типов для всего проекта (см. задачу 006).

## Зависимости

- **Задача 001**: Реструктуризация проекта
- **Задача 006**: Vite плагины для Host (типы манифеста + manifestMiddleware)

## Подзадачи

### 1. Импорт типов манифеста из @platform/vite-config

**⚠️ ВАЖНО**: Типы манифеста НЕ дублируются, а импортируются из единого источника.

- [ ] Создать re-export в `host/src/bootstrap/interface.ts`:

  ```typescript
  // Реэкспорт типов манифеста из единого источника
  export type {
    AppManifest,
    ModuleManifestEntry,
  } from '@platform/vite-config/plugins/types';

  /**
   * Расширение типа манифеста для runtime использования
   * Включает user данные которые приходят с /app/start
   */
  export interface AppStartResponse extends AppManifest {
    user?: {
      permissions: string[];
      featureFlags: string[];
    };
  }
  ```

- [ ] Добавить path alias в `host/tsconfig.app.json`:

  ```json
  {
    "compilerOptions": {
      "paths": {
        "@platform/vite-config/*": ["../config/vite-config/*"]
      }
    }
  }
  ```

### 2. Обновление интерфейса Module

- [ ] Обновить `host/src/modules/interface.ts`:

  ```typescript
  /**
   * Расширенный интерфейс для Remote модулей
   */
  export interface RemoteModuleInfo {
    /**
     * URL к remoteEntry.js
     */
    entry: string;

    /**
     * Имя scope в Module Federation
     */
    scope: string;
  }

  /**
   * Модуль типа NORMAL с поддержкой remote загрузки
   */
  export interface NormalModule extends BaseModule {
    loadType?: ModuleLoadType.NORMAL;
    loadCondition?: ModuleLoadCondition;
    config: ModuleConfig | Promise<ModuleConfig>;

    /**
     * Информация о remote модуле (только для REMOTE источника)
     */
    remote?: RemoteModuleInfo;
  }
  ```

### 3. Создание ModulesDiscoveryHandler

- [ ] Создать `host/src/bootstrap/handlers/ModulesDiscoveryHandler.ts`:

  ```typescript
  import { AbstractInitHandler } from './AbstractInitHandler';
  import type { Bootstrap, AppStartResponse } from '../interface';
  // Типы манифеста из единого источника
  import type { ModuleManifestEntry } from '@platform/vite-config/plugins/types';
  import type {
    Module,
    NormalModule,
    InitModule,
    ModuleLoadType,
  } from '../../modules/interface';
  import type { ModuleConfig } from '../interface';

  /**
   * Handler для загрузки и обработки манифеста модулей
   *
   * Выполняет:
   * 1. Загрузку манифеста с /app/start
   * 2. Определение способа загрузки для каждого модуля (LOCAL/REMOTE)
   * 3. Создание объектов Module с конфигами
   * 4. Сохранение user данных в Bootstrap для AccessControl
   */
  export class ModulesDiscoveryHandler extends AbstractInitHandler {
    private readonly apiEndpoint = '/app/start';

    async handle(bootstrap: Bootstrap): Promise<Bootstrap> {
      try {
        // 1. Загружаем манифест
        const manifest = await this.loadManifest(bootstrap);

        // 2. Сохраняем user данные для AccessControl
        if (manifest.user) {
          bootstrap.setUserData(manifest.user);
        }

        // 3. Обрабатываем модули из манифеста
        const modules = await this.processModules(manifest.modules);

        // 4. Сохраняем модули в Bootstrap
        bootstrap.setDiscoveredModules(modules);

        console.log(
          `[ModulesDiscoveryHandler] Discovered ${modules.length} modules`,
        );
      } catch (error) {
        console.error(
          '[ModulesDiscoveryHandler] Failed to load manifest:',
          error,
        );
        // В случае ошибки используем fallback (пустой список)
        // INIT модули загрузятся из локальных sources
        bootstrap.setDiscoveredModules([]);
      }

      return super.handle(bootstrap);
    }

    private async loadManifest(
      bootstrap: Bootstrap,
    ): Promise<AppStartResponse> {
      const apiClient = bootstrap.getAPIClient;
      return apiClient.get<AppStartResponse>(this.apiEndpoint);
    }

    private async processModules(
      manifestEntries: ModuleManifestEntry[],
    ): Promise<Module[]> {
      const modules: Module[] = [];

      for (const entry of manifestEntries) {
        const module = await this.createModule(entry);
        if (module) {
          modules.push(module);
        }
      }

      return modules;
    }

    private async createModule(
      entry: ModuleManifestEntry,
    ): Promise<Module | null> {
      const isLocal = entry.remoteEntry === '';

      // Базовые поля модуля
      const baseModule = {
        name: entry.name,
        loadPriority: entry.loadPriority,
        loadCondition: {
          dependencies: entry.dependencies,
          featureFlags: entry.featureFlags,
          accessPermissions: entry.accessPermissions,
        },
      };

      if (entry.loadType === 'init') {
        // INIT модули всегда локальные, их конфиги уже загружены
        // Они обрабатываются отдельно в ModulesHandler
        return null;
      }

      // NORMAL модули
      const config = isLocal
        ? await this.loadLocalConfig(entry.name)
        : this.createRemoteConfigLoader(entry.name, entry.remoteEntry);

      const normalModule: NormalModule = {
        ...baseModule,
        loadType: 'normal' as ModuleLoadType.NORMAL,
        config,
      };

      // Добавляем remote info для REMOTE модулей
      if (!isLocal) {
        normalModule.remote = {
          entry: entry.remoteEntry,
          scope: `module-${entry.name}`,
        };
      }

      return normalModule;
    }

    /**
     * Загружает конфиг LOCAL модуля через Vite алиас
     */
    private async loadLocalConfig(moduleName: string): Promise<ModuleConfig> {
      // Vite алиас @platform/module-{name} настроен в moduleAliases плагине
      // Указывает на packages/{name}/src
      const module = await import(
        `@platform/module-${moduleName}/config/module_config`
      );
      return module.default;
    }

    /**
     * Создает lazy loader для REMOTE модуля
     * Фактическая загрузка происходит при первом обращении
     */
    private createRemoteConfigLoader(
      moduleName: string,
      remoteEntry: string,
    ): Promise<ModuleConfig> {
      // Возвращаем Promise который резолвится при загрузке через Federation
      return new Promise(async (resolve, reject) => {
        try {
          const remoteLoader = await import('../services/remoteModuleLoader');
          const config = await remoteLoader.loadRemoteModule(
            moduleName,
            remoteEntry,
          );
          resolve(config);
        } catch (error) {
          reject(error);
        }
      });
    }
  }
  ```

### 4. Обновление Bootstrap interface

- [ ] Добавить методы в `host/src/bootstrap/interface.ts`:

  ```typescript
  export interface Bootstrap {
    // ... существующие методы

    /**
     * Устанавливает данные пользователя из манифеста
     */
    setUserData(user: { permissions: string[]; featureFlags: string[] }): void;

    /**
     * Устанавливает модули, обнаруженные через манифест
     */
    setDiscoveredModules(modules: Module[]): void;

    /**
     * Получает модули, обнаруженные через манифест
     */
    getDiscoveredModules(): Module[];
  }
  ```

### 5. Реализация методов в Bootstrap классе

- [ ] Обновить `host/src/bootstrap/index.ts`:

  ```typescript
  class BootstrapImpl implements Bootstrap {
    private discoveredModules: Module[] = [];
    private userData: { permissions: string[]; featureFlags: string[] } | null =
      null;

    setUserData(user: { permissions: string[]; featureFlags: string[] }): void {
      this.userData = user;
    }

    getUserData() {
      return this.userData;
    }

    setDiscoveredModules(modules: Module[]): void {
      this.discoveredModules = modules;
    }

    getDiscoveredModules(): Module[] {
      return this.discoveredModules;
    }
  }
  ```

### 6. Интеграция в цепочку handlers

- [ ] Обновить `host/src/bootstrap/index.ts` для добавления handler в цепочку:

  ```typescript
  import { ModulesDiscoveryHandler } from './handlers/ModulesDiscoveryHandler';

  // Порядок handlers:
  // 1. APIClientHandler - инициализация HTTP клиента
  // 2. ModulesDiscoveryHandler - загрузка манифеста (НОВЫЙ)
  // 3. RouterHandler - создание роутера
  // 4. DIHandler - настройка DI
  // 5. InitI18nHandler - инициализация i18n
  // 6. MockServiceHandler - запуск MSW
  // 7. AccessControlHandler - настройка прав
  // 8. ModulesHandler - загрузка INIT модулей
  // 9. RouterPostHandler - предзагрузка роутов
  // 10. HTTPErrorHandler - обработка ошибок

  handler
    .setNext(new APIClientHandler(config))
    .setNext(new ModulesDiscoveryHandler(config)) // ← НОВЫЙ
    .setNext(new RouterHandler(config));
  // ... остальные handlers
  ```

### 7. Обновление ModulesHandler

- [ ] Обновить `host/src/bootstrap/handlers/ModulesHandler.ts` для использования discovered modules:

  ```typescript
  async handle(bootstrap: Bootstrap): Promise<Bootstrap> {
    // Получаем discovered modules (NORMAL модули из манифеста)
    const discoveredModules = bootstrap.getDiscoveredModules();

    // Загружаем INIT модули (они определены локально в modules.ts)
    const initModules = app_modules.filter(m => m.loadType === ModuleLoadType.INIT);

    // Объединяем: INIT модули + discovered NORMAL модули
    const allModules = [...initModules, ...discoveredModules];

    // Регистрируем все модули
    for (const module of allModules) {
      await this.moduleLoader.register(module);
    }

    // Загружаем INIT модули
    await this.moduleLoader.loadInitModules();

    return super.handle(bootstrap);
  }
  ```

### 8. Обновление AccessControlHandler

- [ ] Обновить для использования user данных из манифеста:

  ```typescript
  async handle(bootstrap: Bootstrap): Promise<Bootstrap> {
    const userData = bootstrap.getUserData();

    if (userData) {
      // Используем данные из манифеста
      accessControlModel.setPermissions(userData.permissions);
      accessControlModel.setFeatureFlags(userData.featureFlags);
    } else {
      // Fallback: загружаем из API или используем defaults
      await this.loadFromAPI(bootstrap);
    }

    return super.handle(bootstrap);
  }
  ```

### 9. Создание тестов

- [ ] Создать `host/src/bootstrap/handlers/__tests__/ModulesDiscoveryHandler.test.ts`:

  ```typescript
  import { describe, it, expect, vi, beforeEach } from 'vitest';
  import { ModulesDiscoveryHandler } from '../ModulesDiscoveryHandler';

  describe('ModulesDiscoveryHandler', () => {
    let handler: ModulesDiscoveryHandler;
    let mockBootstrap: any;

    beforeEach(() => {
      handler = new ModulesDiscoveryHandler({});
      mockBootstrap = {
        getAPIClient: {
          get: vi.fn(),
        },
        setUserData: vi.fn(),
        setDiscoveredModules: vi.fn(),
      };
    });

    it('should load manifest and set modules', async () => {
      const manifest = {
        modules: [
          {
            name: 'todo',
            loadType: 'normal',
            remoteEntry: '',
            loadPriority: 1,
          },
        ],
        user: { permissions: ['test'], featureFlags: ['feature1'] },
      };

      mockBootstrap.getAPIClient.get.mockResolvedValue(manifest);

      await handler.handle(mockBootstrap);

      expect(mockBootstrap.setUserData).toHaveBeenCalledWith(manifest.user);
      expect(mockBootstrap.setDiscoveredModules).toHaveBeenCalled();
    });

    it('should handle manifest loading error gracefully', async () => {
      mockBootstrap.getAPIClient.get.mockRejectedValue(
        new Error('Network error'),
      );

      await handler.handle(mockBootstrap);

      expect(mockBootstrap.setDiscoveredModules).toHaveBeenCalledWith([]);
    });
  });
  ```

### 10. Документация

- [ ] Добавить JSDoc комментарии ко всем публичным методам
- [ ] Обновить README bootstrap секции

## Definition of Done (DoD)

1. ✅ `ModulesDiscoveryHandler` создан и реализует загрузку манифеста
2. ✅ Handler корректно определяет LOCAL/REMOTE модули
3. ✅ Типы манифеста импортируются из `@platform/vite-config/plugins/types` (без дублирования)
4. ✅ `AppStartResponse` расширяет `AppManifest` добавляя user данные
5. ✅ Bootstrap расширен методами `setDiscoveredModules`, `setUserData`
6. ✅ Handler интегрирован в цепочку после `APIClientHandler`
7. ✅ `ModulesHandler` использует discovered modules
8. ✅ `AccessControlHandler` использует user данные из манифеста
9. ✅ Graceful degradation при ошибке загрузки манифеста
10. ✅ Unit тесты написаны и проходят
11. ✅ Приложение корректно запускается с манифестом

## Диаграмма потока

```
┌──────────────────┐
│  APIClientHandler │
└────────┬─────────┘
         │
         ▼
┌────────────────────────┐
│ ModulesDiscoveryHandler │ ◄── GET /app/start
└────────┬───────────────┘
         │
         │ Для каждого модуля:
         │ ├── LOCAL (remoteEntry === '')
         │ │   └── import('@platform/module-{name}')
         │ └── REMOTE (remoteEntry !== '')
         │     └── Создать lazy loader
         │
         ▼
┌──────────────────┐
│   RouterHandler   │
└────────┬─────────┘
         │
         ▼
      ... (остальные handlers)
         │
         ▼
┌──────────────────┐
│  ModulesHandler   │ ◄── Использует discovered modules
└──────────────────┘
```

## Риски и митигация

| Риск                            | Вероятность | Влияние | Митигация                                       |
| ------------------------------- | ----------- | ------- | ----------------------------------------------- |
| Ошибка загрузки манифеста       | Средняя     | Высокое | Graceful degradation, fallback на пустой список |
| Некорректный формат манифеста   | Низкая      | Среднее | Валидация с помощью Zod schema                  |
| Race condition с ModulesHandler | Низкая      | Высокое | Четкий порядок в цепочке handlers               |

## Время выполнения

Ожидаемое время: **6-8 часов**

## Архитектура типов манифеста

```
config/vite-config/plugins/types.ts     ← 🔑 ЕДИНЫЙ ИСТОЧНИК
       │
       ├── AppManifest
       ├── ModuleManifestEntry
       └── ...
       │
       ▼
host/src/bootstrap/interface.ts         ← Реэкспорт + расширение
       │
       ├── re-export { AppManifest, ModuleManifestEntry }
       └── AppStartResponse extends AppManifest
       │
       ▼
ModulesDiscoveryHandler.ts              ← Использует типы
```

## Примечания

- Handler должен быть вторым в цепочке (после APIClientHandler)
- INIT модули не обрабатываются этим handler'ом (они всегда локальные)
- Для REMOTE модулей создается lazy loader, загрузка происходит при первом обращении
- При ошибке загрузки манифеста приложение продолжает работать с INIT модулями
- **Типы манифеста НЕ дублируются** — используется единый источник из `@platform/vite-config`
