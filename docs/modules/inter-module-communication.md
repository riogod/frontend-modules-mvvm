# Межмодульное взаимодействие

Модули изолированы друг от друга. Взаимодействие между ними осуществляется только через DI контейнер.

## Основные правила

```
┌─────────────────────────────────────────────────────────────────────┐
│                          DI Container                               │
│                                                                     │
│   Модуль A              Модуль B              Модуль C              │
│   регистрирует ───────► получает ◄─────────── регистрирует          │
│   токены                токены                токены                │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

| Правило                    | Описание                                          |
| -------------------------- | ------------------------------------------------- |
| Взаимодействие через DI    | Всё взаимодействие только через DI контейнер      |
| Импорт типов разрешён      | Можно импортировать интерфейсы и типы             |
| Импорт реализаций запрещён | Нельзя импортировать классы и функции напрямую    |
| Указывайте dependencies    | Для гарантии порядка загрузки и доступа к токенам |

> **Важно:** Прямой импорт реализаций между модулями категорически запрещён — как для MFE модулей, так и для локальных.

## Что разрешено импортировать

### ✅ Разрешено между модулями: только интерфейсы и типы

```typescript
// ПРАВИЛЬНО — импорт только типов из другого модуля
import type { Product } from '@packages/catalog/models/product.entity';
import type { CatalogModel } from '@packages/catalog/models/catalog.model';
```

### ✅ Разрешено из библиотек: всё

Через библиотеки (`@platform/*`) можно шарить токены, enum, сущности и реализации:

```typescript
// ПРАВИЛЬНО — импорт из библиотек
import { IOC_CORE_TOKENS, HttpMethod } from '@platform/core';
import { AccessControlModel } from '@platform/common';
import { useVM, ThemeProvider } from '@platform/ui';
```

### ❌ Запрещено между модулями: классы, реализации, enums и токены

```typescript
// НЕПРАВИЛЬНО — прямой импорт реализации из другого модуля
import { CatalogModel } from '@packages/catalog/models/catalog.model';

// НЕПРАВИЛЬНО — импорт токенов из другого модуля
import { CATALOG_DI_TOKENS } from '@packages/catalog/config/di.tokens';

// НЕПРАВИЛЬНО — импорт enum из другого модуля
import { CatalogStatus } from '@packages/catalog/models/catalog.enum';
```

## Взаимодействие через DI

### Способ 1: Токены из библиотек

Платформенные токены доступны через `@platform/core`:

```typescript
// packages/orders/src/usecases/createOrder.usecase.ts
import { inject, injectable } from 'inversify';
import { IOC_CORE_TOKENS } from '@platform/core';
import type { AppModel } from '@host/modules/core/models/app.model';

@injectable()
export class CreateOrderUsecase {
  constructor(
    @inject(IOC_CORE_TOKENS.MODEL_APP)
    private appModel: AppModel,
  ) {}
}
```

### Способ 2: Описание токенов в своём модуле

Для токенов из других модулей — описываем у себя:

```typescript
// packages/orders/src/config/di.tokens.ts
export enum ORDERS_DI_TOKENS {
  // Собственные токены модуля
  MODEL_ORDERS = 'OrdersModel',
  USECASE_CREATE_ORDER = 'CreateOrderUsecase',
}

// Токены внешних зависимостей (из других модулей)
export const EXTERNAL_TOKENS = {
  // Токен из модуля catalog — описываем у себя
  CATALOG_MODEL: 'CatalogModel',
} as const;
```

Использование:

```typescript
// packages/orders/src/usecases/createOrder.usecase.ts
import { inject, injectable } from 'inversify';
import { EXTERNAL_TOKENS } from '../config/di.tokens';
import type { CatalogModel } from '@packages/catalog/models/catalog.model';

@injectable()
export class CreateOrderUsecase {
  constructor(
    @inject(EXTERNAL_TOKENS.CATALOG_MODEL)
    private catalogModel: CatalogModel,
  ) {}

  execute(productId: string): void {
    const product = this.catalogModel.getProduct(productId);
    // ...
  }
}
```

> **Важно:** Значение токена (`'CatalogModel'`) должно совпадать с тем, как его регистрирует модуль-поставщик.

### Указание зависимости

Для гарантии доступности токена укажите модуль в dependencies:

```typescript
// packages/orders/src/config/module_config.ts
export const mockModuleInfo: RemoteModuleInfo = {
  name: 'orders',
  loadType: ModuleLoadType.NORMAL,
  dependencies: ['catalog'], // Гарантирует загрузку catalog до orders
};
```

### Защита от отсутствующих зависимостей

Используйте декоратор `@optional()` для защиты от ошибки, если сущность не зарегистрирована в DI:

```typescript
import { inject, injectable, optional } from 'inversify';
import { EXTERNAL_TOKENS } from '../config/di.tokens';
import type { CatalogModel } from '@packages/catalog/models/catalog.model';

@injectable()
export class CreateOrderUsecase {
  constructor(
    @inject(EXTERNAL_TOKENS.CATALOG_MODEL)
    @optional() // Не выбросит ошибку, если токен не зарегистрирован, а будет undefined
    private catalogModel?: CatalogModel,
  ) {}

  execute(productId: string): void {
    if (!this.catalogModel) {
      console.warn('CatalogModel не доступен');
      return;
    }
    const product = this.catalogModel.getProduct(productId);
    // ...
  }
}
```

| Сценарий                 | Без `@optional()`                  | С `@optional()`        |
| ------------------------ | ---------------------------------- | ---------------------- |
| Токен зарегистрирован    | Инжектится зависимость             | Инжектится зависимость |
| Токен не зарегистрирован | Ошибка: No matching bindings found | Значение `undefined`   |

> **Когда использовать:** `@optional()` полезен для опциональных интеграций, когда модуль может работать без зависимости.

## Шаринг компонентов

### ❌ Не рекомендуется: Module Federation remotes

Прямое использование remote компонентов через Module Federation создаёт жёсткую связь:

### ✅ Рекомендуется: обёртки через DI

Модуль-поставщик регистрирует компонент в DI:

```typescript
// packages/catalog/src/config/di.config.ts
container.bind('ProductCardComponent').toConstantValue(ProductCard);
```

Модуль-потребитель использует хук `useSharedComponent`:

```typescript
// packages/orders/src/view/OrderPage.tsx
import { useSharedComponent } from '@platform/ui';
import { Suspense } from 'react';
import type { ProductCardProps } from '@packages/view/components/ProductCard'

// Токен описываем в своём модуле
const PRODUCT_CARD_TOKEN = 'ProductCardComponent';

const OrderPage: FC = () => {
  // useSharedComponent безопасно получает компонент из DI
  const ProductCard = useSharedComponent<ProductCardProps>(PRODUCT_CARD_TOKEN, {
    moduleName: 'catalog', // Для диагностики
    fallback: <div>Компонент недоступен</div>,
  });

  return (
    <Suspense fallback={<div>Загрузка...</div>}>
      {ProductCard ? (
        <ProductCard product={product} />
      ) : (
        <div>Компонент не найден</div>
      )}
    </Suspense>
  );
};
```

### Опции useSharedComponent

| Опция               | Тип         | По умолчанию | Описание                             |
| ------------------- | ----------- | ------------ | ------------------------------------ |
| `moduleName`        | `string`    | -            | Имя модуля для диагностики ошибок    |
| `fallback`          | `ReactNode` | -            | Fallback компонент, если не найден   |
| `suppressErrors`    | `boolean`   | `true`       | Подавлять ошибки и возвращать null   |
| `validateComponent` | `boolean`   | `true`       | Валидировать что это React компонент |

## Дополнительные механики взаимодействия

При необходимости вы можете внедрить свои механики межмодульного взаимодействия:

| Механика          | Описание                                   | Когда использовать              |
| ----------------- | ------------------------------------------ | ------------------------------- |
| **EventBus**      | Шина событий для pub/sub коммуникации      | Слабосвязанные уведомления      |
| **Message Queue** | Очередь сообщений с гарантией доставки     | Асинхронная обработка           |
| **State Manager** | Централизованное хранилище состояния       | Общее состояние между модулями  |
| **Mediator**      | Посредник для координации взаимодействий   | Сложные сценарии взаимодействия |
| **Observable**    | RxJS потоки для реактивного взаимодействия | Потоковая обработка данных      |
| **Command Bus**   | Шина команд для выполнения действий        | CQRS паттерн                    |

### Пример: EventBus

```typescript
// libs/core/src/EventBus/EventBus.ts
@injectable()
export class EventBus {
  private listeners = new Map<string, Set<(data: unknown) => void>>();

  emit(event: string, data?: unknown): void {
    this.listeners.get(event)?.forEach((cb) => cb(data));
  }

  on(event: string, callback: (data: unknown) => void): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    // Возвращаем функцию отписки
    return () => this.listeners.get(event)?.delete(callback);
  }
}

// Регистрация в DI
container.bind(IOC_CORE_TOKENS.EVENT_BUS).to(EventBus).inSingletonScope();
```

Использование:

```typescript
// Модуль A — отправляет событие
@injectable()
export class CartUsecase {
  constructor(
    @inject(IOC_CORE_TOKENS.EVENT_BUS)
    private eventBus: EventBus,
  ) {}

  addToCart(product: Product): void {
    // ... логика добавления
    this.eventBus.emit('cart:item-added', { product });
  }
}

// Модуль B — подписывается на событие
@injectable()
export class AnalyticsUsecase {
  constructor(
    @inject(IOC_CORE_TOKENS.EVENT_BUS)
    private eventBus: EventBus,
  ) {
    this.eventBus.on('cart:item-added', (data) => {
      this.trackEvent('add_to_cart', data);
    });
  }
}
```

## Типичные ошибки

### ❌ Прямой импорт между модулями

```typescript
// НЕПРАВИЛЬНО — прямой импорт класса
import { CatalogModel } from '@packages/catalog/models/catalog.model';

@injectable()
export class OrdersUsecase {
  private catalog = new CatalogModel(); // Создание напрямую
}

// НЕПРАВИЛЬНО — импорт токенов из другого модуля
import { CATALOG_DI_TOKENS } from '@packages/catalog/config/di.tokens';
```

```typescript
// ПРАВИЛЬНО — токен описан в своём модуле
import type { CatalogModel } from '@packages/catalog/models/catalog.model';
import { EXTERNAL_TOKENS } from '../config/di.tokens';

@injectable()
export class OrdersUsecase {
  constructor(
    @inject(EXTERNAL_TOKENS.CATALOG_MODEL)
    private catalog: CatalogModel,
  ) {}
}
```

### ❌ Отсутствие зависимости в конфигурации

```typescript
// НЕПРАВИЛЬНО — зависимость не указана
export const mockModuleInfo: RemoteModuleInfo = {
  name: 'orders',
  loadType: ModuleLoadType.NORMAL,
  // dependencies: ['catalog'] — забыли указать! и если модуль не загрузиться, то его сущности не появятся в DI контейнере
};

// Ошибка: No matching bindings found for CATALOG_DI_TOKENS.MODEL_CATALOG
```

### ❌ Циклическая зависимость

```typescript
// НЕПРАВИЛЬНО — цикл зависимостей
// catalog зависит от orders
// orders зависит от catalog

// Решение: выделите общую логику в отдельный модуль или библиотеку
```

## Связанные разделы

- [Типы модулей](./module-types.md)
- [Конфигурация модуля](./module-config.md)
- [Зависимости модулей](../bootstrap/module-dependencies.md)
