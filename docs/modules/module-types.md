# Типы модулей

Модули в платформе классифицируются по двум параметрам: **тип загрузки** (INIT/NORMAL) и **расположение** (local/MFE).

## Классификация модулей

```
                    ┌─────────────────────────────────────┐
                    │            Модули                   │
                    └─────────────────┬───────────────────┘
                                      │
            ┌─────────────────────────┴─────────────────────────┐
            │                                                   │
  ┌─────────▼─────────┐                               ┌─────────▼─────────┐
  │  По типу загрузки │                               │  По расположению  │
  └─────────┬─────────┘                               └─────────┬─────────┘
            │                                                   │
    ┌───────┴───────┐                                   ┌───────┴───────┐
    │               │                                   │               │
┌───▼───┐       ┌───▼────┐                         ┌────▼───┐      ┌────▼───┐
│ INIT  │       │ NORMAL │                         │ Local  │      │  MFE   │
└───────┘       └────────┘                         └────────┘      └────────┘
```

## Типы по загрузке: INIT vs NORMAL

### INIT модули

INIT модули загружаются **до рендера UI**. Используйте их для критической функциональности, без которой приложение не может работать.

```typescript
// host/src/modules/modules.ts
{
  name: 'core',
  config: CoreConfig,
  loadType: ModuleLoadType.INIT,
  loadPriority: 0,  // Загрузится первым
}
```

**Характеристики:**

| Параметр         | Значение                          |
| ---------------- | --------------------------------- |
| Момент загрузки  | До рендера UI                     |
| Порядок загрузки | Последовательно по `loadPriority` |
| Условия загрузки | Серверная фильтрация (только MFE) |
| Зависимости      | Не поддерживаются                 |
| Блокирует рендер | Да                                |
| Типичные примеры | core, layout, auth, analytics     |

**Когда использовать:**

- Базовая инфраструктура (DI-токены, глобальные сервисы)
- Основной layout приложения
- Авторизация и проверка сессии
- Глобальные обработчики ошибок
- Analytics и мониторинг

### NORMAL модули

NORMAL модули загружаются **после рендера базового UI**, параллельно по уровням зависимостей.

```typescript
// host/src/modules/modules.ts
{
  name: 'dashboard',
  config: DashboardConfig,
  loadType: ModuleLoadType.NORMAL,
  loadPriority: 10,
  loadCondition: {
    featureFlags: ['dashboard.enabled'],
    accessPermissions: ['dashboard.access'],
    dependencies: ['auth'],
  },
}
```

**Характеристики:**

| Параметр         | Значение                                      |
| ---------------- | --------------------------------------------- |
| Момент загрузки  | После рендера UI                              |
| Порядок загрузки | Параллельно по уровням зависимостей           |
| Условия загрузки | Поддерживаются (featureFlags, permissions)    |
| Зависимости      | Поддерживаются                                |
| Блокирует рендер | Нет                                           |
| Типичные примеры | dashboard, settings, reports, user-management |

**Когда использовать:**

- Бизнес-функциональность
- Страницы, доступные не всем пользователям
- Модули с зависимостями от других модулей
- Функциональность под feature flags

**Зависимости и DI:**

Зависимости между модулями гарантируют порядок инициализации. Если модуль `orders` зависит от модуля `catalog`, то `catalog` загрузится и выполнит `onModuleInit` **до** загрузки `orders`. Это позволяет `orders` использовать DI-токены, зарегистрированные модулем `catalog`:

```typescript
// Модуль catalog регистрирует свои сервисы
// packages/catalog/src/config/di.config.ts
export const DI_CONFIG = (container: Container) => {
  container.bind(CATALOG_TOKENS.PRODUCT_SERVICE).to(ProductService);
};

// Модуль orders зависит от catalog и использует его сервисы
// packages/orders/src/config/module_config.ts
mockModuleInfo: {
  name: 'orders',
  dependencies: ['catalog'],  // Гарантирует, что catalog загружен
  // ...
}

// packages/orders/src/usecases/CreateOrder.ts
@injectable()
class CreateOrderUsecase {
  constructor(
    @inject(CATALOG_TOKENS.PRODUCT_SERVICE)
    private productService: ProductService,  // Токен уже зарегистрирован
  ) {}
}
```

> Без указания зависимости модуль может загрузиться раньше и получить ошибку "No matching bindings found" при резолве DI-токена.

### Сравнение INIT и NORMAL

| Аспект               | INIT                                   | NORMAL                                  |
| -------------------- | -------------------------------------- | --------------------------------------- |
| `loadType`           | `ModuleLoadType.INIT`                  | `ModuleLoadType.NORMAL` (или не указан) |
| `loadCondition`      | Запрещен                               | Разрешен                                |
| `loadPriority`       | Критичен для порядка                   | Влияет на очередность                   |
| Загрузка             | Последовательно                        | Параллельно по уровням                  |
| UI во время загрузки | Loader/Splash screen                   | Приложение уже работает                 |
| Ошибка загрузки      | Критическая (приложение не запустится) | Graceful degradation                    |

## Типы по расположению: Local vs MFE

### Local модули

Local модули находятся в `host/src/modules/` и являются частью хост-приложения.

```
host/src/modules/
├── core/                    # INIT модуль
│   └── config/
│       ├── module_config.ts
│       ├── routes.ts
│       └── di.config.ts
├── core.layout/             # INIT модуль
│   └── config/
│       └── ...
└── local-normal/            # NORMAL модуль
    └── config/
        └── ...
```

**Характеристики:**

- Регистрируются вручную в `modules.ts`
- Конфиг импортируется синхронно
- Не требуют `mockModuleInfo` (параметры указаны в `modules.ts`)
- `mockModuleData` опционален (можно указать в конфиге или в `appStartData.json`)
- Собираются вместе с хостом

**Регистрация:**

```typescript
// host/src/modules/modules.ts
import CoreConfig from './core/config/module_config';
import LocalModuleConfig from './local-normal/config/module_config';

export const app_modules: Module[] = [
  {
    name: 'core',
    config: CoreConfig, // Синхронный импорт
    loadType: ModuleLoadType.INIT,
    loadPriority: 0,
  },
  {
    name: 'local-module',
    config: LocalModuleConfig, // Синхронный импорт
    loadType: ModuleLoadType.NORMAL,
    loadCondition: {
      featureFlags: ['local-module.enabled'],
    },
  },
];
```

**Конфигурация local модуля:**

```typescript
// host/src/modules/local-normal/config/module_config.ts
import { type ModuleConfig } from '@platform/core';

export default {
  ROUTES: () => routes,
  onModuleInit: (bootstrap) => {
    DI_CONFIG(bootstrap.di);
  },
  I18N: (i18n) => {
    i18n.addResourceBundle('en', 'local-normal', en);
    i18n.addResourceBundle('ru', 'local-normal', ru);
  },
  // mockModuleInfo НЕ нужен — параметры указаны в modules.ts
  // mockModuleData опционален — можно указать здесь или в appStartData.json
  mockHandlers: handlers, // Опционально, для API моков
} as ModuleConfig;
```

### MFE модули

MFE (Micro-Frontend) модули находятся в `packages/` и собираются отдельно от хоста.

```
packages/
├── todo/                    # MFE модуль
│   ├── src/
│   │   ├── config/
│   │   │   ├── module_config.ts
│   │   │   ├── routes.ts
│   │   │   └── di.config.ts
│   │   ├── models/
│   │   ├── viewmodels/
│   │   ├── usecases/
│   │   └── view/
│   ├── package.json
│   └── vite.config.mts
└── dashboard/               # MFE модуль
    └── ...
```

**Характеристики:**

- Регистрируются автоматически (Launcher в DEV, манифест в PROD)
- Конфиг загружается через Module Federation (remote) или динамически
- Требуют `mockModuleInfo` и `mockModuleData` для DEV режима
- Собираются отдельно, имеют свой `package.json`

### Сравнение Local и MFE

| Аспект             | Local                          | MFE                             |
| ------------------ | ------------------------------ | ------------------------------- |
| Расположение       | `host/src/modules/`            | `packages/`                     |
| Регистрация        | Вручную в `modules.ts`         | Автоматически                   |
| `mockModuleInfo`   | Не нужен                       | Обязателен                      |
| `mockModuleData`   | Опционально (или appStartData) | Обязателен для условий загрузки |
| Сборка             | Вместе с хостом                | Отдельно                        |
| Загрузка кода      | Синхронно из бандла            | Через Module Federation         |
| Независимый деплой | Нет                            | Да                              |
| Создание           | Вручную или копированием       | Через Launcher                  |

## Комбинации типов

Модули могут комбинировать оба параметра:

| Тип загрузки | Расположение | Пример                | Описание                     |
| ------------ | ------------ | --------------------- | ---------------------------- |
| INIT         | Local        | `core`, `core.layout` | Базовая инфраструктура хоста |
| INIT         | MFE          | `auth`, `analytics`   | Критические микрофронтенды   |
| NORMAL       | Local        | `local-module`        | Фичи, встроенные в хост      |
| NORMAL       | MFE          | `todo`, `dashboard`   | Независимые микрофронтенды   |

## Выбор типа модуля

### Схема принятия решения

```
Модуль критичен для старта приложения?
│
├── Да → INIT
│         │
│         └── Нужен независимый деплой?
│              ├── Да → INIT + MFE
│              └── Нет → INIT + Local
│
└── Нет → NORMAL
           │
           └── Нужен независимый деплой?
                ├── Да → NORMAL + MFE
                └── Нет → NORMAL + Local
```

### Рекомендации

**Выберите INIT + Local:**

- Базовый layout приложения
- Глобальные DI-токены
- Обработчики ошибок

**Выберите INIT + MFE:**

- Модуль авторизации (для независимого обновления)
- Analytics SDK
- A/B тестирование
- Страницы на которые осуществляется переход при старте приложения

**Выберите NORMAL + Local:**

- Простые страницы без независимого деплоя
- Утилитарные модули
- Прототипы и эксперименты
- Стартовый уровень проекта без необходимости поддержки сложной инфраструктуры. В последствии их можно вынести в MFE.

**Выберите NORMAL + MFE:**

- Бизнес-модули команд
- Фичи под feature flags
- Модули с частыми обновлениями

## Интерфейсы модулей

### InitModule

```typescript
interface InitModule {
  name: string;
  loadType: ModuleLoadType.INIT;
  loadPriority?: number;
  config: ModuleConfig | Promise<ModuleConfig>;
  // loadCondition запрещен
}
```

### NormalModule

```typescript
interface NormalModule {
  name: string;
  loadType?: ModuleLoadType.NORMAL; // По умолчанию NORMAL
  loadPriority?: number;
  loadCondition?: {
    featureFlags?: string[];
    accessPermissions?: string[];
    dependencies?: string[];
  };
  config: ModuleConfig | Promise<ModuleConfig>;
  remote?: RemoteModuleInfo; // Только для MFE
}
```
