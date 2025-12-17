# Конфигурация модуля

Каждый модуль имеет файл конфигурации `module_config.ts`, который определяет его поведение: маршруты, инициализацию, переводы и мок-данные для разработки.

## Структура конфигурации

```typescript
import { type ModuleConfig } from '@platform/core';

export default {
  // Маршруты модуля
  ROUTES: () => routes,

  // Инициализация модуля
  onModuleInit: (bootstrap) => {
    // DI, подписки, логирование
  },

  // Локализация
  I18N: (i18n) => {
    // Регистрация переводов
  },

  // MSW моки для dev-режима
  mockHandlers: handlers,

  // Информация о модуле для манифеста
  mockModuleInfo: {
    name: 'my-module',
    loadType: 'normal',
    // ...
  },

  // Мок-данные для dev-режима
  mockModuleData: {
    features: {},
    permissions: {},
    params: {},
  },
} as ModuleConfig;
```

## Интерфейс ModuleConfig

```typescript
interface ModuleConfig<TBootstrap extends IBootstrap = IBootstrap> {
  // Функция, возвращающая маршруты модуля
  ROUTES?: () => IRoute[];

  // Функция инициализации модуля
  onModuleInit?: (bootstrap: TBootstrap) => void | Promise<void>;

  // Функция настройки i18n
  I18N?: (i18n: ModuleI18n) => void;

  // MSW handlers для моков
  mockHandlers?: RequestHandler[];

  // Информация о модуле
  mockModuleInfo: ModuleManifestEntry;

  // Мок-данные модуля
  mockModuleData?: {
    features?: Record<string, boolean>;
    permissions?: Record<string, boolean>;
    params?: Record<string, unknown>;
  };
}
```

## ROUTES — Маршруты модуля

Функция `ROUTES` возвращает массив маршрутов модуля. Маршруты регистрируются автоматически при загрузке модуля.

### Базовый маршрут

```typescript
import { type IRoutes } from '@platform/core';
import { lazy } from 'react';

export const routes: IRoutes = [
  {
    name: 'my-module',
    path: '/my-module',
    browserTitle: 'My Module',
    pageComponent: lazy(() => import('../view/MyPage')),
  },
];
```

### Маршрут с меню

```typescript
{
  name: 'my-module',
  path: '/my-module',
  menu: {
    text: 'my-module:menu.title',  // Ключ перевода
    sortOrder: 100,                 // Порядок в меню (1-1000)
    icon: <MyIcon />,               // Иконка
  },
  pageComponent: lazy(() => import('../view/MyPage')),
}
```

### Хуки жизненного цикла маршрута

за более полным набором конфигурации роутинга, можно обратиться к документации роутера

```typescript
{
  name: 'todo',
  path: '/todo',
  pageComponent: lazy(() => import('../view/TodoPage')),

  // Вызывается при входе на маршрут
  onEnterNode: async (toState, fromState, deps) => {
    const container = deps.di;
    await container
      .get<LoadDataUsecase>(DI_TOKENS.LOAD_DATA)
      .execute();
  },

  // Вызывается при выходе с маршрута
  onExitNode: async (toState, fromState, deps) => {
    const container = deps.di;
    container
      .get<DisposeDataUsecase>(DI_TOKENS.DISPOSE_DATA)
      .execute();
  },
}
```

**Параметры хуков:**

| Параметр    | Тип                  | Описание                     |
| ----------- | -------------------- | ---------------------------- |
| `toState`   | `State`              | Состояние целевого маршрута  |
| `fromState` | `State`              | Состояние исходного маршрута |
| `deps`      | `RouterDependencies` | Зависимости (DI, menu)       |

### Редирект

```typescript
{
  name: 'home',
  path: '/',
  forwardTo: 'dashboard',  // Перенаправление на другой маршрут
}
```

### Полный интерфейс IRoute

```typescript
interface IRoute {
  // Уникальное имя маршрута
  name: string;

  // URL путь
  path: string;

  // Заголовок в браузере
  browserTitle?: string;

  // React компонент страницы (lazy)
  pageComponent?: FunctionComponent;

  // Перенаправление на другой маршрут
  forwardTo?: string;

  // Конфигурация меню
  menu?: {
    text: string;
    icon?: ReactNode;
    sortOrder?: number;
    viewCondition?: (router: Router) => boolean;
    navigate?: { id?: string; path: string };
    menuAlwaysExpand?: boolean;
  };

  // Вложенные маршруты
  children?: IRoute[];

  // Хуки жизненного цикла
  onEnterNode?: (toState, fromState, deps) => Promise<void>;
  onExitNode?: (toState, fromState, deps) => Promise<void>;
}
```

## onModuleInit — Инициализация модуля

Функция `onModuleInit` вызывается при загрузке модуля. Здесь вы настраиваете DI, подписки и выполняете начальную логику.

### Базовая инициализация

```typescript
onModuleInit: (bootstrap) => {
  // Регистрация DI
  DI_CONFIG(bootstrap.di);

  // Логирование
  log.debug('initialized', { prefix: 'module.my-module' });
},
```

### Асинхронная инициализация

```typescript
onModuleInit: async (bootstrap) => {
  // Регистрация DI
  DI_CONFIG(bootstrap.di);

  // Асинхронная загрузка данных
  const dataService = bootstrap.di.get<DataService>(DI_TOKENS.DATA_SERVICE);
  await dataService.preloadCriticalData();

  log.debug('initialized', { prefix: 'module.my-module' });
},
```

### Доступ к Bootstrap

Объект `bootstrap` предоставляет доступ к сервисам приложения:

```typescript
onModuleInit: (bootstrap) => {
  // DI контейнер
  const container = bootstrap.di;

  // i18n
  const i18n = bootstrap.i18n;

  // Роутер
  const router = bootstrap.routerService.router;

  // Конфигурация приложения
  const config = bootstrap.config;
},
```

## DI конфигурация

DI конфигурация выносится в отдельный файл `di.config.ts`.

### Токены DI

```typescript
// di.tokens.ts
export enum MY_MODULE_DI_TOKENS {
  // Models
  MODEL_DATA = 'MyModule.DataModel',

  // ViewModels
  VIEW_MODEL_DATA = 'MyModule.DataViewModel',

  // Usecases
  USECASE_LOAD_DATA = 'MyModule.LoadDataUsecase',
  USECASE_SAVE_DATA = 'MyModule.SaveDataUsecase',
}
```

### Регистрация зависимостей

```typescript
// di.config.ts
import type { Container } from 'inversify';
import { MY_MODULE_DI_TOKENS } from './di.tokens';
import { DataModel } from '../models/data.model';
import { DataViewModel } from '../viewmodels/data.vm';
import { LoadDataUsecase } from '../usecases/loadData.usecase';
import { SaveDataUsecase } from '../usecases/saveData.usecase';

export const DI_CONFIG = (container: Container) => {
  // Models
  container.bind(MY_MODULE_DI_TOKENS.MODEL_DATA).to(DataModel);

  // ViewModels
  container.bind(MY_MODULE_DI_TOKENS.VIEW_MODEL_DATA).to(DataViewModel);

  // Usecases
  container.bind(MY_MODULE_DI_TOKENS.USECASE_LOAD_DATA).to(LoadDataUsecase);
  container.bind(MY_MODULE_DI_TOKENS.USECASE_SAVE_DATA).to(SaveDataUsecase);

  return container;
};
```

## I18N — Локализация

Функция `I18N` регистрирует переводы модуля.

### Регистрация переводов

```typescript
import en from './i18n/en_my-module.json';
import ru from './i18n/ru_my-module.json';

I18N: (i18n) => {
  i18n.addResourceBundle('en', 'my-module', en);
  i18n.addResourceBundle('ru', 'my-module', ru);
},
```

### Структура файлов переводов

```
src/config/i18n/
├── en_my-module.json
└── ru_my-module.json
```

### Пример файла переводов

```json
{
  "menu": {
    "title": "My Module"
  },
  "page": {
    "header": "Welcome",
    "description": "This is my module"
  },
  "actions": {
    "save": "Save",
    "cancel": "Cancel"
  },
  "messages": {
    "success": "Operation completed",
    "error": "Something went wrong"
  }
}
```

### Использование в компонентах

```typescript
import { useTranslation } from 'react-i18next';

const MyComponent = () => {
  const { t } = useTranslation('my-module');

  return (
    <div>
      <h1>{t('page.header')}</h1>
      <p>{t('page.description')}</p>
    </div>
  );
};
```

### Плюрализация

```json
{
  "items": {
    "count_zero": "No items",
    "count_one": "{{count}} item",
    "count_other": "{{count}} items"
  }
}
```

```typescript
t('items.count', { count: 5 }); // "5 items"
```

## mockModuleInfo — Информация о модуле

Объект `mockModuleInfo` содержит метаданные модуля для манифеста. В DEV режиме эти данные используются для регистрации модуля.

```typescript
mockModuleInfo: {
  // Уникальное имя модуля
  name: 'my-module',

  // Тип загрузки: 'init' | 'normal'
  loadType: 'normal',

  // Приоритет загрузки (меньше = раньше)
  loadPriority: 10,

  // URL удаленного entry (пустой для локальных)
  remoteEntry: '',

  // Зависимости от других модулей
  dependencies: ['auth'],

  // Требуемые feature flags для загрузки
  featureFlags: ['my-module.enabled'],

  // Требуемые permissions для загрузки
  accessPermissions: ['my-module.access'],
},
```

### Типы загрузки

| Тип      | Когда загружается | Примеры                   |
| -------- | ----------------- | ------------------------- |
| `init`   | До рендера UI     | core, layout              |
| `normal` | После рендера UI  | todo, dashboard, settings |

### Зависимости

```typescript
// Модуль загрузится только после загрузки 'auth' и 'catalog'
dependencies: ['auth', 'catalog'],
```

> Зависимости поддерживаются только для `normal` модулей.

### Feature Flags и Permissions

```typescript
// Модуль загрузится только если:
// - feature flag 'admin.enabled' включен
// - permission 'admin.access' есть у пользователя
featureFlags: ['admin.enabled'],
accessPermissions: ['admin.access'],
```

## mockModuleData — Мок-данные

Объект `mockModuleData` содержит тестовые данные для DEV режима.

```typescript
mockModuleData: {
  // Feature flags модуля
  features: {
    'my-module.enabled': true,
    'my-module.new-feature': false,
  },

  // Permissions модуля
  permissions: {
    'my-module.access': true,
    'my-module.admin': false,
  },

  // Серверные параметры модуля
  params: {
    'my-module.api-url': 'https://api.example.com',
    'my-module.max-items': 100,
  },
},
```

Эти данные автоматически добавляются в `AccessControlModel` при загрузке модуля в DEV режиме.

## mockHandlers — API моки

MSW handlers для мокирования API в DEV режиме.

### Создание моков

```typescript
// config/mocks/index.ts
import { delay, http, HttpResponse, type RequestHandler } from 'msw';
import { ENDPOINTS } from '../endpoints';

export const handlers: RequestHandler[] = [
  // GET запрос
  http.get(ENDPOINTS.GET_DATA, async () => {
    await delay(500); // Имитация задержки сети

    return HttpResponse.json({
      items: [
        { id: 1, name: 'Item 1' },
        { id: 2, name: 'Item 2' },
      ],
    });
  }),

  // POST запрос
  http.post(ENDPOINTS.CREATE_ITEM, async ({ request }) => {
    const body = await request.json();

    await delay(300);

    return HttpResponse.json({
      id: Date.now(),
      ...body,
    });
  }),

  // Ошибка
  http.delete(ENDPOINTS.DELETE_ITEM, async () => {
    await delay(200);

    // Случайная ошибка в 20% случаев
    if (Math.random() > 0.8) {
      return HttpResponse.json({ error: 'Server error' }, { status: 500 });
    }

    return HttpResponse.json({ success: true });
  }),
];
```

### Регистрация моков

```typescript
// module_config.ts
import { handlers } from './mocks';

export default {
  // ...
  mockHandlers: handlers,
} as ModuleConfig;
```

### Мок-данные из файлов

```typescript
// config/mocks/index.ts
import { http, HttpResponse } from 'msw';
import mockData from './data/items.json';

export const handlers = [
  http.get('/api/items', () => {
    return HttpResponse.json(mockData);
  }),
];
```

## Полный пример конфигурации

```typescript
// config/module_config.ts
import { type ModuleConfig } from '@platform/core';
import { routes } from './routes';
import { DI_CONFIG } from './di.config';
import { handlers } from './mocks';
import { log } from '@platform/core';

import en from './i18n/en_my-module.json';
import ru from './i18n/ru_my-module.json';

export default {
  ROUTES: () => routes,

  onModuleInit: (bootstrap) => {
    DI_CONFIG(bootstrap.di);
    log.debug('initialized', { prefix: 'module.my-module' });
  },

  I18N: (i18n) => {
    i18n.addResourceBundle('en', 'my-module', en);
    i18n.addResourceBundle('ru', 'my-module', ru);
  },

  mockHandlers: handlers,

  mockModuleInfo: {
    name: 'my-module',
    loadType: 'normal',
    loadPriority: 10,
    remoteEntry: '',
    dependencies: [],
    featureFlags: ['my-module.enabled'],
    accessPermissions: ['my-module.access'],
  },

  mockModuleData: {
    features: {
      'my-module.enabled': true,
    },
    permissions: {
      'my-module.access': true,
    },
    params: {},
  },
} as ModuleConfig;
```

## Модуль без маршрутов

Некоторые модули не имеют UI и используются только для инициализации:

```typescript
// Модуль только с логикой инициализации
export default {
  onModuleInit: (bootstrap) => {
    DI_CONFIG(bootstrap.di);

    // Инициализация сервисов, подписок и т.д.
    const analyticsService = bootstrap.di.get(DI_TOKENS.ANALYTICS);
    analyticsService.init();
  },

  I18N: (i18n) => {
    i18n.addResourceBundle('en', 'common', en);
    i18n.addResourceBundle('ru', 'common', ru);
  },

  mockModuleInfo: {
    name: 'analytics',
    loadType: 'init',
    loadPriority: 1,
    remoteEntry: '',
    dependencies: [],
    featureFlags: [],
    accessPermissions: [],
  },
} as ModuleConfig;
```

## Различия MFE и локальных модулей

| Аспект           | MFE модуль           | Локальный модуль     |
| ---------------- | -------------------- | -------------------- |
| `mockModuleInfo` | Обязателен           | Не нужен             |
| `mockModuleData` | Используется         | Не нужен             |
| `mockHandlers`   | Используется         | Опционально          |
| Регистрация в DI | Через `onModuleInit` | Через `onModuleInit` |
| Переводы         | Через `I18N`         | Через `I18N`         |
| Маршруты         | Через `ROUTES`       | Через `ROUTES`       |

> Локальные модули не используют `mockModuleInfo` и `mockModuleData`, так как их параметры загрузки указываются напрямую в `host/src/modules/modules.ts`.

## Расширение конфигурации

Интерфейс `ModuleConfig` можно расширить, добавив собственные поля.

Вы можете расширить интерфейс `ModuleConfig`, добавив собственные поля:

```typescript
// host/src/bootstrap/interface.ts
import type { ModuleConfig as BaseModuleConfig } from '@platform/core';
import type { Bootstrap } from '.';

// Расширенный интерфейс конфигурации
export interface ModuleConfig extends BaseModuleConfig<Bootstrap> {
  // Дополнительные поля для вашего проекта
  analytics?: {
    trackPageView?: boolean;
    customEvents?: string[];
  };

  // Хук после загрузки всех модулей
  onAllModulesLoaded?: (bootstrap: Bootstrap) => void;

  // Метаданные модуля
  metadata?: {
    version: string;
    author: string;
    description: string;
  };
}
```

Использование в модуле:

```typescript
export default {
  ROUTES: () => routes,
  onModuleInit: (bootstrap) => {
    DI_CONFIG(bootstrap.di);
  },

  // Ваши дополнительные поля
  analytics: {
    trackPageView: true,
    customEvents: ['button_click', 'form_submit'],
  },

  metadata: {
    version: '1.0.0',
    author: 'Team A',
    description: 'User management module',
  },
} as ModuleConfig;
```

Для обработки новых полей добавьте логику в `LifecycleManager` или создайте отдельный обработчик:

```typescript
// host/src/bootstrap/services/moduleLoader/services/LifecycleManager.ts
class LifecycleManager {
  async initModule(module: InternalModule): Promise<void> {
    const config = module.resolvedConfig;

    // Стандартная инициализация
    await config.onModuleInit?.(this.bootstrap);

    // Обработка расширенных полей
    if (config.analytics?.trackPageView) {
      this.analyticsService.trackPageView(module.name);
    }

    if (config.onAllModulesLoaded) {
      this.pendingCallbacks.push(config.onAllModulesLoaded);
    }
  }
}
```

**Пример: добавление хука onModuleDestroy**

```typescript
// 1. Расширяем интерфейс
export interface ModuleConfig extends BaseModuleConfig<Bootstrap> {
  onModuleDestroy?: (bootstrap: Bootstrap) => void | Promise<void>;
}

// 2. Используем в модуле
export default {
  onModuleInit: (bootstrap) => {
    // Инициализация
    const subscription = someObservable.subscribe();
    bootstrap.di.bind('subscription').toConstantValue(subscription);
  },

  onModuleDestroy: (bootstrap) => {
    // Очистка при выгрузке модуля
    const subscription = bootstrap.di.get('subscription');
    subscription.unsubscribe();
  },
} as ModuleConfig;

// 3. Вызываем в ModuleLoader при выгрузке
async unloadModule(moduleName: string): Promise<void> {
  const module = this.registry.getModule(moduleName);
  await module.resolvedConfig.onModuleDestroy?.(this.bootstrap);
  // ... остальная логика выгрузки
}
```

> При расширении конфигурации следите за обратной совместимостью — новые поля должны быть опциональными.
