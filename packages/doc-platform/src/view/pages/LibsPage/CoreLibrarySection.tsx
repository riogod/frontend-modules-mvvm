import { type FC } from 'react';
import { DocSection, DocCodeBlock, DocList, DocTable } from '../../common';

export const CoreLibrarySection: FC = () => (
  <DocSection title="Core Library">
    <DocSection title="IOC_CORE_TOKENS">
      <p>Базовые токены DI контейнера:</p>
      <DocTable
        columns={[
          { header: 'Токен', key: 'token' },
          { header: 'Описание', key: 'description' },
        ]}
        rows={[
          {
            token: 'APIClient',
            description: 'HTTP клиент для API запросов',
          },
          {
            token: 'LOGGER',
            description: 'Система логирования',
          },
          {
            token: 'UseCase для фич',
            description: 'GetFeatureFlags, SetFeatureFlags, etc.',
          },
          {
            token: 'Use Case для прав',
            description: 'GetPermissions, SetPermissions, etc.',
          },
          {
            token: 'Use Case для параметров',
            description: 'GetParam, GetParams, etc.',
          },
          {
            token: 'App Model',
            description: 'Глобальная модель приложения',
          },
          {
            token: 'ViewModels',
            description: 'UiSettings, etc.',
          },
        ]}
      />
    </DocSection>
    <DocSection title="APIClient">
      <p>HTTP клиент на базе axios для выполнения API запросов.</p>
      <DocCodeBlock
        code={`import { injectable, inject } from 'inversify';
import { IOC_CORE_TOKENS, APIClient } from '@platform/core';
import { HttpMethod } from '@platform/core';

@injectable()
export class MyRepository {
  constructor(
    @inject(IOC_CORE_TOKENS.APIClient)
    private apiClient: APIClient,
  ) {}

  async getData(): Promise<MyData[]> {
    const response = await this.apiClient.request<null, MyDataDTO[]>({
      route: EEndpoints.MY_DATA,
      method: HttpMethod.GET,
      data: { page: 1 },
      validationSchema: {
        response: myDataSchema,
      },
      useAbortController: true,
    });

    return response.map(mapMyDataDTOToEntity);
  }
}`}
        language="typescript"
      />
      <DocList
        items={[
          'Метод request для выполнения запросов',
          'Поддержка GET, POST, PUT, DELETE',
          'Валидация ответа через Zod',
          'Автоматическая отмена дублей запросов',
        ]}
      />
    </DocSection>
    <DocSection title="executeWithAbortHandling">
      <p>Функция для безопасного выполнения асинхронных Use Cases.</p>
      <DocCodeBlock
        code={`import { executeWithAbortHandling } from '@platform/core';

await executeWithAbortHandling({
  requestFn: async () => {
    return await this.myRepository.getData();
  },
  getPreviousData: () => this.myModel.items,
  setData: (data) => {
    if (data) {
      data.forEach((item) => this.myModel.setItem(item));
    }
  },
  setLoading: (loading) => {
    this.myModel.setLoading(loading);
  },
  onError: (error) => {
    if (error instanceof Error) {
      log.error('Failed to load data', { prefix: 'my.usecase' }, error);
    }
  },
  requestIdTracker: this.requestIdTracker,
});`}
        language="typescript"
      />
      <DocList
        items={[
          'Автоматическая отмена предыдущих запросов',
          'Сохранение предыдущих данных при ошибке',
          'Установка loading состояния',
          'Обработка ошибок',
        ]}
      />
    </DocSection>
    <DocSection title="Logger">
      <p>Система логирования с несколькими уровнями.</p>
      <DocCodeBlock
        code={`import { log } from '@platform/core';

log.error('Error message', { prefix: 'my.usecase' }, error);
log.warn('Warning message', { prefix: 'my.usecase' });
log.info('Info message', { prefix: 'my.usecase' });
log.debug('Debug message', { prefix: 'my.usecase' });
log.trace('Trace message', { prefix: 'my.usecase' });`}
        language="typescript"
      />
      <DocList
        items={[
          'ERROR - критические ошибки',
          'WARN - предупреждения',
          'INFO - информационные сообщения',
          'DEBUG - отладочная информация',
          'TRACE - трассировка выполнения',
        ]}
      />
    </DocSection>
    <DocSection title="Типы">
      <p>Базовые типы платформы:</p>
      <DocCodeBlock
        code={`import type { IBootstrap, IRoute } from '@platform/core';

interface MyBootstrap extends IBootstrap {
  // Расширение интерфейса бустрапа
}

interface MyRoute extends IRoute {
  // Расширение интерфейса маршрута
}`}
        language="typescript"
      />
    </DocSection>
  </DocSection>
);
