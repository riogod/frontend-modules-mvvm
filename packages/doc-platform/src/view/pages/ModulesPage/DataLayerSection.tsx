import { type FC } from 'react';
import { DocSection, DocCodeBlock, DocList } from '../../common';

export const DataLayerSection: FC = () => (
  <DocSection title="Data Layer">
    <DocSection title="Структура">
      <DocCodeBlock
        code={`data/
├── entity.repository.ts     # Репозиторий
├── entity.dto.ts            # DTO интерфейсы
├── entity.map.ts            # Мапперы DTO → Entity
└── validation/
    └── entity.response.schema.ts  # Zod схема валидации`}
        language="text"
      />
    </DocSection>
    <DocSection title="Repository">
      <p>Инкапсулирует работу с внешними источниками данных.</p>
      <DocCodeBlock
        code={`@injectable()
export class TodoRepository {
  constructor(
    @inject(IOC_CORE_TOKENS.APIClient)
    private apiClient: APIClient,
  ) {}

  async getTodos(): Promise<Todo[]> {
    const response = await this.apiClient.request<null, TodoResponseDTO[]>({
      route: EEndpoints.TODOS,
      method: HttpMethod.GET,
      validationSchema: {
        response: todoResponseSchema,
      },
      useAbortController: true,
    });

    return response.map(mapTodoDTOToEntity);
  }

  async createTask(data: CreateTaskDTO): Promise<Todo> {
    const response = await this.apiClient.request<CreateTaskDTO, TodoResponseDTO>({
      route: EEndpoints.TODOS,
      method: HttpMethod.POST,
      data,
      validationSchema: {
        response: todoSchema,
      },
      useAbortController: true,
    });

    return mapTodoDTOToEntity(response);
  }
}`}
        language="typescript"
      />
      <DocList
        items={[
          'Использует APIClient для HTTP запросов',
          'Валидирует ответ через Zod схемы',
          'Маппит DTO в Entity',
          'Использует useAbortController для отмены дублей',
        ]}
      />
    </DocSection>
    <DocSection title="DTO">
      <p>Интерфейсы, соответствующие структуре API ответа.</p>
      <DocCodeBlock
        code={`// entity.dto.ts
export interface TodoResponseDTO {
  id: string;
  description: string;
  completed: boolean;
  created_at: string; // API использует snake_case
}

export interface CreateTaskDTO {
  description: string;
}`}
        language="typescript"
      />
    </DocSection>
    <DocSection title="Entity">
      <p>Внутренняя структура данных с возможными преобразованиями.</p>
      <DocCodeBlock
        code={`// entity.types.ts
export interface Todo {
  id: string;
  description: string;
  completed: boolean;
  createdAt: Date; // Внутреннее имя (camelCase)
}`}
        language="typescript"
      />
    </DocSection>
    <DocSection title="Mapper">
      <p>Функции для конвертации DTO в Entity.</p>
      <DocCodeBlock
        code={`// entity.map.ts
import type { TodoResponseDTO } from './entity.dto';
import type { Todo } from './entity.types';

export const mapTodoDTOToEntity = (dto: TodoResponseDTO): Todo => ({
  id: dto.id,
  description: dto.description,
  completed: dto.completed,
  createdAt: new Date(dto.created_at), // Конвертация string → Date
});`}
        language="typescript"
      />
      <DocList
        items={[
          'Конвертация snake_case → camelCase',
          'Конвертация типов (string → Date, etc.)',
          'Дополнительные преобразования данных',
        ]}
      />
    </DocSection>
    <DocSection title="Validation Schema">
      <p>Zod схемы для валидации API ответов.</p>
      <DocCodeBlock
        code={`// validation/todo.response.schema.ts
import z from 'zod';

const todoSchema = z.object({
  id: z.string(),
  description: z.string().min(1),
  completed: z.boolean(),
  created_at: z.string().datetime(),
});

export const todoResponseSchema = z.array(todoSchema).min(0).max(100);

// Использование в Repository
const response = await this.apiClient.request<null, TodoResponseDTO[]>({
  route: EEndpoints.TODOS,
  method: HttpMethod.GET,
  validationSchema: {
    response: todoResponseSchema, // ✅ Валидация ответа
  },
});`}
        language="typescript"
      />
      <DocList
        items={[
          'Валидация структуры данных',
          'Валидация типов',
          'Валидация ограничений (min, max, etc.)',
        ]}
      />
    </DocSection>
    <DocSection title="Endpoints">
      <p>Эндпоинты API хранятся как enum.</p>
      <DocCodeBlock
        code={`// config/endpoints.ts
export enum EEndpoints {
  TODOS = '/api/todos',
  TODO_BY_ID = '/api/todos/:id',
}

// Использование в Repository
await this.apiClient.request({
  route: EEndpoints.TODOS,
  method: HttpMethod.GET,
});`}
        language="typescript"
      />
    </DocSection>
  </DocSection>
);
