import { type FC } from 'react';
import { Container, Typography, Paper } from '@platform/ui';
import { useTranslation } from 'react-i18next';
import { MarkdownRenderer } from '../../common';

const pageMarkdown = `# Процесс Bootstrap

Bootstrap — механизм инициализации приложения, который подготавливает все необходимые сервисы перед рендерингом UI. Процесс выполняется последовательно через цепочку обработчиков и завершается загрузкой модулей.

## Обзор процесса

\`\`\`
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
\`\`\`

## Точка входа

Процесс начинается в \`main.tsx\`:

\`\`\`typescript
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
\`\`\`

## Класс Bootstrap

\`Bootstrap\` — центральный класс, содержащий все сервисы приложения:

| Свойство        | Тип                      | Назначение                        |
| --------------- | ------------------------ | --------------------------------- |
| \`i18n\`          | \`i18n\`                   | Экземпляр i18next для локализации |
| \`routerService\` | \`BootstrapRouterService\` | Сервис роутинга                   |
| \`moduleLoader\`  | \`BootstrapModuleLoader\`  | Загрузчик модулей                 |
| \`di\`            | \`Container\`              | DI-контейнер (Inversify)          |

### Методы Bootstrap

\`\`\`typescript
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
\`\`\`

## Цепочка обработчиков

Реализует паттерн Цепочка ответственности (Chain of responsibility)

Обработчики выполняются последовательно. Каждый обработчик:

1. Выполняет свою задачу
2. Вызывает следующий обработчик через \`super.handle(bootstrap)\`

\`\`\`typescript
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
\`\`\`

### Порядок обработчиков

| #   | Обработчик                | Задача                                                             |
| --- | ------------------------- | ------------------------------------------------------------------ |
| 1   | \`APIClientHandler\`        | Создает HTTP-клиент для API запросов                               |
| 2   | \`FederationSharedHandler\` | Инициализирует shared scope для Module Federation                  |
| 3   | \`ModulesDiscoveryHandler\` | Загружает манифест и список модулей с сервера                      |
| 4   | \`RouterHandler\`           | Создает и настраивает роутер                                       |
| 5   | \`DIHandler\`               | Инициализирует DI-контейнер, регистрирует APIClient                |
| 6   | \`InitI18nHandler\`         | Настраивает i18next с детектором языка                             |
| 7   | \`OnAppStartHandler\`       | Регистрирует модели и usecases, загружает permissions/featureFlags |
| 8   | \`ModulesHandler\`          | Инициализирует ModuleLoader, загружает INIT модули                 |
| 9   | \`RouterPostHandler\`       | Предзагружает маршруты модулей, строит меню                        |
| 10  | \`HTTPErrorHandler\`        | Настраивает глобальную обработку HTTP ошибок                       |

## Конфигурация приложения

Bootstrap получает конфигурацию из \`appConfig\`:

\`\`\`typescript
interface IAppConfig {
  apiUrl?: string; // Базовый URL API
  appPrefix?: string; // Префикс URL приложения
  i18nOptions?: InitOptions; // Настройки i18next
  routes?: IRoutes; // Начальные маршруты
  routerPostInit?: (router) => router; // Кастомизация роутера
}
\`\`\`

Значения загружаются из переменных окружения:

\`\`\`typescript
export const appConfig: IAppConfig = {
  apiUrl: import.meta.env.VITE_API_URL,
  appPrefix: import.meta.env.VITE_APP_PREFIX || '',
  i18nOptions,
  routes: [],
};
\`\`\`

## Фазы загрузки модулей

### Фаза 1: Discovery

\`ModulesDiscoveryHandler\` загружает манифест с \`/app/start\`:

\`\`\`typescript
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
\`\`\`

Для каждого модуля из манифеста создается объект \`Module\` с конфигурацией.

### Фаза 2: INIT модули

\`ModulesHandler\` загружает INIT модули синхронно до рендера UI:

1. Объединяет локальные модули из \`modules.ts\` с discovered модулями
2. Инициализирует \`ModuleLoader\`
3. Загружает все INIT модули

INIT модули устанавливают критичные данные: feature flags, permissions, базовые роуты.

### Фаза 3: Предзагрузка роутов

\`RouterPostHandler\`:

1. Вызывает \`moduleLoader.preloadRoutes()\` для всех доступных модулей из стартового манифеста
2. Строит меню приложения из маршрутов
3. Передает DI-контейнер и меню в роутер

### Фаза 4: NORMAL модули

После рендера UI загружаются NORMAL модули:

\`\`\`typescript
bootstrap.moduleLoader.loadNormalModules().catch((error) => {
  log.error('Error loading normal modules', error);
});
\`\`\`

NORMAL модули загружаются асинхронно и не блокируют отображение интерфейса.

## Module Federation Shared Scope

\`FederationSharedHandler\` регистрирует общие зависимости для remote модулей:

**Production:**

- react, react-dom
- mobx, mobx-react-lite
- inversify, reflect-metadata
- i18next, react-i18next
- @platform/core, @platform/ui, @platform/common, @platform/share

**Development:**

> **Важно:** Shared scope должен быть инициализирован ДО загрузки любых remote модулей.

## Порядок инициализации сервисов

\`\`\`
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
\`\`\`

## Обработка ошибок

Bootstrap обрабатывает ошибки на каждом этапе:

\`\`\`typescript
initBootstrap(new Bootstrap(app_modules), appConfig)
  .then((bootstrap) => {
    // Успешная инициализация
  })
  .catch((error: Error) => {
    log.error('Error initializing bootstrap', { prefix: 'bootstrap' }, error);
  });
\`\`\`

Ошибки в отдельных модулях не блокируют загрузку остальных:

\`\`\`typescript
// ModulesDiscoveryHandler
const results = await Promise.allSettled(modulePromises);
// Ошибка одного модуля не блокирует остальные
\`\`\`

---

> **См. также:** Цепочка обработчиков, ModuleLoader, Конфигурация модуля


---

# Цепочка обработчиков

Цепочка обработчиков реализует паттерн **Chain of Responsibility** для последовательной инициализации сервисов приложения. Каждый обработчик выполняет одну задачу и передает управление следующему.

## Паттерн Chain of Responsibility

\`\`\`
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  Handler 1   │───▶│  Handler 2   │───▶│  Handler 3   │───▶ ...
│              │    │              │    │              │
│  handle()    │    │  handle()    │    │  handle()    │
└──────────────┘    └──────────────┘    └──────────────┘
\`\`\`

**Преимущества:**

- Каждый обработчик изолирован и отвечает за одну задачу
- Легко добавить, удалить или переупорядочить обработчики
- Простое тестирование отдельных обработчиков
- Ошибка в одном обработчике не затрагивает код других

## Интерфейс обработчика

\`\`\`typescript
interface InitHandler {
  setNext: (handler: InitHandler) => InitHandler;
  handle: (bootstrap: Bootstrap) => Promise<Bootstrap>;
}
\`\`\`

| Метод               | Назначение                                                                                  |
| ------------------- | ------------------------------------------------------------------------------------------- |
| \`setNext(handler)\`  | Устанавливает следующий обработчик в цепочке. Возвращает переданный обработчик для chaining |
| \`handle(bootstrap)\` | Выполняет логику обработчика и вызывает следующий                                           |

## Абстрактный обработчик

Все обработчики наследуют \`AbstractInitHandler\`:

\`\`\`typescript
abstract class AbstractInitHandler implements InitHandler {
  private nextHandler?: InitHandler;

  constructor(protected params: IAppConfig) {}

  setNext(handler: InitHandler): InitHandler {
    this.nextHandler = handler;
    return handler;
  }

  async handle(bootstrap: Bootstrap): Promise<Bootstrap> {
    if (this.nextHandler) {
      return await this.nextHandler.handle(bootstrap);
    }
    return bootstrap;
  }
}
\`\`\`

**Ключевые моменты:**

- \`params\` — конфигурация приложения, доступна во всех обработчиках
- \`setNext()\` возвращает переданный обработчик, что позволяет строить цепочку через chaining
- \`handle()\` по умолчанию передает управление следующему обработчику

## Стандартные обработчики

### APIClientHandler

Создает HTTP-клиент для взаимодействия с API.

\`\`\`typescript
class APIClientHandler extends AbstractInitHandler {
  async handle(bootstrap: Bootstrap): Promise<Bootstrap> {
    const { apiUrl } = this.params;

    if (apiUrl === undefined) {
      throw new Error('apiUrl in application config is not defined');
    }

    bootstrap.initAPIClient(apiUrl || '');
    return await super.handle(bootstrap);
  }
}
\`\`\`

**Параметры конфигурации:** \`apiUrl\`

> В dev режиме \`apiUrl\` может быть пустой строкой — запросы идут через Vite proxy.

---

### FederationSharedHandler

Инициализирует shared scope для Module Federation. Регистрирует общие зависимости (React, MobX, библиотеки платформы), чтобы remote модули использовали те же экземпляры.

\`\`\`typescript
class FederationSharedHandler extends AbstractInitHandler {
  async handle(bootstrap: Bootstrap): Promise<Bootstrap> {
    const isProd = import.meta.env.MODE === 'production';

    if (isProd) {
      this.initFederationSharedProd();
    } else {
      this.initFederationSharedDev();
    }

    return await super.handle(bootstrap);
  }
}
\`\`\`

**Регистрируемые модули:**

- \`react\`, \`react-dom\`
- \`mobx\`, \`mobx-react-lite\`
- \`inversify\`, \`reflect-metadata\`
- \`i18next\`, \`react-i18next\`
- \`@platform/core\`, \`@platform/ui\`, \`@platform/common\`, \`@platform/share\`

> **Важно:** Этот обработчик должен выполняться ДО загрузки remote модулей.

---

### ModulesDiscoveryHandler

Загружает манифест приложения с сервера и создает объекты модулей.

\`\`\`typescript
class ModulesDiscoveryHandler extends AbstractInitHandler {
  private readonly apiEndpoint =
    import.meta.env.VITE_APP_START_ENDPOINT ||
    import.meta.env.APP_START_ENDPOINT ||
    '/app/start';

  async handle(bootstrap: Bootstrap): Promise<Bootstrap> {
    try {
      const manifest = await this.loadManifest(bootstrap);
      const modules = await this.processModules(manifest.data.modules);
      bootstrap.setDiscoveredModules(modules);
    } catch (error) {
      log.error('Failed to load manifest', error);
      bootstrap.setDiscoveredModules([]);
    }

    return super.handle(bootstrap);
  }
}
\`\`\`

**Задачи:**

1. Запрос манифеста с \`/app/start\`
2. Обработка списка модулей (LOCAL и REMOTE)
3. Создание объектов \`Module\` с конфигурациями
4. Сохранение в \`bootstrap.setDiscoveredModules()\`

При ошибке загрузки манифеста — продолжает работу с пустым списком модулей.

---

### RouterHandler

Создает и настраивает роутер приложения.

\`\`\`typescript
class RouterHandler extends AbstractInitHandler {
  async handle(bootstrap: Bootstrap): Promise<Bootstrap> {
    const { routes, appPrefix } = this.params;

    if (routes) {
      bootstrap.routerService.initRouter(routes, appPrefix || '');
    }

    return await super.handle(bootstrap);
  }
}
\`\`\`

**Параметры конфигурации:** \`routes\`, \`appPrefix\`

---

### DIHandler

Инициализирует DI-контейнер и регистрирует APIClient.

\`\`\`typescript
class DIHandler extends AbstractInitHandler {
  async handle(bootstrap: Bootstrap): Promise<Bootstrap> {
    bootstrap.initDI();
    return await super.handle(bootstrap);
  }
}
\`\`\`

Метод \`bootstrap.initDI()\` регистрирует \`APIClient\` в контейнере под токеном \`IOC_CORE_TOKENS.APIClient\`.

---

### InitI18nHandler

Настраивает i18next с детектором языка браузера.

\`\`\`typescript
class InitI18nHandler extends AbstractInitHandler {
  async handle(bootstrap: Bootstrap): Promise<Bootstrap> {
    const bootstrapI18n = bootstrap.i18n;

    bootstrapI18n.use(LanguageDetector);
    bootstrapI18n.use(initReactI18next);

    if (this.params.i18nOptions) {
      await bootstrapI18n.init(this.params.i18nOptions);
    }

    return await super.handle(bootstrap);
  }
}
\`\`\`

**Параметры конфигурации:** \`i18nOptions\`

После инициализации становится доступен метод \`i18n.addResourceBundle()\` для добавления переводов модулей.

---

### OnAppStartHandler

Регистрирует базовые модели и usecases в DI-контейнере, загружает permissions, feature flags и server parameters.

\`\`\`typescript
class OnAppStartHandler extends AbstractInitHandler {
  async handle(bootstrap: Bootstrap): Promise<Bootstrap> {
    // Регистрация Models в DI
    bootstrap.di
      .bind<AccessControlModel>(IOC_CORE_TOKENS.MODEL_ACCESS_CONTROL)
      .to(AccessControlModel);
    bootstrap.di
      .bind<AppParamsModel>(IOC_CORE_TOKENS.MODEL_APP_PARAMS)
      .to(AppParamsModel);

    // Регистрация Usecases в DI
    // ... (feature flags, permissions, server parameters usecases)

    // Загрузка данных из манифеста
    const manifest = bootstrap.getAppStartManifest();
    const accessControlModel = bootstrap.di.get<AccessControlModel>(
      IOC_CORE_TOKENS.MODEL_ACCESS_CONTROL,
    );
    const appParamsModel = bootstrap.di.get<AppParamsModel>(
      IOC_CORE_TOKENS.MODEL_APP_PARAMS,
    );

    if (manifest?.data) {
      accessControlModel.setFeatureFlags(manifest.data.features || {});
      accessControlModel.setPermissions(manifest.data.permissions || {});
      appParamsModel.setParams(manifest.data.params || {});
    }

    return await super.handle(bootstrap);
  }
}
\`\`\`

**Регистрируемые сервисы:**

- \`AccessControlModel\` — управление feature flags и permissions
- \`AppParamsModel\` — управление серверными параметрами
- Use cases для работы с флагами, разрешениями и серверными параметрами

**Загружаемые данные из манифеста:**

- \`features\` — feature flags (через \`accessControlModel.setFeatureFlags()\`)
- \`permissions\` — разрешения (через \`accessControlModel.setPermissions()\`)
- \`params\` — серверные параметры (через \`appParamsModel.setParams()\`)

> **Подробнее:** См. Server Parameters для работы с серверными параметрами.

---

### ModulesHandler

Инициализирует ModuleLoader и загружает INIT модули.

\`\`\`typescript
class ModulesHandler extends AbstractInitHandler {
  async handle(bootstrap: Bootstrap): Promise<Bootstrap> {
    const discoveredModules = bootstrap.getDiscoveredModules();
    const localModules = app_modules;

    // Объединение локальных и discovered модулей
    const allModules = this.mergeModules(localModules, discoveredModules);

    // Инициализация ModuleLoader
    bootstrap.initModuleLoader();
    await bootstrap.moduleLoader.addModules(allModules);

    // Загрузка INIT модулей
    await bootstrap.moduleLoader.initInitModules();

    return await super.handle(bootstrap);
  }
}
\`\`\`

**Порядок:**

1. Получает discovered модули из манифеста
2. Объединяет с локальными модулями из \`modules.ts\`
3. Инициализирует \`ModuleLoader\`
4. Загружает INIT модули синхронно

---

### RouterPostHandler

Предзагружает маршруты всех модулей и строит меню.

\`\`\`typescript
class RouterPostHandler extends AbstractInitHandler {
  async handle(bootstrap: Bootstrap): Promise<Bootstrap> {
    // Предзагрузка маршрутов из всех модулей
    await bootstrap.moduleLoader.preloadRoutes();

    // Кастомизация роутера
    const { routerPostInit } = this.params;
    if (routerPostInit) {
      bootstrap.routerService.routerPostInit(routerPostInit);
    }

    // Построение меню
    const appMenu = bootstrap.routerService.buildRoutesMenu(
      bootstrap.routerService.routes,
    );

    // Передача зависимостей в роутер
    bootstrap.routerService.router.setDependencies({
      di: bootstrap.di,
      menu: appMenu,
    });

    return await super.handle(bootstrap);
  }
}
\`\`\`

**Параметры конфигурации:** \`routerPostInit\`

---

### HTTPErrorHandler

Настраивает глобальную обработку HTTP ошибок.

\`\`\`typescript
class HTTPErrorHandler extends AbstractInitHandler {
  async handle(bootstrap: Bootstrap): Promise<Bootstrap> {
    // Настройка обработки ошибок
    return await super.handle(bootstrap);
  }
}
\`\`\`

Последний обработчик в цепочке. Здесь можно настроить глобальные обработчики ошибок API.

## Создание своего обработчика

### Шаг 1: Создайте класс

\`\`\`typescript
// host/src/bootstrap/handlers/MyCustomHandler.ts
import { AbstractInitHandler } from './AbstractInitHandler';
import type { Bootstrap } from '..';
import { log } from '@platform/core';

export class MyCustomHandler extends AbstractInitHandler {
  async handle(bootstrap: Bootstrap): Promise<Bootstrap> {
    log.debug('MyCustomHandler: starting', {
      prefix: 'bootstrap.handlers.MyCustomHandler',
    });

    // Ваша логика инициализации
    // Доступ к конфигурации: this.params
    // Доступ к сервисам: bootstrap.di, bootstrap.routerService, etc.

    log.debug('MyCustomHandler: completed', {
      prefix: 'bootstrap.handlers.MyCustomHandler',
    });

    // Обязательно вызовите super.handle() для продолжения цепочки
    return await super.handle(bootstrap);
  }
}
\`\`\`

### Шаг 2: Добавьте в цепочку

\`\`\`typescript
// host/src/bootstrap/index.ts
import { MyCustomHandler } from './handlers/MyCustomHandler';

export const initBootstrap = async (
  bootstrap: Bootstrap,
  config: IAppConfig,
): Promise<Bootstrap> => {
  const handler = new APIClientHandler(config);
  handler
    .setNext(new FederationSharedHandler(config))
    .setNext(new ModulesDiscoveryHandler(config))
    .setNext(new RouterHandler(config))
    .setNext(new DIHandler(config))
    .setNext(new MyCustomHandler(config)) // Ваш обработчик
    .setNext(new InitI18nHandler(config))
    .setNext(new OnAppStartHandler(config))
    .setNext(new ModulesHandler(config))
    .setNext(new RouterPostHandler(config))
    .setNext(new HTTPErrorHandler(config));

  return await handler.handle(bootstrap);
};
\`\`\`

### Правила размещения

| Если обработчику нужен... | Разместите после... |
| ------------------------- | ------------------- |
| APIClient                 | \`APIClientHandler\`  |
| DI-контейнер              | \`DIHandler\`         |
| i18next                   | \`InitI18nHandler\`   |
| Feature flags/permissions | \`OnAppStartHandler\` |
| Загруженные INIT модули   | \`ModulesHandler\`    |
| Все маршруты              | \`RouterPostHandler\` |

## Пример: Analytics Handler

\`\`\`typescript
import { AbstractInitHandler } from './AbstractInitHandler';
import type { Bootstrap } from '..';
import { log } from '@platform/core';

/**
 * Инициализирует аналитику приложения
 */
export class AnalyticsHandler extends AbstractInitHandler {
  async handle(bootstrap: Bootstrap): Promise<Bootstrap> {
    log.debug('AnalyticsHandler: starting', {
      prefix: 'bootstrap.handlers.AnalyticsHandler',
    });

    // Получаем данные пользователя для аналитики
    const manifest = bootstrap.getAppStartManifest();

    if (manifest?.data) {
      // Инициализация аналитики с данными пользователя
      this.initAnalytics({
        features: Object.keys(manifest.data.features || {}),
        permissions: Object.keys(manifest.data.permissions || {}),
      });
    }

    log.debug('AnalyticsHandler: completed', {
      prefix: 'bootstrap.handlers.AnalyticsHandler',
    });

    return await super.handle(bootstrap);
  }

  private initAnalytics(userData: {
    features: string[];
    permissions: string[];
  }) {
    // Ваша логика инициализации аналитики
    // analytics.init({ userId, features, ... });
  }
}
\`\`\`

Разместите после \`OnAppStartHandler\`, чтобы иметь доступ к манифесту.

## Обработка ошибок

Ошибка в обработчике прерывает всю цепочку:

\`\`\`typescript
initBootstrap(new Bootstrap(app_modules), appConfig)
  .then((bootstrap) => {
    // Успех
  })
  .catch((error) => {
    // Ошибка в одном из обработчиков
    log.error('Bootstrap failed', error);
  });
\`\`\`

Для graceful degradation обрабатывайте ошибки внутри обработчика:

\`\`\`typescript
async handle(bootstrap: Bootstrap): Promise<Bootstrap> {
  try {
    await this.riskyOperation();
  } catch (error) {
    log.warn('Operation failed, continuing with defaults', error);
    // Продолжаем работу с fallback значениями
  }

  return await super.handle(bootstrap);
}
\`\`\`


---

# Зависимости модулей

Модули могут зависеть друг от друга. Модуль-зависимость должен быть загружен раньше модуля, который от него зависит. Зависимости поддерживаются только для NORMAL модулей (INIT модули не могут иметь зависимости).

## Как указать зависимости

Зависимости указываются в \`loadCondition.dependencies\`:

\`\`\`typescript
const module: NormalModule = {
  name: 'orders',
  loadType: ModuleLoadType.NORMAL,
  config: OrdersConfig,
  loadCondition: {
    // Этот модуль зависит от модулей 'auth' и 'catalog'
    dependencies: ['auth', 'catalog'],
  },
};
\`\`\`

Модуль \`orders\` загрузится только после загрузки \`auth\` и \`catalog\`.

## DEV vs PROD режим

| Режим | Что делает клиент             | Что делает сервер       |
| ----- | ----------------------------- | ----------------------- |
| DEV   | Полная обработка зависимостей | —                       |
| PROD  | Базовая проверка статусов     | Сортировка и фильтрация |

**DEV режим:**

\`\`\`
┌─────────────────────────────────────────────────────────────┐
│                      ModuleLoader                           │
│                                                             │
│  1. Читает dependencies из loadCondition                    │
│  2. Строит граф зависимостей                                │
│  3. Обнаруживает циклические зависимости                    │
│  4. Группирует модули по уровням                            │
│  5. Загружает уровень за уровнем                            │
└─────────────────────────────────────────────────────────────┘
\`\`\`

**PROD режим:**

\`\`\`
┌─────────────────────────────────────────────────────────────┐
│                   Сервер манифестов                         │
│                                                             │
│  1. Знает зависимости всех модулей                          │
│  2. Сортирует модули по зависимостям                        │
│  3. Возвращает модули в правильном порядке                  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      ModuleLoader                           │
│                                                             │
│  1. Проверяет статусы зависимостей                          │
│  2. Если зависимость в FAILED — пропускает модуль           │
│  3. Если зависимость не загружена — предупреждает           │
│  4. Загружает модули в порядке от сервера                   │
└─────────────────────────────────────────────────────────────┘
\`\`\`

> В PROD режиме тяжелый код (построение графа, уровней) не включается в бандл. Остается только легкая проверка статусов.

## Уровни загрузки (DEV режим)

В DEV режиме ModuleLoader группирует модули по уровням для параллельной загрузки:

\`\`\`
Модули: A, B, C, D, E
Зависимости:
  - B зависит от A
  - C зависит от A
  - D зависит от B и C
  - E без зависимостей

        ┌───────────────────────────────────┐
Уровень │           A           E           │ ← загружаются параллельно
   0    │      (нет зависимостей)           │
        └───────────────┬───────────────────┘
                        │
        ┌───────────────▼───────────────────┐
Уровень │         B           C             │ ← загружаются параллельно
   1    │    (зависит от A) (зависит от A)  │
        └───────────────┬───────────────────┘
                        │
        ┌───────────────▼───────────────────┐
Уровень │              D                    │
   2    │    (зависит от B и C)             │
        └───────────────────────────────────┘
\`\`\`

Модули одного уровня загружаются параллельно — это ускоряет загрузку.

## Правила зависимостей

### 1. INIT модули не поддерживают зависимости

\`\`\`typescript
// ❌ Неправильно — INIT модуль с зависимостями
const initModule: InitModule = {
  name: 'core',
  loadType: ModuleLoadType.INIT,
  config: CoreConfig,
  loadCondition: {
    // TypeScript ошибка!
    dependencies: ['other'],
  },
};

// ✅ Правильно — INIT модуль без зависимостей
const initModule: InitModule = {
  name: 'core',
  loadType: ModuleLoadType.INIT,
  config: CoreConfig,
  // loadCondition запрещен для INIT
};
\`\`\`

INIT модули загружаются по \`loadPriority\`, не по зависимостям.

### 2. Зависимость должна существовать

\`\`\`typescript
// ❌ Неправильно — зависимость от несуществующего модуля
const module: NormalModule = {
  name: 'orders',
  config: OrdersConfig,
  loadCondition: {
    dependencies: ['non-existent-module'], // Ошибка в runtime
  },
};
\`\`\`

При отсутствии зависимости модуль будет пропущен с предупреждением в консоли.

### 3. Циклические зависимости запрещены

\`\`\`typescript
// ❌ Неправильно — циклическая зависимость
const moduleA: NormalModule = {
  name: 'module-a',
  config: ConfigA,
  loadCondition: { dependencies: ['module-b'] },
};

const moduleB: NormalModule = {
  name: 'module-b',
  config: ConfigB,
  loadCondition: { dependencies: ['module-a'] }, // Цикл!
};
\`\`\`

При обнаружении цикла будет выброшена ошибка с указанием цепочки.

### 4. Транзитивные зависимости разрешаются автоматически

\`\`\`typescript
// A зависит от B, B зависит от C
// При загрузке A система автоматически загрузит: C → B → A
\`\`\`

Вам не нужно указывать транзитивные зависимости явно.

## Пример: модули интернет-магазина

\`\`\`typescript
export const app_modules: Module[] = [
  // INIT модули — без зависимостей, по приоритету
  {
    name: 'core',
    loadType: ModuleLoadType.INIT,
    loadPriority: 0,
    config: CoreConfig,
  },
  {
    name: 'layout',
    loadType: ModuleLoadType.INIT,
    loadPriority: 1,
    config: LayoutConfig,
  },

  // NORMAL модули — с зависимостями
  {
    name: 'auth',
    loadType: ModuleLoadType.NORMAL,
    config: AuthConfig,
    // Нет зависимостей — уровень 0
  },
  {
    name: 'catalog',
    loadType: ModuleLoadType.NORMAL,
    config: CatalogConfig,
    // Нет зависимостей — уровень 0
  },
  {
    name: 'cart',
    loadType: ModuleLoadType.NORMAL,
    config: CartConfig,
    loadCondition: {
      dependencies: ['auth', 'catalog'], // Уровень 1
    },
  },
  {
    name: 'checkout',
    loadType: ModuleLoadType.NORMAL,
    config: CheckoutConfig,
    loadCondition: {
      dependencies: ['cart'], // Уровень 2
    },
  },
  {
    name: 'order-history',
    loadType: ModuleLoadType.NORMAL,
    config: OrderHistoryConfig,
    loadCondition: {
      dependencies: ['auth'], // Уровень 1
    },
  },
];
\`\`\`

Порядок загрузки:

\`\`\`
1. INIT: core → layout (по loadPriority)

2. NORMAL уровень 0: auth, catalog (параллельно)

3. NORMAL уровень 1: cart, order-history (параллельно)

4. NORMAL уровень 2: checkout
\`\`\`

## Комбинация с другими условиями

Зависимости можно комбинировать с feature flags и permissions:

\`\`\`typescript
const module: NormalModule = {
  name: 'admin-orders',
  config: AdminOrdersConfig,
  loadCondition: {
    // Все условия должны выполняться
    featureFlags: ['admin.enabled'],
    accessPermissions: ['admin.orders.view'],
    dependencies: ['admin-core', 'orders'],
  },
};
\`\`\`

Порядок проверки:

1. Feature flags
2. Permissions
3. Dependencies

Если любое условие не выполнено — модуль не загружается.

> Feature flags и permissions проверяются в обоих режимах (DEV и PROD). Dependencies в PROD проверяются только по статусам.

## Отладка зависимостей (DEV режим)

Включите уровень логирования DEBUG для отслеживания:

\`\`\`bash
LOG_LEVEL=DEBUG npm run dev
\`\`\`

В консоли увидите:

\`\`\`
[DEBUG] moduleLoader.dependencyLevelBuilder: Группировка 5 модулей по уровням зависимостей
[DEBUG] moduleLoader.dependencyLevelBuilder: Уровень 1: auth, catalog
[DEBUG] moduleLoader.dependencyLevelBuilder: Уровень 2: cart, order-history
[DEBUG] moduleLoader.dependencyLevelBuilder: Уровень 3: checkout
[DEBUG] moduleLoader.dependencyLevelBuilder: Группировка завершена: 3 уровней, 0 пропущено
\`\`\`

При проблемах с зависимостями:

\`\`\`
[WARN] moduleLoader.dependencyLevelBuilder: Пропуск модулей с отсутствующими зависимостями: broken-module
[ERROR] moduleLoader.dependencyResolver: Обнаружена циклическая зависимость: A -> B -> C -> A
\`\`\`

## Загрузка по требованию

При переходе на маршрут незагруженного модуля зависимости загружаются автоматически.

**В DEV режиме** — полное разрешение транзитивных зависимостей:

\`\`\`typescript
// Пользователь переходит на /checkout
// ModuleLoader:
// 1. Находит модуль checkout
// 2. Видит зависимость cart
// 3. Видит зависимость cart от auth и catalog
// 4. Загружает: auth → catalog → cart → checkout
\`\`\`

**В PROD режиме** — модули уже загружены в правильном порядке сервером, загрузка по требованию только проверяет статусы.

Всё происходит автоматически — вам не нужно управлять этим вручную.

## Типы модулей

\`\`\`typescript
// INIT модуль — loadCondition запрещен
interface InitModule {
  name: string;
  loadType: ModuleLoadType.INIT;
  loadPriority?: number;
  config: ModuleConfig | Promise<ModuleConfig>;
  loadCondition?: never; // TypeScript запрещает
}

// NORMAL модуль — loadCondition разрешен
interface NormalModule {
  name: string;
  loadType?: ModuleLoadType.NORMAL;
  loadPriority?: number;
  config: ModuleConfig | Promise<ModuleConfig>;
  loadCondition?: {
    featureFlags?: string[];
    accessPermissions?: string[];
    dependencies?: string[];
  };
}
\`\`\`


---

# ModuleLoader

ModuleLoader — сервис загрузки и управления модулями приложения. Координирует весь процесс: от регистрации модулей до их инициализации.

## Два режима работы

ModuleLoader работает по-разному в dev и prod режимах:

\`\`\`
┌─────────────────────────────────────────────────────────────────┐
│                        DEV режим                                │
│                                                                 │
│  ModuleLoader сам обрабатывает:                                 │
│  • Проверку feature flags и permissions                         │
│  • Разрешение зависимостей между модулями                       │
│  • Обнаружение циклических зависимостей                         │
│  • Построение уровней загрузки                                  │
│                                                                 │
│  Модули берутся из локальных файлов + манифеста                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                        PROD режим                               │
│                                                                 │
│  Сервер манифестов уже сделал:                                  │
│  • Предварительную фильтрацию по feature flags и permissions    │
│  • Сортировку по зависимостям                                   │
│  • Проверку доступности модулей                                 │
│                                                                 │
│  ModuleLoader дополнительно:                                    │
│  • Проверяет feature flags и permissions (двойная защита)       │
│  • Проверяет статусы зависимостей (не FAILED)                   │
│  • Загружает модули в порядке от сервера                        │
└─────────────────────────────────────────────────────────────────┘
\`\`\`

**Почему так?**

- В dev режиме нет реального сервера — нужна полная локальная обработка
- В prod режиме сервер предварительно фильтрует модули, клиент делает финальную проверку
- Тяжелый код (граф зависимостей, уровни) не включается в prod-бандл

## Типы модулей

| Тип        | Когда загружается | Условия загрузки                        |
| ---------- | ----------------- | --------------------------------------- |
| **INIT**   | До рендера UI     | Нет (загружаются всегда)                |
| **NORMAL** | После рендера UI  | Feature flags, permissions, зависимости |

\`\`\`
Старт приложения
        │
        ▼
┌───────────────┐
│ INIT модули   │ ← Загружаются синхронно, блокируют UI
│ (core, layout)│
└───────┬───────┘
        │
        ▼
   React render
        │
        ▼
┌───────────────┐
│ NORMAL модули │ ← Загружаются асинхронно, не блокируют UI
│ (todo, api)   │
└───────────────┘
\`\`\`

## Жизненный цикл модуля

\`\`\`
pending → loading → preloaded → loaded
                        │
                        └──→ failed
\`\`\`

| Статус      | Описание                                              |
| ----------- | ----------------------------------------------------- |
| \`pending\`   | Модуль зарегистрирован, но не загружен                |
| \`loading\`   | Идет загрузка модуля                                  |
| \`preloaded\` | Маршруты зарегистрированы, полная инициализация позже |
| \`loaded\`    | Модуль полностью загружен и инициализирован           |
| \`failed\`    | Ошибка при загрузке                                   |

## Основные методы

### Инициализация

\`\`\`typescript
const moduleLoader = new BootstrapModuleLoader();

// Связь с Bootstrap
moduleLoader.init(bootstrap);

// Добавление модулей
await moduleLoader.addModules(allModules);
\`\`\`

### Загрузка модулей

\`\`\`typescript
// Загрузка INIT модулей (до рендера)
await moduleLoader.initInitModules();

// Предзагрузка маршрутов всех модулей
await moduleLoader.preloadRoutes();

// Загрузка NORMAL модулей (после рендера)
await moduleLoader.loadNormalModules();

// Загрузка конкретного модуля по имени
await moduleLoader.loadModuleByName('my-module');

// Автозагрузка при переходе на маршрут
await moduleLoader.autoLoadModuleByRoute('todo.list');
\`\`\`

### Получение информации

\`\`\`typescript
// Получить модуль по имени
const module = moduleLoader.getModule('todo');

// Проверить статус
const isLoaded = moduleLoader.isModuleLoaded('todo');
const isPreloaded = moduleLoader.isModulePreloaded('todo');
const status = moduleLoader.getModuleStatus('todo');

// Все модули
const modules = moduleLoader.getModules();

// Модули определенного типа
const initModules = moduleLoader.getModulesByType(ModuleLoadType.INIT);
\`\`\`

## Процесс загрузки

### INIT модули

1. ModuleLoader получает список INIT модулей
2. Сортирует по \`loadPriority\` (меньше = раньше)
3. Загружает **последовательно** — каждый следующий ждет предыдущий
4. Для каждого модуля:
   - Вызывает \`onModuleInit(bootstrap)\`
   - Регистрирует маршруты в роутере
   - Регистрирует переводы в i18n

\`\`\`
INIT модуль: core (priority: 0)
        │
        ▼
INIT модуль: core.layout (priority: 2)
        │
        ▼
... другие INIT модули
\`\`\`

### NORMAL модули

1. ModuleLoader получает список NORMAL модулей
2. **В DEV режиме:**
   - Проверяет feature flags и permissions
   - Строит уровни по зависимостям
   - Загружает уровень за уровнем (модули одного уровня — параллельно)
3. **В PROD режиме:**
   - Модули уже отсортированы сервером
   - Проверяет feature flags и permissions (двойная защита)
   - Проверяет статусы зависимостей (не FAILED)
   - Загружает в порядке от сервера

\`\`\`
Уровень 0: [модули без зависимостей]     ← параллельно
        │
        ▼
Уровень 1: [модули, зависящие от уровня 0] ← параллельно
        │
        ▼
Уровень 2: [модули, зависящие от уровня 1] ← параллельно
\`\`\`

## Условия загрузки

ModuleLoader проверяет условия загрузки для NORMAL модулей:

\`\`\`typescript
const module: NormalModule = {
  name: 'admin-panel',
  loadType: ModuleLoadType.NORMAL,
  config: AdminConfig,
  loadCondition: {
    // Требуемые feature flags
    featureFlags: ['admin.enabled'],

    // Требуемые разрешения
    accessPermissions: ['admin.access'],

    // Зависимости от других модулей
    dependencies: ['core', 'auth'],
  },
};
\`\`\`

Модуль загрузится только если:

- Все \`featureFlags\` включены
- Все \`accessPermissions\` есть у пользователя
- Все \`dependencies\` уже загружены

**Различия по режимам:**

| Условие       | DEV                     | PROD                                          |
| ------------- | ----------------------- | --------------------------------------------- |
| Feature flags | Проверяются на клиенте  | Проверяются на клиенте + сервер предфильтрует |
| Permissions   | Проверяются на клиенте  | Проверяются на клиенте + сервер предфильтрует |
| Dependencies  | Полное разрешение графа | Только проверка статусов                      |

> В PROD режиме сервер предварительно фильтрует модули, но клиент делает финальную проверку feature flags и permissions. Это двойная защита.

## Предзагрузка маршрутов

\`preloadRoutes()\` регистрирует роуты всех модулей из их конфигов до старта роутера:

\`\`\`typescript
// В bootstrap, перед router.start()
await moduleLoader.preloadRoutes();
\`\`\`

**Что происходит:**

1. **INIT модули** — маршруты регистрируются синхронно (они уже загружены)
2. **NORMAL модули** — только маршруты регистрируются синхронно, полная загрузка (\`onModuleInit\`, i18n) происходит асинхронно после рендера

Это оптимизирует время первого рендера — пользователь видит UI быстрее.

## Автозагрузка по маршруту

Когда пользователь переходит на маршрут незагруженного модуля:

\`\`\`typescript
// Роутер вызывает при переходе
await moduleLoader.autoLoadModuleByRoute('todo.list');
\`\`\`

ModuleLoader:

1. Находит модуль по имени маршрута
2. Проверяет, не загружен ли уже
3. Проверяет условия загрузки (feature flags, permissions)
4. Загружает зависимости (полный граф в DEV, проверка статусов в PROD)
5. Загружает модуль
6. Возвращает управление роутеру

## Обработка ошибок

Ошибка в одном модуле не блокирует загрузку остальных:

\`\`\`typescript
// ModuleLoader логирует ошибку и продолжает
await moduleLoader.loadNormalModules();
// Модули с ошибками помечаются как 'failed'
// Остальные модули загружаются нормально
\`\`\`

Проверка статуса после загрузки:

\`\`\`typescript
const status = moduleLoader.getModuleStatus('problematic-module');
if (status === ModuleLoadStatus.FAILED) {
  // Обработка ошибки
}
\`\`\`

## Архитектура ModuleLoader

\`\`\`
┌─────────────────────────────────────────────────────────────┐
│                      ModuleLoader                           │
│                        (Facade)                             │
└─────────────────────────────┬───────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌───────────────┐    ┌───────────────┐    ┌───────────────┐
│ ModuleRegistry│    │ StatusTracker │    │LifecycleManager│
│               │    │               │    │               │
│ • Хранение    │    │ • Статусы     │    │ • onModuleInit│
│ • Поиск       │    │ • События     │    │ • routes      │
│ • Сортировка  │    │               │    │ • i18n        │
└───────────────┘    └───────────────┘    └───────────────┘
                              │
        ┌─────────────────────┴─────────────────────┐
        │                                           │
        ▼                                           ▼
┌───────────────────────┐              ┌───────────────────────┐
│   InitLoadStrategy    │              │  NormalLoadStrategy   │
│                       │              │                       │
│ • Последовательная    │              │ • Параллельная        │
│   загрузка            │              │   загрузка по уровням │
└───────────────────────┘              └───────────────────────┘
\`\`\`

### Компоненты

| Компонент              | Назначение                                                       |
| ---------------------- | ---------------------------------------------------------------- |
| **ModuleRegistry**     | Хранит модули, поиск по имени/маршруту, сортировка по приоритету |
| **StatusTracker**      | Отслеживает статус каждого модуля (pending, loading, loaded...)  |
| **LifecycleManager**   | Вызывает хуки модуля: \`onModuleInit\`, регистрация routes и i18n  |
| **InitLoadStrategy**   | Стратегия для INIT модулей — последовательная загрузка           |
| **NormalLoadStrategy** | Стратегия для NORMAL модулей — параллельная загрузка по уровням  |

### DEV-only компоненты

Эти компоненты загружаются только в dev режиме (не попадают в prod-бандл):

| Компонент                  | Назначение                                   |
| -------------------------- | -------------------------------------------- |
| **ConditionValidator**     | Проверка feature flags, permissions          |
| **DependencyResolver**     | Разрешение зависимостей, обнаружение циклов  |
| **DependencyLevelBuilder** | Построение уровней для параллельной загрузки |

## Remote модули

ModuleLoader поддерживает загрузку remote модулей через Module Federation:

\`\`\`typescript
// Загрузка remote модуля
const config = await loadRemoteModule(
  'remote-module',
  'https://cdn.example.com/remoteEntry.js',
  { timeout: 5000, retries: 3 },
);
\`\`\`

Remote модули:

- Загружаются по URL из манифеста
- Используют shared scope для общих зависимостей
- Кешируются после первой загрузки


---

# UI Провайдеры

UI провайдеры — это React компоненты, которые транслируют контексты всем дочерним компонентам приложения. Они оборачивают корневой компонент и предоставляют доступ к DI-контейнеру, роутеру, i18n и теме.

## Иерархия провайдеров

\`\`\`
┌─────────────────────────────────────────────────────────┐
│                   RouterProvider                        │
│  ┌───────────────────────────────────────────────────┐  │
│  │                  DIProvider                       │  │
│  │  ┌─────────────────────────────────────────────┐  │  │
│  │  │              I18nextProvider                │  │  │
│  │  │  ┌───────────────────────────────────────┐  │  │  │
│  │  │  │             ThemeSchema               │  │  │  │
│  │  │  │  ┌─────────────────────────────────┐  │  │  │  │
│  │  │  │  │           Приложение            │  │  │  │  │
│  │  │  │  └─────────────────────────────────┘  │  │  │  │
│  │  │  └───────────────────────────────────────┘  │  │  │
│  │  └─────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
\`\`\`

## Код инициализации

\`\`\`typescript
// host/src/main.tsx
import { RouterProvider } from '@riogz/react-router';
import { DIProvider } from '@platform/ui';
import { I18nextProvider } from 'react-i18next';
import { ThemeSchema } from '@platform/share';

<RouterProvider router={bootstrap.routerService.router}>
  <DIProvider container={bootstrap.di}>
    <I18nextProvider i18n={bootstrap.i18n}>
      <ThemeSchema>
        {/* Приложение */}
      </ThemeSchema>
    </I18nextProvider>
  </DIProvider>
</RouterProvider>
\`\`\`

## RouterProvider

Предоставляет доступ к роутеру \`@riogz/router\`.

\`\`\`typescript
import { RouterProvider } from '@riogz/react-router';

<RouterProvider router={bootstrap.routerService.router}>
  {/* Приложение */}
</RouterProvider>
\`\`\`

**Что дает:**

- Навигация между маршрутами
- Доступ к параметрам URL
- Автозагрузка модулей при переходе

## DIProvider

Предоставляет доступ к DI-контейнеру Inversify.

\`\`\`typescript
import { DIProvider } from '@platform/ui';

<DIProvider container={bootstrap.di}>
  {/* Приложение */}
</DIProvider>
\`\`\`

**Что дает:**

- Доступ к ViewModels и сервисам через \`useVM\`
- Единый контейнер для всего приложения

**Использование в компонентах:**

\`\`\`typescript
import { useVM } from '@platform/ui';
import { IOC_TOKENS } from '../config/ioc';

const MyComponent = () => {
  // Получаем ViewModel из DI-контейнера
  const viewModel = useVM<MyViewModel>(IOC_TOKENS.MY_VIEW_MODEL);

  return <div>{viewModel.data}</div>;
};
\`\`\`

## I18nextProvider

Предоставляет доступ к i18next для интернационализации.

\`\`\`typescript
import { I18nextProvider } from 'react-i18next';

<I18nextProvider i18n={bootstrap.i18n}>
  {/* Приложение */}
</I18nextProvider>
\`\`\`

**Что дает:**

- Переводы через \`useTranslation\`
- Автоматическое определение языка
- Загрузка переводов из модулей

**Использование в компонентах:**

\`\`\`typescript
import { useTranslation } from 'react-i18next';

const MyComponent = () => {
  const { t } = useTranslation('my-module');

  return <div>{t('greeting')}</div>;
};
\`\`\`

## ThemeSchema

Предоставляет тему MUI (light/dark) и синхронизирует CSS переменные.

\`\`\`typescript
import { ThemeSchema } from '@platform/share';

<ThemeSchema>
  {/* Приложение */}
</ThemeSchema>
\`\`\`

**Что дает:**

- Переключение light/dark темы
- MUI компоненты с правильными цветами
- CSS переменные для использования в CSS Modules

**Как работает:**

\`\`\`typescript
// ThemeSchema использует UiSettingsViewModel для определения темы
const ThemeSchema = ({ children }) => {
  const ui = useVM<UiSettingsViewModel>(IOC_CORE_TOKENS.VIEW_MODEL_UI_SETTINGS);

  return (
    <Observer>
      {() => (
        <ThemeProvider theme={ui.themeMode === 'dark' ? themeDark : themeLight}>
          <CssVariablesSync />
          {children}
        </ThemeProvider>
      )}
    </Observer>
  );
};
\`\`\`

**CSS переменные:**

После \`CssVariablesSync\` вы можете использовать CSS переменные:

\`\`\`css
.myComponent {
  background-color: var(--mui-palette-background-paper);
  color: var(--mui-palette-text-primary);
}
\`\`\`

## Порядок провайдеров

Порядок важен! Провайдеры могут зависеть друг от друга:

| Порядок | Провайдер       | Зависит от                    |
| ------- | --------------- | ----------------------------- |
| 1       | RouterProvider  | —                             |
| 2       | DIProvider      | —                             |
| 3       | I18nextProvider | —                             |
| 4       | ThemeSchema     | DIProvider (использует useVM) |

> \`ThemeSchema\` должен быть внутри \`DIProvider\`, так как использует \`useVM\` для получения \`UiSettingsViewModel\`.

## Использование в модулях

Модули автоматически получают доступ ко всем контекстам:

\`\`\`typescript
// В любом компоненте модуля
import { useVM } from '@platform/ui';
import { useTranslation } from 'react-i18next';

const ModuleComponent = () => {
  // DI-контейнер доступен
  const vm = useVM<MyViewModel>(IOC_TOKENS.MY_VM);

  // i18n доступен
  const { t } = useTranslation('my-module');

  // Тема применена автоматически
  return <Button>{t('action')}</Button>;
};
\`\`\`

## Добавление своего провайдера

### 1. Создайте контекст и провайдер

\`\`\`typescript
// libs/ui/src/contexts/MyFeatureContext.ts
import { createContext, useContext } from 'react';

interface MyFeatureContextValue {
  someData: string;
  doSomething: () => void;
}

export const MyFeatureContext = createContext<MyFeatureContextValue | null>(
  null,
);

// Хук для использования контекста
export function useMyFeature(): MyFeatureContextValue {
  const context = useContext(MyFeatureContext);
  if (!context) {
    throw new Error('useMyFeature must be used within MyFeatureProvider');
  }
  return context;
}
\`\`\`

\`\`\`typescript
// libs/ui/src/providers/MyFeatureProvider.tsx
import { type FC, type PropsWithChildren, useMemo } from 'react';
import { MyFeatureContext } from '../contexts/MyFeatureContext';

interface MyFeatureProviderProps {
  initialData?: string;
}

export const MyFeatureProvider: FC<PropsWithChildren<MyFeatureProviderProps>> = ({
  children,
  initialData = '',
}) => {
  const value = useMemo(
    () => ({
      someData: initialData,
      doSomething: () => {
        console.log('Doing something');
      },
    }),
    [initialData],
  );

  return (
    <MyFeatureContext.Provider value={value}>
      {children}
    </MyFeatureContext.Provider>
  );
};
\`\`\`

### 2. Экспортируйте из библиотеки

\`\`\`typescript
// libs/ui/src/index.ts
export { MyFeatureProvider } from './providers/MyFeatureProvider';
export { useMyFeature } from './contexts/MyFeatureContext';
\`\`\`

### 3. Добавьте в иерархию провайдеров

\`\`\`typescript
// host/src/main.tsx
import { MyFeatureProvider } from '@platform/ui';

<RouterProvider router={bootstrap.routerService.router}>
  <DIProvider container={bootstrap.di}>
    <I18nextProvider i18n={bootstrap.i18n}>
      <ThemeSchema>
        <MyFeatureProvider initialData="some value">
          {/* Приложение */}
        </MyFeatureProvider>
      </ThemeSchema>
    </I18nextProvider>
  </DIProvider>
</RouterProvider>
\`\`\`

### 4. Используйте в компонентах

\`\`\`typescript
import { useMyFeature } from '@platform/ui';

const MyComponent = () => {
  const { someData, doSomething } = useMyFeature();

  return (
    <button onClick={doSomething}>
      {someData}
    </button>
  );
};
\`\`\`

### Правила размещения

| Если провайдер использует... | Разместите после...   |
| ---------------------------- | --------------------- |
| \`useVM\` (DI-контейнер)       | \`DIProvider\`          |
| \`useTranslation\` (i18n)      | \`I18nextProvider\`     |
| \`useTheme\` (MUI тема)        | \`ThemeSchema\`         |
| Ничего из вышеперечисленного | В любом месте цепочки |

### Провайдер с доступом к DI

Если провайдеру нужен доступ к DI-контейнеру:

\`\`\`typescript
import { useVM } from '@platform/ui';
import { IOC_CORE_TOKENS } from '@platform/core';

export const AnalyticsProvider: FC<PropsWithChildren> = ({ children }) => {
  // Получаем сервис из DI
  const apiClient = useVM<APIClient>(IOC_CORE_TOKENS.API_CLIENT);

  const value = useMemo(
    () => ({
      track: (event: string) => {
        apiClient.post('/analytics', { event });
      },
    }),
    [apiClient],
  );

  return (
    <AnalyticsContext.Provider value={value}>
      {children}
    </AnalyticsContext.Provider>
  );
};
\`\`\`

Такой провайдер должен быть внутри \`DIProvider\`.
`;

/**
 * Страница документации: Bootstrap.
 *
 * @component
 */
const BootstrapPage: FC = () => {
  const { t } = useTranslation('doc-platform');

  return (
    <Container maxWidth={false} sx={{ padding: 0 }}>
      <Typography variant="h4" gutterBottom>
        {t('menu.bootstrap')}
      </Typography>

      <Paper sx={(theme) => ({ width: '100%', p: theme.spacing(6) })}>
        <MarkdownRenderer content={pageMarkdown} />
      </Paper>
    </Container>
  );
};

export default BootstrapPage;
