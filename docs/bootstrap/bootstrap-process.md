# Процесс Bootstrap

Bootstrap — механизм инициализации приложения, который подготавливает все необходимые сервисы перед рендерингом UI. Процесс выполняется последовательно через цепочку обработчиков и завершается загрузкой модулей.

## Обзор процесса

```
┌─────────────────────────────────────────────────────────────────┐
│                         main.tsx                                │
│  1. Настройка MobX и Logger                                     │
│  2. Вызов initBootstrap()                                       │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    initBootstrap()                              │
│  Создание и выполнение цепочки обработчиков                     │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Цепочка обработчиков                          │
│  APIClient → FederationShared → Router → DI → InitI18n →       │
│  OnAppStart → Modules → RouterPost → HTTPError                  │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Старт приложения                             │
│  1. router.start()                                              │
│  2. React render                                                │
│  3. Загрузка NORMAL модулей                                     │
└─────────────────────────────────────────────────────────────────┘
```

## Точка входа

Процесс начинается в `main.tsx`:

```typescript
// Настройка MobX
configure({ enforceActions: 'observed', useProxies: 'always' });

// Настройка логгера
log.setConfig({ level: getLogLevelFromEnv() });

// Запуск bootstrap
initBootstrap(new Bootstrap(app_modules), appConfig)
  .then((bootstrap) => {
    // Старт роутера
    bootstrap.routerService.router.start(() => {
      // Рендер React приложения
      createRoot(document.getElementById('root')!).render(
        <RouterProvider router={bootstrap.routerService.router}>
          <DIProvider container={bootstrap.di}>
            <I18nextProvider i18n={bootstrap.i18n}>
              <ThemeSchema>
                <Layout />
              </ThemeSchema>
            </I18nextProvider>
          </DIProvider>
        </RouterProvider>
      );

      // Загрузка NORMAL модулей после рендера
      bootstrap.moduleLoader.loadNormalModules();
    });
  });
```

## Класс Bootstrap

`Bootstrap` — центральный класс, содержащий все сервисы приложения:

| Свойство        | Тип                      | Назначение                        |
| --------------- | ------------------------ | --------------------------------- |
| `i18n`          | `i18n`                   | Экземпляр i18next для локализации |
| `routerService` | `BootstrapRouterService` | Сервис роутинга                   |
| `moduleLoader`  | `BootstrapModuleLoader`  | Загрузчик модулей                 |
| `di`            | `Container`              | DI-контейнер (Inversify)          |

### Методы Bootstrap

```typescript
class Bootstrap {
  // Инициализация API клиента
  initAPIClient(baseURL: string): void;

  // Инициализация DI контейнера
  initDI(): void;

  // Инициализация загрузчика модулей
  initModuleLoader(): void;

  // Работа с манифестом приложения
  setAppStartManifest(manifest: AppStartDTO): void;
  getAppStartManifest(): AppStartDTO | null;

  // Работа с discovered модулями
  setDiscoveredModules(modules: Module[]): void;
  getDiscoveredModules(): Module[];

  // Стартовые данные для dev режима (permissions, featureFlags)
  setUserData(user: UserData): void;
  getUserData(): UserData | null;

  // Управление состоянием приложения
  setIsAppStarted(): void;
  setIsBootstrapped(): void;
}
```

## Цепочка обработчиков

Реализует паттерн Цепочка ответственности (Chain of responsibility)

Обработчики выполняются последовательно. Каждый обработчик:

1. Выполняет свою задачу
2. Вызывает следующий обработчик через `super.handle(bootstrap)`

```typescript
const handler = new APIClientHandler(config);
handler
  .setNext(new FederationSharedHandler(config))
  .setNext(new RouterHandler(config))
  .setNext(new DIHandler(config))
  .setNext(new InitI18nHandler(config))
  .setNext(new OnAppStartHandler(config))
  .setNext(new ModulesHandler(config))
  .setNext(new RouterPostHandler(config))
  .setNext(new HTTPErrorHandler(config));

await handler.handle(bootstrap);
```

### Порядок обработчиков

| #   | Обработчик                | Задача                                                      |
| --- | ------------------------- | ----------------------------------------------------------- |
| 1   | `APIClientHandler`        | Создает HTTP-клиент для API запросов                        |
| 2   | `FederationSharedHandler` | Инициализирует shared scope для Module Federation           |
| 3   | `RouterHandler`           | Создает и настраивает роутер                                |
| 4   | `DIHandler`               | Инициализирует DI-контейнер, регистрирует APIClient         |
| 5   | `InitI18nHandler`         | Настраивает i18next с детектором языка                      |
| 6   | `OnAppStartHandler`       | Регистрирует модели и usecases, устанавливает пустые данные |
| 7   | `ModulesHandler`          | Инициализирует ModuleLoader, загружает INIT модули          |
| 8   | `RouterPostHandler`       | Предзагружает маршруты модулей, строит меню                 |
| 9   | `HTTPErrorHandler`        | Настраивает глобальную обработку HTTP ошибок                |

## Конфигурация приложения

Bootstrap получает конфигурацию из `appConfig`:

```typescript
interface IAppConfig {
  apiUrl?: string; // Базовый URL API
  appPrefix?: string; // Префикс URL приложения
  i18nOptions?: InitOptions; // Настройки i18next
  routes?: IRoutes; // Начальные маршруты
  routerPostInit?: (router) => router; // Кастомизация роутера
}
```

Значения загружаются из переменных окружения:

```typescript
export const appConfig: IAppConfig = {
  apiUrl: import.meta.env.VITE_API_URL,
  appPrefix: import.meta.env.VITE_APP_PREFIX || '',
  i18nOptions,
  routes: [],
};
```

## Фазы загрузки модулей

### Фаза 1: INIT модули

`ModulesHandler` загружает INIT модули синхронно до рендера UI:

1. Объединяет локальные модули из `modules.ts` с discovered модулями
2. Инициализирует `ModuleLoader`
3. Загружает все INIT модули

INIT модули устанавливают критичные данные: feature flags, permissions, базовые роуты.

### Фаза 2: Предзагрузка роутов

`RouterPostHandler`:

1. Вызывает `moduleLoader.preloadRoutes()` для всех доступных локальных модулей
2. Строит меню приложения из маршрутов
3. Передает DI-контейнер и меню в роутер

### Фаза 3: Загрузка манифеста (после рендера)

После рендера UI загружается манифест через `ManifestLoader`:

```typescript
// В main.tsx после рендера
const manifestLoader = new ManifestLoader(
  bootstrap.getAPIClient,
  bootstrap.moduleLoader,
  bootstrap,
);

const manifest = await manifestLoader.loadManifest();

if (manifest) {
  // Обрабатываем модули из манифеста
  await manifestLoader.processManifestModules(manifest);
}
```

**Что делает ManifestLoader:**

1. Загружает манифест с `/app/start`
2. Обновляет данные пользователя (feature flags, permissions, server parameters)
3. Создает объекты `Module` из записей манифеста
4. Объединяет локальные NORMAL модули с модулями из манифеста
5. Регистрирует NORMAL модули в ModuleLoader
6. Предзагружает маршруты новых модулей
7. Пересчитывает и обновляет меню

**Структура манифеста:**

```typescript
interface AppStartDTO {
  status: string;
  data: {
    modules: ModuleManifestEntry[]; // Список модулей
    features: Record<string, boolean>; // Feature flags
    permissions: Record<string, boolean>; // Разрешения
    params: Record<string, string>; // Серверные параметры
  };
}
```

### Фаза 4: NORMAL модули

После обработки манифеста загружаются NORMAL модули:

```typescript
bootstrap.moduleLoader
  .loadNormalModules()
  .then(() => {
    bootstrap.setIsAppStarted();
    bootstrap.routerService.navigateToCurrentRoute();
  })
  .catch((error) => {
    log.error('Error loading normal modules', error);
  });
```

NORMAL модули загружаются асинхронно и не блокируют отображение интерфейса.

## Module Federation Shared Scope

`FederationSharedHandler` регистрирует общие зависимости для remote модулей:

**Production:**

- react, react-dom
- mobx, mobx-react-lite
- inversify, reflect-metadata
- i18next, react-i18next
- @platform/core, @platform/ui, @platform/common, @platform/share

**Development:**

> **Важно:** Shared scope должен быть инициализирован ДО загрузки любых remote модулей.

## Порядок инициализации сервисов

```
APIClient
    │
    ▼
Federation Shared Scope
    │
    ▼
Router (создание)
    │
    ▼
DI Container
    │
    ▼
i18next
    │
    ▼
AccessControl (пустые данные)
    │
    ▼
ModuleLoader + INIT модули
    │
    ▼
Router (финализация, роуты локальных модулей, меню)
    │
    ▼
HTTP Error Handling
    │
    ▼
React Render
    │
    ▼
ManifestLoader (загрузка манифеста)
    │
    ▼
Обновление данных пользователя (permissions, features, params)
    │
    ▼
Регистрация NORMAL модулей из манифеста
    │
    ▼
NORMAL модули (async)
```

## Обработка ошибок

Bootstrap обрабатывает ошибки на каждом этапе:

```typescript
initBootstrap(new Bootstrap(app_modules), appConfig)
  .then((bootstrap) => {
    // Успешная инициализация
  })
  .catch((error: Error) => {
    log.error('Error initializing bootstrap', { prefix: 'bootstrap' }, error);
  });
```

Ошибки в отдельных модулях не блокируют загрузку остальных:

```typescript
// ManifestLoader
const results = await Promise.allSettled(modulePromises);
// Ошибка одного модуля не блокирует остальные
```

При ошибке загрузки манифеста приложение продолжает работу с локальными модулями (graceful degradation).

## ManifestLoader

`ManifestLoader` — сервис для загрузки и обработки манифеста приложения после рендера UI. Используется для динамической загрузки MFE модулей и обновления данных пользователя.

### Назначение

ManifestLoader выполняет следующие задачи:

1. **Загрузка манифеста** с сервера (`/app/start`)
2. **Обновление данных пользователя** (feature flags, permissions, server parameters)
3. **Создание модулей** из записей манифеста (LOCAL и REMOTE)
4. **Регистрация NORMAL модулей** в ModuleLoader
5. **Предзагрузка маршрутов** новых модулей
6. **Обновление меню** приложения

### Использование

```typescript
// В main.tsx после рендера
const manifestLoader = new ManifestLoader(
  bootstrap.getAPIClient,
  bootstrap.moduleLoader,
  bootstrap,
);

// Загружаем манифест
const manifest = await manifestLoader.loadManifest();

if (manifest) {
  // Обрабатываем модули из манифеста
  await manifestLoader.processManifestModules(manifest);
}
```

### Методы

#### `loadManifest()`

Загружает манифест с сервера и обновляет данные пользователя.

```typescript
async loadManifest(): Promise<AppStartDTO | null>
```

**Что делает:**

- Запрашивает манифест с `/app/start`
- Сохраняет манифест в `bootstrap.setAppStartManifest()`
- Обновляет данные пользователя (feature flags, permissions, params)
- Возвращает `null` при ошибке (graceful degradation)

#### `processManifestModules()`

Обрабатывает модули из манифеста и регистрирует их в ModuleLoader.

```typescript
async processManifestModules(manifest: AppStartDTO): Promise<void>
```

**Что делает:**

1. Создает объекты `Module` из записей манифеста
2. Фильтрует только NORMAL модули (INIT модулей в манифесте нет)
3. Объединяет локальные NORMAL модули с модулями из манифеста
4. Регистрирует NORMAL модули через `moduleLoader.addNormalModulesFromManifest()`
5. Предзагружает маршруты новых модулей
6. Пересчитывает и обновляет меню в роутере

### Создание модулей из манифеста

ManifestLoader создает модули двух типов:

#### LOCAL модули

Модули, у которых `remoteEntry === ''`. Конфигурация загружается через `import.meta.glob`:

```typescript
// Путь к конфигурации: packages/{moduleName}/src/config/module_config.ts
const config = await loadLocalConfig(moduleName);
```

#### REMOTE модули

Модули с указанным `remoteEntry`. Конфигурация загружается динамически:

```typescript
// Добавляется cache-buster для избежания кеширования
const remoteEntry = entry.remoteEntry + '?v=' + Date.now();
const config = await loadRemoteModule(moduleName, remoteEntry, {
  retries: 2,
  timeout: 1500,
  retryDelay: 1000,
});
```

### Объединение модулей

ManifestLoader объединяет локальные NORMAL модули с модулями из манифеста:

```typescript
// Локальные NORMAL модули (из app_modules)
const localNormalModules = app_modules.filter(
  (m) => m.loadType !== ModuleLoadType.INIT,
);

// NORMAL модули из манифеста
const normalModules = modules.filter(
  (m) => m.loadType !== ModuleLoadType.NORMAL,
);

// Объединение (приоритет у локальных)
const allNormalModules = [
  ...localNormalModules,
  ...normalModules.filter(
    (discovered) =>
      !localNormalModules.some((local) => local.name === discovered.name),
  ),
];
```

**Правило:** Если модуль с одинаковым именем есть и локально, и в манифесте, используется локальная версия.

### Обработка ошибок

ManifestLoader обрабатывает ошибки gracefully:

- **Ошибка загрузки манифеста:** возвращает `null`, приложение продолжает работу с локальными модулями
- **Ошибка создания модуля:** модуль пропускается, остальные обрабатываются
- **Ошибка загрузки конфигурации:** модуль пропускается с предупреждением в логах

```typescript
// Ошибки обрабатываются через Promise.allSettled
const results = await Promise.allSettled(modulePromises);
const modules = results
  .map((result) => {
    if (result.status === 'fulfilled') {
      return result.value;
    }
    return null;
  })
  .filter((m): m is Module => m !== null);
```

### Взаимодействие с ModuleLoader

ManifestLoader использует новый метод `addNormalModulesFromManifest()` для регистрации модулей:

```typescript
// Регистрация NORMAL модулей после загрузки манифеста
this.moduleLoader.addNormalModulesFromManifest(allNormalModules);

// Предзагрузка маршрутов
await this.moduleLoader.preloadRoutes();
```

Это позволяет регистрировать модули после инициализации ModuleLoader, когда уже доступны permissions и feature flags из манифеста.

---

> **См. также:** [Цепочка обработчиков](./handlers.md), [ModuleLoader](./module-loader.md), [Конфигурация модуля](../modules/module-config.md)
