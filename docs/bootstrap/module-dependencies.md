# Зависимости модулей

Модули могут зависеть друг от друга. Модуль-зависимость должен быть загружен раньше модуля, который от него зависит. Зависимости поддерживаются только для NORMAL модулей (INIT модули не могут иметь зависимости).

## Как указать зависимости

Зависимости указываются в `loadCondition.dependencies`:

```typescript
const module: NormalModule = {
  name: 'orders',
  loadType: ModuleLoadType.NORMAL,
  config: OrdersConfig,
  loadCondition: {
    // Этот модуль зависит от модулей 'auth' и 'catalog'
    dependencies: ['auth', 'catalog'],
  },
};
```

Модуль `orders` загрузится только после загрузки `auth` и `catalog`.

## DEV vs PROD режим

| Режим | Что делает клиент             | Что делает сервер       |
| ----- | ----------------------------- | ----------------------- |
| DEV   | Полная обработка зависимостей | —                       |
| PROD  | Базовая проверка статусов     | Сортировка и фильтрация |

**DEV режим:**

```
┌─────────────────────────────────────────────────────────────┐
│                      ModuleLoader                           │
│                                                             │
│  1. Читает dependencies из loadCondition                    │
│  2. Строит граф зависимостей                                │
│  3. Обнаруживает циклические зависимости                    │
│  4. Группирует модули по уровням                            │
│  5. Загружает уровень за уровнем                            │
└─────────────────────────────────────────────────────────────┘
```

**PROD режим:**

```
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
```

> В PROD режиме тяжелый код (построение графа, уровней) не включается в бандл. Остается только легкая проверка статусов.

## Уровни загрузки (DEV режим)

В DEV режиме ModuleLoader группирует модули по уровням для параллельной загрузки:

```
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
```

Модули одного уровня загружаются параллельно — это ускоряет загрузку.

## Правила зависимостей

### 1. INIT модули не поддерживают зависимости

```typescript
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
```

INIT модули загружаются по `loadPriority`, не по зависимостям.

### 2. Зависимость должна существовать

```typescript
// ❌ Неправильно — зависимость от несуществующего модуля
const module: NormalModule = {
  name: 'orders',
  config: OrdersConfig,
  loadCondition: {
    dependencies: ['non-existent-module'], // Ошибка в runtime
  },
};
```

При отсутствии зависимости модуль будет пропущен с предупреждением в консоли.

### 3. Циклические зависимости запрещены

```typescript
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
```

При обнаружении цикла будет выброшена ошибка с указанием цепочки.

### 4. Транзитивные зависимости разрешаются автоматически

```typescript
// A зависит от B, B зависит от C
// При загрузке A система автоматически загрузит: C → B → A
```

Вам не нужно указывать транзитивные зависимости явно.

## Пример: модули интернет-магазина

```typescript
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
```

Порядок загрузки:

```
1. INIT: core → layout (по loadPriority)

2. NORMAL уровень 0: auth, catalog (параллельно)

3. NORMAL уровень 1: cart, order-history (параллельно)

4. NORMAL уровень 2: checkout
```

## Комбинация с другими условиями

Зависимости можно комбинировать с feature flags и permissions:

```typescript
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
```

Порядок проверки:

1. Feature flags
2. Permissions
3. Dependencies

Если любое условие не выполнено — модуль не загружается.

> Feature flags и permissions проверяются в обоих режимах (DEV и PROD). Dependencies в PROD проверяются только по статусам.

## Отладка зависимостей (DEV режим)

Включите уровень логирования DEBUG для отслеживания:

```bash
LOG_LEVEL=DEBUG npm run dev
```

В консоли увидите:

```
[DEBUG] moduleLoader.dependencyLevelBuilder: Группировка 5 модулей по уровням зависимостей
[DEBUG] moduleLoader.dependencyLevelBuilder: Уровень 1: auth, catalog
[DEBUG] moduleLoader.dependencyLevelBuilder: Уровень 2: cart, order-history
[DEBUG] moduleLoader.dependencyLevelBuilder: Уровень 3: checkout
[DEBUG] moduleLoader.dependencyLevelBuilder: Группировка завершена: 3 уровней, 0 пропущено
```

При проблемах с зависимостями:

```
[WARN] moduleLoader.dependencyLevelBuilder: Пропуск модулей с отсутствующими зависимостями: broken-module
[ERROR] moduleLoader.dependencyResolver: Обнаружена циклическая зависимость: A -> B -> C -> A
```

## Загрузка по требованию

При переходе на маршрут незагруженного модуля зависимости загружаются автоматически.

**В DEV режиме** — полное разрешение транзитивных зависимостей:

```typescript
// Пользователь переходит на /checkout
// ModuleLoader:
// 1. Находит модуль checkout
// 2. Видит зависимость cart
// 3. Видит зависимость cart от auth и catalog
// 4. Загружает: auth → catalog → cart → checkout
```

**В PROD режиме** — модули уже загружены в правильном порядке сервером, загрузка по требованию только проверяет статусы.

Всё происходит автоматически — вам не нужно управлять этим вручную.

## Типы модулей

```typescript
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
```
