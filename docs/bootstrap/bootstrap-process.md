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
│  APIClient → FederationShared → ModulesDiscovery → Router →     │
│  DI → InitI18n → OnAppStart → Modules → RouterPost → HTTPError  │
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
  .setNext(new ModulesDiscoveryHandler(config))
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

| #   | Обработчик                | Задача                                                             |
| --- | ------------------------- | ------------------------------------------------------------------ |
| 1   | `APIClientHandler`        | Создает HTTP-клиент для API запросов                               |
| 2   | `FederationSharedHandler` | Инициализирует shared scope для Module Federation                  |
| 3   | `ModulesDiscoveryHandler` | Загружает манифест и список модулей с сервера                      |
| 4   | `RouterHandler`           | Создает и настраивает роутер                                       |
| 5   | `DIHandler`               | Инициализирует DI-контейнер, регистрирует APIClient                |
| 6   | `InitI18nHandler`         | Настраивает i18next с детектором языка                             |
| 7   | `OnAppStartHandler`       | Регистрирует модели и usecases, загружает permissions/featureFlags |
| 8   | `ModulesHandler`          | Инициализирует ModuleLoader, загружает INIT модули                 |
| 9   | `RouterPostHandler`       | Предзагружает маршруты модулей, строит меню                        |
| 10  | `HTTPErrorHandler`        | Настраивает глобальную обработку HTTP ошибок                       |

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

### Фаза 1: Discovery

`ModulesDiscoveryHandler` загружает манифест с `/app/start`:

```typescript
// Структура манифеста
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

Для каждого модуля из манифеста создается объект `Module` с конфигурацией.

### Фаза 2: INIT модули

`ModulesHandler` загружает INIT модули синхронно до рендера UI:

1. Объединяет локальные модули из `modules.ts` с discovered модулями
2. Инициализирует `ModuleLoader`
3. Загружает все INIT модули

INIT модули устанавливают критичные данные: feature flags, permissions, базовые роуты.

### Фаза 3: Предзагрузка роутов

`RouterPostHandler`:

1. Вызывает `moduleLoader.preloadRoutes()` для всех доступных модулей из стартового манифеста
2. Строит меню приложения из маршрутов
3. Передает DI-контейнер и меню в роутер

### Фаза 4: NORMAL модули

После рендера UI загружаются NORMAL модули:

```typescript
bootstrap.moduleLoader.loadNormalModules().catch((error) => {
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
Modules Discovery (manifest)
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
AccessControl (permissions, features)
    │
    ▼
ModuleLoader + INIT модули
    │
    ▼
Router (финализация, роуты, меню)
    │
    ▼
HTTP Error Handling
    │
    ▼
React Render
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
// ModulesDiscoveryHandler
const results = await Promise.allSettled(modulePromises);
// Ошибка одного модуля не блокирует остальные
```

---

> **См. также:** [Цепочка обработчиков](./handlers.md), [ModuleLoader](./module-loader.md), [Конфигурация модуля](../modules/module-config.md)
