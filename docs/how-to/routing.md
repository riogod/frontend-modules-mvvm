# Расширение конфигурации роутинга

Платформа позволяет расширять конфигурацию роутинга двумя способами:

1. Добавление кастомных параметров в интерфейс `IRoute`
2. Внедрение дополнительных зависимостей через расширение `RouterDependencies`

## Расширение интерфейса IRoute

Интерфейс `IRoute` находится в `libs/core/src/Router/interfaces.ts` и расширяет `Route<RouterDependencies>` из библиотеки `@riogz/router`. Вы можете добавить свои поля прямо в этот интерфейс.

### Добавление кастомных полей

```typescript
// libs/core/src/Router/interfaces.ts
import type { Route } from '@riogz/router';
import type { Router } from '@riogz/router';
import type { FunctionComponent, ReactNode } from 'react';
import { type Container } from 'inversify';

export interface RouterDependencies {
  di: Container;
  menu: IMenuItem[];
}

export interface IRoute extends Route<RouterDependencies> {
  /**
   * Переопределение интерфейса дочерних роутов
   */
  children?: IRoute[];
  /**
   * Объект конфигурации отображения роута в меню
   */
  menu?: IMenuConfig;
  /**
   * Компонент отображаемой страницы
   */
  pageComponent?: FunctionComponent;

  /**
   * Кастомные метаданные маршрута (пример расширения)
   */
  meta?: {
    requiresAuth?: boolean;
    requiredPermission?: string;
    requiredFeatureFlag?: string;
    analytics?: {
      category: string;
      action: string;
    };
    customData?: Record<string, unknown>;
  };
}
```

### Использование кастомных полей в маршрутах

```typescript
// packages/my-module/src/config/routes.ts
import { type IRoutes } from '@platform/core';
import { lazy } from 'react';

export const routes: IRoutes = [
  {
    name: 'admin-panel',
    path: '/admin',
    browserTitle: 'Admin Panel',
    pageComponent: lazy(() => import('../view/AdminPage')),
    meta: {
      requiresAuth: true,
      requiredPermission: 'PERMISSION_ADMIN',
      analytics: {
        category: 'Navigation',
        action: 'Admin Panel Access',
      },
    },
  },
  {
    name: 'dashboard',
    path: '/dashboard',
    pageComponent: lazy(() => import('../view/DashboardPage')),
    meta: {
      requiredFeatureFlag: 'FEATURE_DASHBOARD',
    },
  },
];
```

### Использование кастомных полей в хуках

```typescript
// packages/my-module/src/config/routes.ts
import { type IRoutes } from '@platform/core';
import { lazy } from 'react';
import { IOC_CORE_TOKENS } from '@platform/core';
import type { AccessControlModel } from '@platform/common';

export const routes: IRoutes = [
  {
    name: 'protected-page',
    path: '/protected',
    pageComponent: lazy(() => import('../view/ProtectedPage')),
    meta: {
      requiresAuth: true,
      requiredPermission: 'PERMISSION_VIEW',
    },
    onEnterNode: async (toState, fromState, deps) => {
      const route = deps.router.getRoute(toState.name);
      const meta = route?.meta;

      // Проверка прав доступа
      if (meta?.requiredPermission) {
        const accessControl = deps.di.get<AccessControlModel>(
          IOC_CORE_TOKENS.MODEL_ACCESS_CONTROL,
        );

        if (!accessControl.hasPermission(meta.requiredPermission)) {
          deps.router.navigate('access-denied');
          return;
        }
      }
    },
  },
];
```

## Расширение RouterDependencies

`RouterDependencies` передается в хуки жизненного цикла маршрутов (`onEnterNode`, `onExitNode`) и доступен через `router.getDependencies()`. Вы можете расширить его своими сервисами.

### 1. Расширение интерфейса RouterDependencies

```typescript
// libs/core/src/Router/interfaces.ts
import { type Container } from 'inversify';

export interface RouterDependencies {
  di: Container;
  menu: IMenuItem[];

  // Добавление кастомных зависимостей
  analytics?: AnalyticsService;
  authService?: AuthService;
  customService?: CustomService;
}
```

### 2. Расширение RouterPostHandler

Модифицируйте `RouterPostHandler`, чтобы он устанавливал дополнительные зависимости после установки базовых:

```typescript
// host/src/bootstrap/handlers/RouterPostHandler.ts
import { AbstractInitHandler } from './AbstractInitHandler';
import type { Bootstrap } from '..';
import { log, type RouterDependencies } from '@platform/core';
import { AnalyticsService } from '../services/AnalyticsService';
import { AuthService } from '../services/AuthService';

export class RouterPostHandler extends AbstractInitHandler {
  async handle(bootstrap: Bootstrap): Promise<Bootstrap> {
    log.debug('RouterPostHandler: starting', {
      prefix: 'bootstrap.handlers.RouterPostHandler',
    });

    await bootstrap.moduleLoader.preloadRoutes();

    const { routerPostInit } = this.params;
    if (routerPostInit) {
      bootstrap.routerService.routerPostInit(routerPostInit);
    }

    const appMenu =
      bootstrap.routerService.buildRoutesMenu(bootstrap.routerService.routes) ||
      [];

    // Устанавливаем базовые зависимости
    const baseDependencies: RouterDependencies = {
      di: bootstrap.di,
      menu: appMenu,
    };

    // Создаем или получаем дополнительные сервисы
    const analytics = new AnalyticsService();
    const authService = new AuthService();

    // Устанавливаем расширенные зависимости
    bootstrap.routerService.router.setDependencies({
      ...baseDependencies,
      analytics,
      authService,
    } as RouterDependencies);

    log.debug('RouterPostHandler: completed', {
      prefix: 'bootstrap.handlers.RouterPostHandler',
    });
    return await super.handle(bootstrap);
  }
}
```

### Альтернатива: через параметр конфигурации

Если вы хотите сделать это более гибким, можно добавить функцию в `IAppConfig`:

```typescript
// host/src/config/app.ts
import { type RouterDependencies } from '@platform/core';

export interface IAppConfig {
  apiUrl?: string;
  appPrefix?: string;
  i18nOptions?: InitOptions<object>;
  routes?: IRoutes;
  routerPostInit?: (
    router: Router<RouterDependencies>,
  ) => Router<RouterDependencies>;

  // Функция для расширения зависимостей роутера
  extendRouterDependencies?: (
    baseDeps: RouterDependencies,
  ) => RouterDependencies;
}
```

Затем в `RouterPostHandler`:

```typescript
// host/src/bootstrap/handlers/RouterPostHandler.ts
const baseDependencies: RouterDependencies = {
  di: bootstrap.di,
  menu: appMenu,
};

// Расширяем зависимости через функцию из конфигурации, если она есть
const finalDependencies = this.params.extendRouterDependencies
  ? this.params.extendRouterDependencies(baseDependencies)
  : baseDependencies;

bootstrap.routerService.router.setDependencies(finalDependencies);
```

И в `appConfig`:

```typescript
// host/src/config/app.ts
export const appConfig: IAppConfig = {
  // ... другие настройки

  extendRouterDependencies: (baseDeps) => {
    const analytics = new AnalyticsService();
    const authService = new AuthService();

    return {
      ...baseDeps,
      analytics,
      authService,
    };
  },
};
```

### 4. Использование расширенных зависимостей в маршрутах

```typescript
// packages/my-module/src/config/routes.ts
import { type IRoutes } from '@platform/core';
import { lazy } from 'react';

export const routes: IRoutes = [
  {
    name: 'my-module',
    path: '/my-module',
    pageComponent: lazy(() => import('../view/MyPage')),
    onEnterNode: async (toState, fromState, deps) => {
      // Использование расширенных зависимостей
      const { analytics, authService, di } = deps;

      // Отправка аналитики
      if (analytics) {
        analytics.trackPageView(toState.name);
      }

      // Проверка аутентификации
      if (authService && !authService.isAuthenticated()) {
        deps.router.navigate('login');
        return;
      }

      // Использование стандартных зависимостей
      const useCase = di.get<LoadDataUsecase>(DI_TOKENS.USECASE_LOAD_DATA);
      await useCase.execute();
    },
  },
];
```

### 5. Использование в viewCondition меню

```typescript
// packages/my-module/src/config/routes.ts
import { type IRoutes } from '@platform/core';
import { lazy } from 'react';

export const routes: IRoutes = [
  {
    name: 'admin-panel',
    path: '/admin',
    menu: {
      text: 'admin:menu.title',
      viewCondition: (router) => {
        // Получаем зависимости
        const deps = router.getDependencies();
        const { authService } = deps;

        // Проверяем аутентификацию
        return authService?.isAuthenticated() ?? false;
      },
    },
    pageComponent: lazy(() => import('../view/AdminPage')),
  },
];
```

## Полный пример

### Расширение интерфейсов

```typescript
// libs/core/src/Router/interfaces.ts
import type { Route } from '@riogz/router';
import type { FunctionComponent, ReactNode } from 'react';
import { type Container } from 'inversify';

export interface RouterDependencies {
  di: Container;
  menu: IMenuItem[];
  // Кастомные зависимости
  analytics?: AnalyticsService;
  authService?: AuthService;
}

export interface IRoute extends Route<RouterDependencies> {
  children?: IRoute[];
  menu?: IMenuConfig;
  pageComponent?: FunctionComponent;
  // Кастомные поля
  meta?: {
    requiresAuth?: boolean;
    requiredPermission?: string;
    analytics?: {
      category: string;
      action: string;
    };
  };
}
```

### Модификация RouterPostHandler

```typescript
// host/src/bootstrap/handlers/RouterPostHandler.ts
import { AbstractInitHandler } from './AbstractInitHandler';
import type { Bootstrap } from '..';
import { log, type RouterDependencies } from '@platform/core';
import { AnalyticsService } from '../services/AnalyticsService';
import { AuthService } from '../services/AuthService';

export class RouterPostHandler extends AbstractInitHandler {
  async handle(bootstrap: Bootstrap): Promise<Bootstrap> {
    // ... существующий код ...

    const appMenu =
      bootstrap.routerService.buildRoutesMenu(bootstrap.routerService.routes) ||
      [];

    // Устанавливаем базовые зависимости
    const baseDependencies: RouterDependencies = {
      di: bootstrap.di,
      menu: appMenu,
    };

    // Создаем дополнительные сервисы
    const analytics = new AnalyticsService();
    const authService = new AuthService();

    // Устанавливаем расширенные зависимости
    bootstrap.routerService.router.setDependencies({
      ...baseDependencies,
      analytics,
      authService,
    } as RouterDependencies);

    return await super.handle(bootstrap);
  }
}
```

### Использование в модуле

```typescript
// packages/my-module/src/config/routes.ts
import { type IRoutes } from '@platform/core';
import { lazy } from 'react';
import { IOC_CORE_TOKENS } from '@platform/core';
import type { AccessControlModel } from '@platform/common';

export const routes: IRoutes = [
  {
    name: 'dashboard',
    path: '/dashboard',
    pageComponent: lazy(() => import('../view/DashboardPage')),
    meta: {
      requiresAuth: true,
      analytics: {
        category: 'Navigation',
        action: 'Dashboard View',
      },
    },
    onEnterNode: async (toState, fromState, deps) => {
      const route = deps.router.getRoute(toState.name);
      const { analytics, authService, di } = deps;

      // Проверка аутентификации
      if (
        route?.meta?.requiresAuth &&
        authService &&
        !authService.isAuthenticated()
      ) {
        deps.router.navigate('login');
        return;
      }

      // Отправка аналитики
      if (route?.meta?.analytics && analytics) {
        analytics.track(
          route.meta.analytics.category,
          route.meta.analytics.action,
        );
      }
    },
  },
];
```

## Важные замечания

1. **Модификация RouterPostHandler**: Расширение зависимостей выполняется прямо в `RouterPostHandler` после установки базовых зависимостей (`di`, `menu`).

2. **Опциональные зависимости**: Расширенные зависимости должны быть опциональными (`?`), так как они могут быть не установлены в некоторых случаях.

3. **Типизация**: При использовании расширенных зависимостей проверяйте их наличие, так как они опциональны.

4. **Сервисы**: Сервисы можно создавать в обработчике или получать из DI контейнера, если они там зарегистрированы.

5. **Гибкость**: Для большей гибкости можно использовать функцию `extendRouterDependencies` в `IAppConfig`, чтобы не модифицировать `RouterPostHandler` напрямую.
