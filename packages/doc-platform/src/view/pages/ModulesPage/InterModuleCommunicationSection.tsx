import { type FC } from 'react';
import { DocSection, DocCodeBlock, DocList, DocNote } from '../../common';

export const InterModuleCommunicationSection: FC = () => (
  <DocSection title="Inter-Module Communication">
    <DocSection title="Основное правило">
      <p>Все взаимодействие между модулями ТОЛЬКО через DI контейнер.</p>
      <DocNote type="error" title="Критическое правило">
        Прямой импорт реализаций между модулями запрещен.
      </DocNote>
    </DocSection>
    <DocSection title="Разрешено">
      <DocList
        items={[
          '✅ Импорт типов из других модулей',
          '✅ Импорт всего из библиотек (@platform/core, @platform/ui, etc.)',
        ]}
      />
      <DocCodeBlock
        code={`// ✅ ПРАВИЛЬНО: Импорт типа
import type { CatalogModel } from '@packages/catalog/models/catalog.model';

// ✅ ПРАВИЛЬНО: Импорт из библиотек
import { IOC_CORE_TOKENS, APIClient } from '@platform/core';
import { useVM, ThemeProvider } from '@platform/ui';`}
        language="typescript"
      />
    </DocSection>
    <DocSection title="Запрещено">
      <DocList
        items={[
          '❌ Импорт класса из другого модуля',
          '❌ Импорт токенов из другого модуля',
          '❌ Импорт enum из другого модуля',
        ]}
      />
      <DocCodeBlock
        code={`// ❌ НЕПРАВИЛЬНО: Импорт реализации
import { CatalogModel } from '@packages/catalog/models/catalog.model';

// ❌ НЕПРАВИЛЬНО: Импорт токенов
import { CATALOG_DI_TOKENS } from '@packages/catalog/config/di.tokens';

// ❌ НЕПРАВИЛЬНО: Импорт enum
import { CatalogStatus } from '@packages/catalog/models/catalog.enum';`}
        language="typescript"
      />
    </DocSection>
    <DocSection title="Правильное взаимодействие через DI">
      <DocCodeBlock
        code={`// ✅ 1. Описываем токен в своем модуле
// di.tokens.ts
export const EXTERNAL_TOKENS = {
  CATALOG_MODEL: 'CatalogModel', // Значение должно совпадать с регистрацией
} as const;

// ✅ 2. Используем через DI
// usecases/orders.usecase.ts
@injectable()
export class OrdersUsecase {
  constructor(
    @inject(EXTERNAL_TOKENS.CATALOG_MODEL)
    private catalogModel: CatalogModel, // Тип импортирован через type
  ) {}
}

// ✅ 3. Указываем зависимость в module_config.ts
// module_config.ts
export default {
  mockModuleInfo: {
    name: 'orders',
    dependencies: ['catalog'], // Гарантирует загрузку catalog до orders
  },
} as ModuleConfig;`}
        language="typescript"
      />
    </DocSection>
    <DocSection title="Библиотечные токены">
      <p>
        Используйте токены из `@platform/core` для доступа к платформенным
        сервисам.
      </p>
      <DocCodeBlock
        code={`import { IOC_CORE_TOKENS } from '@platform/core';

// Доступ к APIClient
@injectable()
export class MyRepository {
  constructor(
    @inject(IOC_CORE_TOKENS.APIClient)
    private apiClient: APIClient,
  ) {}
}

// Доступ к Use Case фич
@injectable()
export class MyViewModel {
  constructor(
    @inject(IOC_CORE_TOKENS.USECASE_GET_FEATURE_FLAG)
    private getFeatureFlagUsecase: GetFeatureFlagUsecase,
  ) {}
}

// Доступ к Use Case прав
@injectable()
export class MyViewModel {
  constructor(
    @inject(IOC_CORE_TOKENS.USECASE_GET_PERMISSION)
    private getPermissionUsecase: GetPermissionUsecase,
  ) {}
}`}
        language="typescript"
      />
    </DocSection>
    <DocSection title="Опциональные зависимости">
      <p>
        Используйте `@optional()` для зависимостей, которые могут отсутствовать.
      </p>
      <DocCodeBlock
        code={`import { injectable, inject, optional } from 'inversify';

@injectable()
export class MyUsecase {
  constructor(
    @optional()
    @inject(EXTERNAL_TOKENS.CATALOG_MODEL)
    private catalogModel?: CatalogModel,
  ) {}

  execute(): void {
    if (this.catalogModel) {
      // Зависимость доступна
      this.catalogModel.getData();
    } else {
      // Зависимость недоступна
      console.log('Catalog module not loaded');
    }
  }
}`}
        language="typescript"
      />
    </DocSection>
    <DocSection title="Шаринг компонентов">
      <p>
        Модуль может предоставить свои компоненты для использования другими
        модулями.
      </p>
      <DocCodeBlock
        code={`// ✅ Модуль предоставляет компонент
// catalog/src/view/components/SharedCard/index.tsx
export const SharedCard = observer(() => {
  // Компонент с бизнес-логикой
});

// ✅ Регистрация в DI
// catalog/src/config/di.config.ts
container.bind('Catalog.SharedCard').toDynamicValue(() => SharedCard);

// ✅ Использование в другом модуле
// orders/src/view/components/OrderPage/index.tsx
import { useSharedComponent } from '@platform/ui';

const OrderPage = observer(() => {
  const SharedCard = useSharedComponent('Catalog.SharedCard');

  if (!SharedCard) {
    return null; // Модуль не загружен
  }

  return <SharedCard />;
});`}
        language="typescript"
      />
    </DocSection>
    <DocSection title="Дополнительные механики">
      <DocList
        items={[
          'EventBus - шина событий для межмодульной коммуникации',
          'Message Queue - очередь сообщений',
          'State Manager - управление глобальным состоянием',
          'Mediator - посредник для сложных взаимодействий',
          'Observable - реактивные потоки данных',
          'Command Bus - шина команд для выполнения действий',
        ]}
      />
    </DocSection>
    <DocNote type="warning" title="Важные правила">
      <DocList
        items={[
          'Всегда указывайте зависимости в mockModuleInfo',
          'Используйте @optional() для опциональных зависимостей',
          'Избегайте циклических зависимостей',
          'Используйте типы для документации взаимодействий',
        ]}
      />
    </DocNote>
  </DocSection>
);
