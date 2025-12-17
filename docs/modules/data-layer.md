# Работа с данными

Слой данных отвечает за взаимодействие с внешними источниками: API, LocalStorage, IndexedDB и другими.

## Структура

```
data/
├── entity.repository.ts           # Репозиторий
├── entity.dto.ts                  # DTO интерфейсы
├── entity.map.ts                  # Маппер данных в сущность проекта
└── validation/
    └── entity.response.schema.ts  # Zod схемы валидации
```

## Repository

Repository инкапсулирует работу с внешними источниками данных. Он скрывает детали реализации (HTTP, LocalStorage и т.д.) от остального приложения.

```typescript
// data/jokes.repository.ts
import { inject, injectable } from 'inversify';
import { APIClient, HttpMethod, IOC_CORE_TOKENS } from '@platform/core';
import { JokeResponseDTO } from './jokes.dto';
import { jokesResponseSchema } from './validation/jokes.response.schema';
import { mapJokeDTOToEntity } from './jokes.map';
import { Joke } from '../models/jokes.entity';

@injectable()
export class JokesRepository {
  constructor(
    @inject(IOC_CORE_TOKENS.APIClient)
    private apiClient: APIClient,
  ) {}

  async getJokes(): Promise<Joke[]> {
    const response = await this.apiClient.request<
      { limit: number; offset: number },
      JokeResponseDTO[]
    >({
      route: '/api/jokes',
      method: HttpMethod.GET,
      requestObj: {
        limit: 10,
        offset: 0,
      },
      validationSchema: {
        response: jokesResponseSchema,
      },
      useAbortController: true,
    });

    // Маппим DTO в Entity
    return response.map(mapJokeDTOToEntity);
  }
}
```

### Правила Repository

| Правило              | Описание                                            |
| -------------------- | --------------------------------------------------- |
| `@injectable()`      | Репозиторий регистрируется в DI                     |
| Один источник данных | Один репозиторий работает с одним типом данных      |
| Маппинг внутри       | Репозиторий маппит DTO в Entity и возвращает Entity |
| Валидация ответа     | Рекомендуется использовать Zod схему для валидации  |
| Валидация запроса    | Рекомендуется использовать Zod схему для валидации  |
| `useAbortController` | Включайте для автоматической отмены дублей запросов |

### Типы репозиториев

**API Repository** — работа с HTTP API:

```typescript
@injectable()
export class UserRepository {
  constructor(
    @inject(IOC_CORE_TOKENS.APIClient)
    private apiClient: APIClient,
  ) {}

  async getUser(id: string): Promise<UserDTO> {
    return await this.apiClient.request<null, UserDTO>({
      route: `/api/users/${id}`,
      method: HttpMethod.GET,
      validationSchema: {
        response: userResponseSchema,
      },
    });
  }
}
```

**LocalStorage Repository** — работа с локальным хранилищем:

```typescript
@injectable()
export class LocalStorageRepository {
  getKey<T>(key: string): T {
    return localStorage.getItem(key) as T;
  }

  setKey<T>(key: string, value: T): void {
    localStorage.setItem(key, value as string);
  }

  removeKey(key: string): void {
    localStorage.removeItem(key);
  }
}
```

## DTO (Data Transfer Object)

DTO описывает структуру данных от внешнего источника. Это контракт между клиентом и сервером.

```typescript
// data/jokes.dto.ts
export interface JokeResponseDTO {
  id: number;
  type: string;
  setup: string;
  punchline: string;
}
```

### Правила DTO

| Правило           | Описание                                 |
| ----------------- | ---------------------------------------- |
| Только интерфейсы | DTO — это интерфейсы, не классы          |
| Соответствие API  | Структура DTO должна точно повторять API |
| Именование        | Суффикс `DTO` или `ResponseDTO`          |
| Без логики        | DTO не содержит методов                  |

### Пример сложного DTO

```typescript
// data/app.dto.ts
import type { ModuleManifestEntry } from '@platform/core';

export interface AppStartDTO {
  status: string;
  data: {
    features: Record<string, boolean>;
    permissions: Record<string, boolean>;
    params: Record<string, unknown>;
    modules: ModuleManifestEntry[];
  };
}
```

## Валидация с Zod

Zod схемы валидируют данные от API в runtime. Если данные не соответствуют схеме, запрос завершается с ошибкой.

```typescript
// data/validation/jokes.response.schema.ts
import z from 'zod';

// Схема одного объекта
const jokeSchema = z.object({
  id: z.number(),
  type: z.string(),
  setup: z.string(),
  punchline: z.string(),
});

// Схема ответа от API
export const jokesResponseSchema = z.array(jokeSchema).min(1).max(10);
```

### Частые паттерны Zod

```typescript
import z from 'zod';

// Обязательные и опциональные поля
const userSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  age: z.number().optional(),
});

// Enum значения
import { SomeEnum } from './enum';

const moduleSchema = z.object({
  loadType: z.nativeEnum(SomeEnum),
});

// Record (объект с динамическими ключами)
const featuresSchema = z.record(z.string(), z.boolean());

// Массив с ограничениями
const itemsSchema = z.array(z.string()).min(1).max(100);

// Вложенные объекты
const responseSchema = z.object({
  status: z.string(),
  data: z.object({
    items: z.array(itemSchema),
    total: z.number(),
  }),
});
```

### Валидация в APIClient

APIClient автоматически валидирует response через Zod:

```typescript
// В Repository
async getData(): Promise<DataDTO> {
  return await this.apiClient.request<null, DataDTO>({
    route: '/api/data',
    method: HttpMethod.GET,
    validationSchema: {
      response: dataResponseSchema, // Zod схема
    },
  });
}
```

Если валидация не прошла, APIClient выбросит `ZodError`.

## Маппинг DTO в Entity

Entity — это структура данных для использования внутри модуля. Маппинг DTO в Entity выполняется в Repository.

### Простой маппинг (DTO = Entity)

Если структура DTO подходит для использования в модуле:

```typescript
// models/jokes.entity.ts
import { type JokeResponseDTO } from '../data/jokes.dto';

// Entity совпадает с DTO
export type Joke = JokeResponseDTO;
```

В этом случае маппер не нужен — Repository возвращает данные напрямую.

### Маппинг с преобразованием

Если структура DTO отличается от нужной структуры Entity:

```typescript
// data/user.dto.ts
export interface UserDTO {
  id: string;
  first_name: string;
  last_name: string;
  created_at: string; // ISO string от API
}

// models/user.entity.ts
export class User {
  id: string = '';
  firstName: string = '';
  lastName: string = '';
  createdAt: Date = new Date();

  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }
}

// data/user.map.ts
import { UserDTO } from './user.dto';
import { User } from '../models/user.entity';

export function mapUserDTOToEntity(dto: UserDTO): User {
  const user = new User();
  user.id = dto.id;
  user.firstName = dto.first_name; // snake_case → camelCase
  user.lastName = dto.last_name;
  user.createdAt = new Date(dto.created_at); // string → Date
  return user;
}
```

### Использование маппера в Repository

```typescript
// data/user.repository.ts
import { mapUserDTOToEntity } from './user.map';
import { User } from '../models/user.entity';

@injectable()
export class UserRepository {
  constructor(
    @inject(IOC_CORE_TOKENS.APIClient)
    private apiClient: APIClient,
  ) {}

  async getUser(id: string): Promise<User> {
    const dto = await this.apiClient.request<null, UserDTO>({
      route: `/api/users/${id}`,
      method: HttpMethod.GET,
      validationSchema: {
        response: userResponseSchema,
      },
    });

    // Маппим DTO в Entity внутри Repository
    return mapUserDTOToEntity(dto);
  }
}
```

UseCase получает готовую Entity:

```typescript
@injectable()
export class GetUserUsecase {
  constructor(
    @inject(DI_TOKENS.USER_REPOSITORY)
    private userRepository: UserRepository,
    @inject(DI_TOKENS.USER_MODEL)
    private userModel: UserModel,
  ) {}

  async execute(userId: string): Promise<void> {
    // Repository возвращает Entity, не DTO
    const user = await this.userRepository.getUser(userId);
    this.userModel.setUser(user);
  }
}
```

## executeWithAbortHandling

Утилита для безопасного выполнения асинхронных запросов с обработкой отмены.

```typescript
import { executeWithAbortHandling } from '@platform/core';

@injectable()
export class GetJokeUsecase {
  private requestIdTracker = { current: 0 };

  constructor(
    @inject(DI_TOKENS.REPOSITORY)
    private repository: JokesRepository,
    @inject(DI_TOKENS.MODEL)
    private model: JokesModel,
  ) {}

  async execute(): Promise<void> {
    await executeWithAbortHandling({
      // Функция запроса
      requestFn: async () => {
        const jokes = await this.repository.getJoke();
        return jokes[0];
      },

      // Получение предыдущих данных (для восстановления при отмене)
      getPreviousData: () => this.model.joke,

      // Установка данных в Model
      setData: (joke) => {
        if (joke) {
          this.model.setJoke(joke);
        }
      },

      // Управление состоянием загрузки
      setLoading: (loading) => {
        this.model.loading = loading;
      },

      // Обработка ошибок (не вызывается при отмене)
      onError: (error) => {
        if (error instanceof Error) {
          this.appModel.notification = error.message;
        }
      },

      // Трекер для отслеживания актуальности запроса
      requestIdTracker: this.requestIdTracker,
    });
  }
}
```

### Что делает executeWithAbortHandling

| Функция                      | Описание                                       |
| ---------------------------- | ---------------------------------------------- |
| Отслеживание актуальности    | Игнорирует результаты устаревших запросов      |
| Сохранение предыдущих данных | Восстанавливает данные при отмене              |
| Управление loading           | Автоматически устанавливает состояние загрузки |
| Обработка отмены             | Не показывает ошибки отмены в нотификациях     |

## Регистрация в DI

```typescript
// config/di.tokens.ts
export const DI_TOKENS = {
  REPOSITORY_JOKES: 'JokesRepository',
  // ...
};

// config/di.config.ts
import { JokesRepository } from '../data/jokes.repository';

export const diConfig: IDIConfig = {
  register: (container) => {
    container.bind(DI_TOKENS.REPOSITORY_JOKES).to(JokesRepository);
  },
};
```

## Эндпоинты

Храните эндпоинты в отдельном файле:

```typescript
// config/endpoints.ts
export enum EEndpoints {
  JOKES = '/api/jokes',
  USERS = '/api/users',
  AUTH_LOGIN = '/api/auth/login',
}
```

```typescript
// В Repository
async getJoke(): Promise<JokeResponseDTO[]> {
  return await this.apiClient.request({
    route: EEndpoints.JOKES,
    method: HttpMethod.GET,
    // ...
  });
}
```

## Связанные разделы

- [MVVM паттерн](./mvvm-pattern.md)
- [Use Cases](./usecases.md)
- [Как это работает](../how-it-works.md)
