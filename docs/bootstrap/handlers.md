# Цепочка обработчиков

Цепочка обработчиков реализует паттерн **Chain of Responsibility** для последовательной инициализации сервисов приложения. Каждый обработчик выполняет одну задачу и передает управление следующему.

## Паттерн Chain of Responsibility

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  Handler 1   │───▶│  Handler 2   │───▶│  Handler 3   │───▶ ...
│              │    │              │    │              │
│  handle()    │    │  handle()    │    │  handle()    │
└──────────────┘    └──────────────┘    └──────────────┘
```

**Преимущества:**

- Каждый обработчик изолирован и отвечает за одну задачу
- Легко добавить, удалить или переупорядочить обработчики
- Простое тестирование отдельных обработчиков
- Ошибка в одном обработчике не затрагивает код других

## Интерфейс обработчика

```typescript
interface InitHandler {
  setNext: (handler: InitHandler) => InitHandler;
  handle: (bootstrap: Bootstrap) => Promise<Bootstrap>;
}
```

| Метод               | Назначение                                                                                  |
| ------------------- | ------------------------------------------------------------------------------------------- |
| `setNext(handler)`  | Устанавливает следующий обработчик в цепочке. Возвращает переданный обработчик для chaining |
| `handle(bootstrap)` | Выполняет логику обработчика и вызывает следующий                                           |

## Абстрактный обработчик

Все обработчики наследуют `AbstractInitHandler`:

```typescript
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
```

**Ключевые моменты:**

- `params` — конфигурация приложения, доступна во всех обработчиках
- `setNext()` возвращает переданный обработчик, что позволяет строить цепочку через chaining
- `handle()` по умолчанию передает управление следующему обработчику

## Стандартные обработчики

### APIClientHandler

Создает HTTP-клиент для взаимодействия с API.

```typescript
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
```

**Параметры конфигурации:** `apiUrl`

> В dev режиме `apiUrl` может быть пустой строкой — запросы идут через Vite proxy.

---

### FederationSharedHandler

Инициализирует shared scope для Module Federation. Регистрирует общие зависимости (React, MobX, библиотеки платформы), чтобы remote модули использовали те же экземпляры.

```typescript
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
```

**Регистрируемые модули:**

- `react`, `react-dom`
- `mobx`, `mobx-react-lite`
- `inversify`, `reflect-metadata`
- `i18next`, `react-i18next`
- `@platform/core`, `@platform/ui`, `@platform/common`, `@platform/share`

> **Важно:** Этот обработчик должен выполняться ДО загрузки remote модулей.

---

### ModulesDiscoveryHandler

Загружает манифест приложения с сервера и создает объекты модулей.

```typescript
class ModulesDiscoveryHandler extends AbstractInitHandler {
  private readonly apiEndpoint = '/app/start';

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
```

**Задачи:**

1. Запрос манифеста с `/app/start`
2. Обработка списка модулей (LOCAL и REMOTE)
3. Создание объектов `Module` с конфигурациями
4. Сохранение в `bootstrap.setDiscoveredModules()`

При ошибке загрузки манифеста — продолжает работу с пустым списком модулей.

---

### RouterHandler

Создает и настраивает роутер приложения.

```typescript
class RouterHandler extends AbstractInitHandler {
  async handle(bootstrap: Bootstrap): Promise<Bootstrap> {
    const { routes, appPrefix } = this.params;

    if (routes) {
      bootstrap.routerService.initRouter(routes, appPrefix || '');
    }

    return await super.handle(bootstrap);
  }
}
```

**Параметры конфигурации:** `routes`, `appPrefix`

---

### DIHandler

Инициализирует DI-контейнер и регистрирует APIClient.

```typescript
class DIHandler extends AbstractInitHandler {
  async handle(bootstrap: Bootstrap): Promise<Bootstrap> {
    bootstrap.initDI();
    return await super.handle(bootstrap);
  }
}
```

Метод `bootstrap.initDI()` регистрирует `APIClient` в контейнере под токеном `IOC_CORE_TOKENS.APIClient`.

---

### InitI18nHandler

Настраивает i18next с детектором языка браузера.

```typescript
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
```

**Параметры конфигурации:** `i18nOptions`

После инициализации становится доступен метод `i18n.addResourceBundle()` для добавления переводов модулей.

---

### OnAppStartHandler

Регистрирует базовые модели и usecases в DI-контейнере, загружает permissions и feature flags.

```typescript
class OnAppStartHandler extends AbstractInitHandler {
  async handle(bootstrap: Bootstrap): Promise<Bootstrap> {
    // Регистрация в DI
    bootstrap.di
      .bind<AccessControlModel>(IOC_CORE_TOKENS.MODEL_ACCESS_CONTROL)
      .to(AccessControlModel);

    // ... регистрация usecases

    // Загрузка permissions и feature flags из манифеста
    const manifest = bootstrap.getAppStartManifest();
    const accessControlModel = bootstrap.di.get<AccessControlModel>(
      IOC_CORE_TOKENS.MODEL_ACCESS_CONTROL,
    );

    if (manifest?.data) {
      accessControlModel.setFeatureFlags(manifest.data.features || {});
      accessControlModel.setPermissions(manifest.data.permissions || {});
    }

    return await super.handle(bootstrap);
  }
}
```

**Регистрируемые сервисы:**

- `AccessControlModel` — управление feature flags и permissions
- Use cases для работы с флагами и разрешениями

---

### ModulesHandler

Инициализирует ModuleLoader и загружает INIT модули.

```typescript
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
```

**Порядок:**

1. Получает discovered модули из манифеста
2. Объединяет с локальными модулями из `modules.ts`
3. Инициализирует `ModuleLoader`
4. Загружает INIT модули синхронно

---

### RouterPostHandler

Предзагружает маршруты всех модулей и строит меню.

```typescript
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
```

**Параметры конфигурации:** `routerPostInit`

---

### HTTPErrorHandler

Настраивает глобальную обработку HTTP ошибок.

```typescript
class HTTPErrorHandler extends AbstractInitHandler {
  async handle(bootstrap: Bootstrap): Promise<Bootstrap> {
    // Настройка обработки ошибок
    return await super.handle(bootstrap);
  }
}
```

Последний обработчик в цепочке. Здесь можно настроить глобальные обработчики ошибок API.

## Создание своего обработчика

### Шаг 1: Создайте класс

```typescript
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
```

### Шаг 2: Добавьте в цепочку

```typescript
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
```

### Правила размещения

| Если обработчику нужен... | Разместите после... |
| ------------------------- | ------------------- |
| APIClient                 | `APIClientHandler`  |
| DI-контейнер              | `DIHandler`         |
| i18next                   | `InitI18nHandler`   |
| Feature flags/permissions | `OnAppStartHandler` |
| Загруженные INIT модули   | `ModulesHandler`    |
| Все маршруты              | `RouterPostHandler` |

## Пример: Analytics Handler

```typescript
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
```

Разместите после `OnAppStartHandler`, чтобы иметь доступ к манифесту.

## Обработка ошибок

Ошибка в обработчике прерывает всю цепочку:

```typescript
initBootstrap(new Bootstrap(app_modules), appConfig)
  .then((bootstrap) => {
    // Успех
  })
  .catch((error) => {
    // Ошибка в одном из обработчиков
    log.error('Bootstrap failed', error);
  });
```

Для graceful degradation обрабатывайте ошибки внутри обработчика:

```typescript
async handle(bootstrap: Bootstrap): Promise<Bootstrap> {
  try {
    await this.riskyOperation();
  } catch (error) {
    log.warn('Operation failed, continuing with defaults', error);
    // Продолжаем работу с fallback значениями
  }

  return await super.handle(bootstrap);
}
```
