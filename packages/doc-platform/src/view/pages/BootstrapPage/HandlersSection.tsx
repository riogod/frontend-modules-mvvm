import { type FC } from 'react';
import { DocSection, DocCodeBlock, DocList, DocTable } from '../../common';

export const HandlersSection: FC = () => (
  <DocSection title="Цепочка ответственности (Chain of Responsibility)">
    <p>
      Каждый обработчик получает результат от предыдущего и может добавить свои
      изменения.
    </p>
    <DocSection title="Порядок выполнения">
      <DocList
        items={[
          '1. APIClientHandler - инициализация HTTP клиента',
          '2. FederationSharedHandler - настройка Module Federation',
          '3. ModulesDiscoveryHandler - обнаружение модулей',
          '4. RouterHandler - инициализация роутера',
          '5. DIHandler - инициализация DI контейнера',
          '6. InitI18nHandler - инициализация i18n',
          '7. OnAppStartHandler - вызов onAppStart хуков',
          '8. ModulesHandler - загрузка модулей',
          '9. RouterPostHandler - настройка роутинга после загрузки модулей',
          '10. HTTPErrorHandler - настройка обработки HTTP ошибок',
        ]}
      />
    </DocSection>
    <DocSection title="Пример обработчика">
      <DocCodeBlock
        code={`import { type IBootstrapHandler } from '@platform/core';

@injectable()
export class CustomHandler implements IBootstrapHandler {
  async handle(
    params: BootstrapParams,
    next: HandlerNext,
  ): Promise<BootstrapResult> {
    console.log('Custom handler');

    const result = await next(params);

    return {
      ...result,
      customData: 'value',
    };
  }
}`}
        language="typescript"
      />
    </DocSection>
    <DocSection title="Таблица обработчиков">
      <DocTable
        columns={[
          { header: 'Обработчик', key: 'name' },
          { header: 'Описание', key: 'description' },
          { header: 'Важность', key: 'importance' },
        ]}
        rows={[
          {
            name: 'APIClientHandler',
            description: 'Инициализация HTTP клиента для API запросов',
            importance: 'Критический',
          },
          {
            name: 'FederationSharedHandler',
            description: 'Настройка Module Federation shared scope',
            importance: 'Критический',
          },
          {
            name: 'ModulesDiscoveryHandler',
            description: 'Обнаружение локальных и MFE модулей',
            importance: 'Критический',
          },
          {
            name: 'RouterHandler',
            description: 'Инициализация системы роутинга',
            importance: 'Критический',
          },
          {
            name: 'DIHandler',
            description: 'Настройка DI контейнера и базовых сервисов',
            importance: 'Критический',
          },
          {
            name: 'InitI18nHandler',
            description: 'Инициализация системы переводов',
            importance: 'Высокий',
          },
          {
            name: 'OnAppStartHandler',
            description: 'Выполнение onAppStart хуков модулей',
            importance: 'Высокий',
          },
          {
            name: 'ModulesHandler',
            description: 'Загрузка модулей по зависимостям',
            importance: 'Критический',
          },
          {
            name: 'RouterPostHandler',
            description: 'Финальная настройка роутинга',
            importance: 'Высокий',
          },
          {
            name: 'HTTPErrorHandler',
            description: 'Настройка перехватчиков HTTP ошибок',
            importance: 'Средний',
          },
        ]}
      />
    </DocSection>
    <DocSection title="Создание кастомного обработчика">
      <DocCodeBlock
        code={`// host/src/bootstrap/handlers/custom.handler.ts
import { injectable, type IBootstrapHandler, HandlerNext } from '@platform/core';

@injectable()
export class CustomHandler implements IBootstrapHandler {
  async handle(
    params: BootstrapParams,
    next: HandlerNext,
  ): Promise<BootstrapResult> {
    // Логика перед вызовом следующего обработчика
    console.log('Before:', params);

    const result = await next(params);

    // Логика после вызова следующего обработчика
    console.log('After:', result);

    return result;
  }
}

// Регистрация в host/src/bootstrap/handlers/index.ts
import { CustomHandler } from './custom.handler';

export const handlers = [
  // ... другие обработчики
  CustomHandler,
];`}
        language="typescript"
      />
    </DocSection>
  </DocSection>
);
