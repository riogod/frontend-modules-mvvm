import { type FC } from 'react';
import {
  DocSection,
  DocCodeBlock,
  DocList,
  DocNote,
  DocTable,
} from '../../common';

export const ServerParametersSection: FC = () => (
  <DocSection title="Server Parameters">
    <DocSection title="Обзор">
      <p>
        Параметры сервера (Server Parameters) - это конфигурационные данные с
        сервера.
      </p>
      <p>Типы данных:</p>
      <DocList items={['string', 'number', 'boolean', 'object', 'array']} />
      <p>Сценарии использования:</p>
      <DocList
        items={[
          'Конфигурация модулей',
          'URL endpoints',
          'Лимиты и настройки',
          'Текстовые значения',
          'Настройки UI',
          'Интеграции с внешними сервисами',
        ]}
      />
    </DocSection>
    <DocSection title="Use Cases">
      <DocCodeBlock
        code={`import {
  GetParamUsecase,
  GetParamsUsecase,
  SetParamsUsecase,
  UpdateParamsUsecase,
  RemoveParamUsecase,
} from '@platform/common';

@injectable()
export class TodoViewModel {
  constructor(
    @inject(IOC_CORE_TOKENS.USECASE_GET_PARAM)
    private getParamUsecase: GetParamUsecase,
    @inject(IOC_CORE_TOKENS.USECASE_GET_PARAMS)
    private getParamsUsecase: GetParamsUsecase,
  ) {
    makeAutoObservable(this);
  }

  // ✅ Получить один параметр с типизацией
  get apiUrl(): string {
    return this.getParamUsecase.execute<string>('todo.api-url') || '';
  }

  // ✅ Получить число
  get perPage(): number {
    return this.getParamUsecase.execute<number>('todo.per-page') || 10;
  }

  // ✅ Получить все параметры (реактивный геттер)
  get allParams(): Record<string, string | number | boolean> {
    return this.getParamsUsecase.execute();
  }

  // ✅ Установить параметры
  async setParams(params: Record<string, string | number | boolean>): Promise<void> {
    const setParamsUsecase = this.di.get<SetParamsUsecase>(
      IOC_CORE_TOKENS.USECASE_SET_PARAMS,
    );
    await setParamsUsecase.execute(params);
  }

  // ✅ Обновить параметры
  async updateParams(updates: Record<string, string | number | boolean>): Promise<void> {
    const updateParamsUsecase = this.di.get<UpdateParamsUsecase>(
      IOC_CORE_TOKENS.USECASE_UPDATE_PARAMS,
    );
    await updateParamsUsecase.execute(updates);
  }

  // ✅ Удалить параметр
  async removeParam(key: string): Promise<void> {
    const removeParamUsecase = this.di.get<RemoveParamUsecase>(
      IOC_CORE_TOKENS.USECASE_REMOVE_PARAM,
    );
    await removeParamUsecase.execute(key);
  }
}`}
        language="typescript"
      />
    </DocSection>
    <DocSection title="Именование параметров">
      <p>Используйте понятные и описательные имена:</p>
      <DocCodeBlock
        code={`// config/param.enum.ts
export enum TodoParams {
  API_URL = 'todo.api-url',
  PER_PAGE = 'todo.per-page',
  MAX_ITEMS = 'todo.max-items',
  ENABLE_AUTO_REFRESH = 'todo.enable-auto-refresh',
  REFRESH_INTERVAL = 'todo.refresh-interval',
}

// Использование
get apiUrl(): string {
  return this.getParamUsecase.execute<string>(TodoParams.API_URL) || '';
}`}
        language="typescript"
      />
      <p>
        Формат ключей:{' '}
        <code>&lt;module&gt;.&lt;feature&gt;.&lt;property&gt;</code>
      </p>
    </DocSection>
    <DocSection title="Типизация параметров">
      <p>
        Используйте обобщение <code>&lt;T&gt;</code> для типизации:
      </p>
      <DocCodeBlock
        code={`// ✅ String
get apiUrl(): string {
  return this.getParamUsecase.execute<string>('api.url') || '';
}

// ✅ Number
get limit(): number {
  return this.getParamUsecase.execute<number>('api.limit') || 100;
}

// ✅ Boolean
get enabled(): boolean {
  return this.getParamUsecase.execute<boolean>('feature.enabled') || false;
}

// ✅ Object
get config(): MyConfig | undefined {
  return this.getParamUsecase.execute<MyConfig>('feature.config');
}

// ✅ Array
get tags(): string[] {
  return this.getParamUsecase.execute<string[]>('feature.tags') || [];
}`}
        language="typescript"
      />
    </DocSection>
    <DocSection title="Примеры использования">
      <DocCodeBlock
        code={`// URL API
const apiUrl = this.getParamUsecase.execute<string>('api.module.url');
// → 'https://api.example.com/todos'

// Лимиты
const perPage = this.getParamUsecase.execute<number>('todo.per-page');
// → 20

// Настройки UI
const showSidebar = this.getParamUsecase.execute<boolean>('ui.sidebar.show');
// → true

// Интеграции
const integrations = this.getParamUsecase.execute<Record<string, string>>(
  'integrations',
);
// → { google: 'enabled', facebook: 'enabled' }`}
        language="typescript"
      />
    </DocSection>
    <DocSection title="Отличия от Features и Permissions">
      <DocTable
        columns={[
          { header: 'Характеристика', key: 'characteristic' },
          { header: 'Parameters', key: 'params' },
          { header: 'Features', key: 'features' },
          { header: 'Permissions', key: 'permissions' },
        ]}
        rows={[
          {
            characteristic: 'Тип данных',
            params: 'string, number, boolean, object, array',
            features: 'boolean',
            permissions: 'boolean',
          },
          {
            characteristic: 'Сценарий',
            params: 'Конфигурация',
            features: 'Бизнес-логика',
            permissions: 'Контроль доступа',
          },
          {
            characteristic: 'Источник',
            params: 'Сервер',
            features: 'Бэкенд',
            permissions: 'Бэкенд',
          },
          {
            characteristic: 'Изменение',
            params: 'Администратором',
            features: 'Администратором',
            permissions: 'Бэкендом',
          },
        ]}
      />
    </DocSection>
    <DocNote type="info" title="Использование в Repository">
      <DocCodeBlock
        code={`@injectable()
export class TodoRepository {
  constructor(
    @inject(IOC_CORE_TOKENS.APIClient)
    private apiClient: APIClient,
    @inject(IOC_CORE_TOKENS.USECASE_GET_PARAM)
    private getParamUsecase: GetParamUsecase,
  ) {}

  async getTodos(page: number = 1): Promise<Todo[]> {
    const perPage = this.getParamUsecase.execute<number>('todo.per-page') || 10;
    const apiUrl = this.getParamUsecase.execute<string>('todo.api-url') || '';

    const response = await this.apiClient.request<null, TodoResponseDTO[]>({
      route: apiUrl,
      method: HttpMethod.GET,
      data: { page, perPage },
      validationSchema: {
        response: todoResponseSchema,
      },
    });

    return response.map(mapTodoDTOToEntity);
  }
}`}
        language="typescript"
      />
    </DocNote>
  </DocSection>
);
