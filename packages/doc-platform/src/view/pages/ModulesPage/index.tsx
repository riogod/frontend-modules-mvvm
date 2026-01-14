import { type FC } from 'react';
import { Container, Typography, Paper } from '@platform/ui';
import { useTranslation } from 'react-i18next';
import { MarkdownRenderer } from '../../common';

const pageMarkdown = `# Создание модуля

Модули в MFP бывают двух видов:

- **MFE модули** — независимые пакеты в \`packages/\`, могут быть локальными или удаленными
- **Локальные модули** — расположены в \`host/src/modules/\`, всегда загружаются локально

## Способы создания

| Способ                      | Для чего         | Сложность                |
| --------------------------- | ---------------- | ------------------------ |
| Лаунчер                     | MFE модули       | Простой (рекомендуется)  |
| Вручную                     | Локальные модули | Средний                  |
| Копирование MFE → локальный | Локальные модули | Простой (быстрый способ) |

## Создание MFE модуля через Лаунчер

> Рекомендуемый способ. Лаунчер создает всю структуру и настройки автоматически.

### Шаг 1. Запустите лаунчер

\`\`\`bash
npm start
\`\`\`

### Шаг 2. Выберите "Создать новый MFE модуль"

### Шаг 3. Введите название модуля

\`\`\`
Введите название модуля (kebab-case): my-feature
\`\`\`

Лаунчер создаст модуль в \`packages/my-feature/\` с готовой структурой:

\`\`\`
packages/my-feature/
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.mts
├── vite.config.local.mts
└── src/
    ├── config/
    │   ├── module_config.ts    # Конфигурация модуля
    │   ├── routes.ts           # Маршруты
    │   ├── di.config.ts        # DI конфигурация
    │   ├── di.tokens.ts        # DI токены
    │   └── i18n/               # Переводы
    │       ├── en_my-feature.json
    │       └── ru_my-feature.json
    ├── models/                 # Модели данных
    ├── viewmodels/             # ViewModels
    ├── usecases/               # Use Cases
    ├── view/                   # React компоненты
    │   └── pages/
    │       └── HomePage.tsx
    └── vite-env.d.ts
\`\`\`

### Шаг 4. Добавьте модуль в конфигурацию лаунчера

1. Запустите \`npm start\`
2. Выберите конфигурацию → "Редактировать модули"
3. Найдите \`my-feature\` и выберите источник (LOCAL)

Готово! Модуль доступен по адресу \`/my-feature\`.

### Автоматическая регистрация MFE модулей

MFE модули **не нужно** добавлять в \`host/src/modules/modules.ts\`. Они регистрируются автоматически:

| Режим | Источник регистрации                             |
| ----- | ------------------------------------------------ |
| DEV   | Конфигурация лаунчера (\`.launcher/configs.json\`) |
| PROD  | Манифест с сервера                               |

Параметры модуля (loadType, loadPriority, featureFlags, permissions) берутся из \`module_config.ts\`:

\`\`\`typescript
// packages/my-feature/src/config/module_config.ts
export default {
  // ... ROUTES, onModuleInit, I18N

  // Эти данные используются для регистрации модуля
  mockModuleInfo: {
    name: 'my-feature',
    loadType: 'normal',
    loadPriority: 1,
    dependencies: [],
    featureFlags: ['my-feature.module.load.feature'],
    accessPermissions: ['my-feature.module.load.permission'],
  },
} as ModuleConfig;
\`\`\`

## Создание локального модуля

Локальные модули размещаются в \`host/src/modules/\`. Они всегда загружаются из бандла хоста.

### Быстрый способ: копирование MFE модуля

1. Создайте MFE модуль через лаунчер
2. Скопируйте \`packages/my-feature/src/\` в \`host/src/modules/my-feature/\`
3. Удалите \`packages/my-feature/\`
4. Зарегистрируйте как локальный модуль

### Ручное создание

#### Шаг 1. Создайте структуру папок

\`\`\`bash
mkdir -p host/src/modules/my-local-module/config/i18n
mkdir -p host/src/modules/my-local-module/view/pages
mkdir -p host/src/modules/my-local-module/viewmodels
mkdir -p host/src/modules/my-local-module/models
mkdir -p host/src/modules/my-local-module/usecases
\`\`\`

#### Шаг 2. Создайте конфигурацию модуля

\`\`\`typescript
// host/src/modules/my-local-module/config/module_config.ts
import { type ModuleConfig } from '@platform/core';
import { routes } from './routes';
import { log } from '@platform/core';
import { DI_CONFIG } from './di.config';

import en from './i18n/en_my-local-module.json';
import ru from './i18n/ru_my-local-module.json';

export default {
  ROUTES: () => routes,

  onModuleInit: (bootstrap) => {
    DI_CONFIG(bootstrap.di);
    log.debug('initialized', { prefix: 'module.my-local-module' });
  },

  I18N: (i18n) => {
    i18n.addResourceBundle('en', 'my-local-module', en);
    i18n.addResourceBundle('ru', 'my-local-module', ru);
  },
} as ModuleConfig;
\`\`\`

#### Шаг 3. Создайте маршруты

\`\`\`typescript
// host/src/modules/my-local-module/config/routes.ts
import { type IRoutes } from '@platform/core';
import { lazy } from 'react';

export const MY_LOCAL_MODULE_ROUTES = {
  HOME: 'my-local-module',
};

export const routes: IRoutes = [
  {
    name: 'my-local-module',
    path: '/my-local-module',
    menu: {
      text: 'my-local-module:menu.title',
    },
    browserTitle: 'My Local Module',
    pageComponent: lazy(() => import('../view/pages/HomePage')),
  },
];
\`\`\`

#### Шаг 4. Создайте DI конфигурацию

\`\`\`typescript
// host/src/modules/my-local-module/config/di.tokens.ts
export const IOC_TOKENS = {
  VIEW_MODEL: Symbol.for('MyLocalModule.ViewModel'),
};
\`\`\`

\`\`\`typescript
// host/src/modules/my-local-module/config/di.config.ts
import { type Container } from 'inversify';
import { IOC_TOKENS } from './di.tokens';
import { MyViewModel } from '../viewmodels/my.vm';

export function DI_CONFIG(container: Container): void {
  container.bind(IOC_TOKENS.VIEW_MODEL).to(MyViewModel);
}
\`\`\`

#### Шаг 5. Создайте страницу

\`\`\`typescript
// host/src/modules/my-local-module/view/pages/HomePage.tsx
import { observer } from 'mobx-react-lite';
import { useTranslation } from 'react-i18next';
import { Typography, Box } from '@platform/ui';

const HomePage = observer(() => {
  const { t } = useTranslation('my-local-module');

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4">{t('title')}</Typography>
    </Box>
  );
});

export default HomePage;
\`\`\`

#### Шаг 6. Создайте файлы переводов

\`\`\`json
// host/src/modules/my-local-module/config/i18n/en_my-local-module.json
{
  "title": "My Local Module",
  "menu": {
    "title": "My Module"
  }
}
\`\`\`

\`\`\`json
// host/src/modules/my-local-module/config/i18n/ru_my-local-module.json
{
  "title": "Мой локальный модуль",
  "menu": {
    "title": "Мой модуль"
  }
}
\`\`\`

#### Шаг 7. Зарегистрируйте модуль

\`\`\`typescript
// host/src/modules/modules.ts
import { type Module, ModuleLoadType } from './interface';
import MyLocalModuleConfig from './my-local-module/config/module_config';

export const app_modules: Module[] = [
  // ... другие модули

  {
    name: 'my-local-module',
    description: 'Локальный модуль',
    config: MyLocalModuleConfig, // Синхронный импорт
    loadType: ModuleLoadType.NORMAL,
    loadPriority: 5,
    loadCondition: {
      featureFlags: ['my-local-module.load.feature'],
      accessPermissions: ['my-local-module.load.permission'],
    },
  },
];
\`\`\`

## Различия MFE и локальных модулей

| Характеристика    | MFE модуль                       | Локальный модуль       |
| ----------------- | -------------------------------- | ---------------------- |
| Расположение      | \`packages/\`                      | \`host/src/modules/\`    |
| Регистрация       | Автоматически (лаунчер/манифест) | Вручную в \`modules.ts\` |
| Импорт конфига    | Динамический (\`import()\`)        | Синхронный             |
| Может быть remote | Да                               | Нет                    |
| Отдельная сборка  | Да                               | Нет (часть хоста)      |
| Hot Reload        | Через Vite                       | Часть хоста            |

## Типы модулей по загрузке

### INIT модули

Загружаются при старте, до рендера UI:

\`\`\`typescript
{
  name: 'core',
  loadType: ModuleLoadType.INIT,
  loadPriority: 0,  // Меньше = раньше
  config: CoreConfig,
  // loadCondition НЕ поддерживается
}
\`\`\`

### NORMAL модули

Загружаются после рендера UI:

\`\`\`typescript
{
  name: 'my-feature',
  loadType: ModuleLoadType.NORMAL,
  loadPriority: 10,
  config: import('@mfe/my-feature/config').then((m) => m.default),
  loadCondition: {
    featureFlags: ['my-feature.enabled'],
    accessPermissions: ['my-feature.view'],
    dependencies: ['auth'],  // Другие модули
  },
}
\`\`\`

## Проверка модуля

После создания:

1. Запустите приложение: \`npm start\`
2. Откройте в браузере: \`http://localhost:4200/my-feature\`
3. Проверьте консоль на ошибки
4. Убедитесь, что модуль появился в меню (если настроено)

## Частые ошибки

### Модуль не загружается

- Проверьте \`loadCondition\` — feature flags и permissions должны быть в манифесте
- Проверьте, добавлен ли модуль в \`modules.ts\`
- Проверьте консоль на ошибки

### Роуты не работают

- Убедитесь, что \`ROUTES\` возвращает функцию: \`ROUTES: () => routes\`
- Проверьте уникальность имен маршрутов

### Переводы не загружаются

- Проверьте namespace в \`useTranslation('my-module')\`
- Убедитесь, что \`I18N\` функция вызывается в \`module_config.ts\`


---

# Работа с данными

Слой данных отвечает за взаимодействие с внешними источниками: API, LocalStorage, IndexedDB и другими.

## Структура

\`\`\`
data/
├── entity.repository.ts           # Репозиторий
├── entity.dto.ts                  # DTO интерфейсы
├── entity.map.ts                  # Маппер данных в сущность проекта
└── validation/
    └── entity.response.schema.ts  # Zod схемы валидации
\`\`\`

## Repository

Repository инкапсулирует работу с внешними источниками данных. Он скрывает детали реализации (HTTP, LocalStorage и т.д.) от остального приложения.

\`\`\`typescript
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
\`\`\`

### Правила Repository

| Правило              | Описание                                            |
| -------------------- | --------------------------------------------------- |
| \`@injectable()\`      | Репозиторий регистрируется в DI                     |
| Один источник данных | Один репозиторий работает с одним типом данных      |
| Маппинг внутри       | Репозиторий маппит DTO в Entity и возвращает Entity |
| Валидация ответа     | Рекомендуется использовать Zod схему для валидации  |
| Валидация запроса    | Рекомендуется использовать Zod схему для валидации  |
| \`useAbortController\` | Включайте для автоматической отмены дублей запросов |

### Типы репозиториев

**API Repository** — работа с HTTP API:

\`\`\`typescript
@injectable()
export class UserRepository {
  constructor(
    @inject(IOC_CORE_TOKENS.APIClient)
    private apiClient: APIClient,
  ) {}

  async getUser(id: string): Promise<UserDTO> {
    return await this.apiClient.request<null, UserDTO>({
      route: \`/api/users/\${id}\`,
      method: HttpMethod.GET,
      validationSchema: {
        response: userResponseSchema,
      },
    });
  }
}
\`\`\`

**LocalStorage Repository** — работа с локальным хранилищем:

\`\`\`typescript
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
\`\`\`

## DTO (Data Transfer Object)

DTO описывает структуру данных от внешнего источника. Это контракт между клиентом и сервером.

\`\`\`typescript
// data/jokes.dto.ts
export interface JokeResponseDTO {
  id: number;
  type: string;
  setup: string;
  punchline: string;
}
\`\`\`

### Правила DTO

| Правило           | Описание                                 |
| ----------------- | ---------------------------------------- |
| Только интерфейсы | DTO — это интерфейсы, не классы          |
| Соответствие API  | Структура DTO должна точно повторять API |
| Именование        | Суффикс \`DTO\` или \`ResponseDTO\`          |
| Без логики        | DTO не содержит методов                  |

### Пример сложного DTO

\`\`\`typescript
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
\`\`\`

## Валидация с Zod

Zod схемы валидируют данные от API в runtime. Если данные не соответствуют схеме, запрос завершается с ошибкой.

\`\`\`typescript
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
\`\`\`

### Частые паттерны Zod

\`\`\`typescript
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
\`\`\`

### Валидация в APIClient

APIClient автоматически валидирует response через Zod:

\`\`\`typescript
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
\`\`\`

Если валидация не прошла, APIClient выбросит \`ZodError\`.

## Маппинг DTO в Entity

Entity — это структура данных для использования внутри модуля. Маппинг DTO в Entity выполняется в Repository.

### Простой маппинг (DTO = Entity)

Если структура DTO подходит для использования в модуле:

\`\`\`typescript
// models/jokes.entity.ts
import { type JokeResponseDTO } from '../data/jokes.dto';

// Entity совпадает с DTO
export type Joke = JokeResponseDTO;
\`\`\`

В этом случае маппер не нужен — Repository возвращает данные напрямую.

### Маппинг с преобразованием

Если структура DTO отличается от нужной структуры Entity:

\`\`\`typescript
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
    return \`\${this.firstName} \${this.lastName}\`;
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
\`\`\`

### Использование маппера в Repository

\`\`\`typescript
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
      route: \`/api/users/\${id}\`,
      method: HttpMethod.GET,
      validationSchema: {
        response: userResponseSchema,
      },
    });

    // Маппим DTO в Entity внутри Repository
    return mapUserDTOToEntity(dto);
  }
}
\`\`\`

UseCase получает готовую Entity:

\`\`\`typescript
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
\`\`\`

## executeWithAbortHandling

Утилита для безопасного выполнения асинхронных запросов с обработкой отмены.

\`\`\`typescript
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
\`\`\`

### Что делает executeWithAbortHandling

| Функция                      | Описание                                       |
| ---------------------------- | ---------------------------------------------- |
| Отслеживание актуальности    | Игнорирует результаты устаревших запросов      |
| Сохранение предыдущих данных | Восстанавливает данные при отмене              |
| Управление loading           | Автоматически устанавливает состояние загрузки |
| Обработка отмены             | Не показывает ошибки отмены в нотификациях     |

## Регистрация в DI

\`\`\`typescript
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
\`\`\`

## Эндпоинты

Храните эндпоинты в отдельном файле:

\`\`\`typescript
// config/endpoints.ts
export enum EEndpoints {
  JOKES = '/api/jokes',
  USERS = '/api/users',
  AUTH_LOGIN = '/api/auth/login',
}
\`\`\`

\`\`\`typescript
// В Repository
async getJoke(): Promise<JokeResponseDTO[]> {
  return await this.apiClient.request({
    route: EEndpoints.JOKES,
    method: HttpMethod.GET,
    // ...
  });
}
\`\`\`


# Межмодульное взаимодействие

Модули изолированы друг от друга. Взаимодействие между ними осуществляется только через DI контейнер.

## Основные правила

\`\`\`
┌─────────────────────────────────────────────────────────────────────┐
│                          DI Container                               │
│                                                                     │
│   Модуль A              Модуль B              Модуль C              │
│   регистрирует ───────► получает ◄─────────── регистрирует          │
│   токены                токены                токены                │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
\`\`\`

| Правило                    | Описание                                          |
| -------------------------- | ------------------------------------------------- |
| Взаимодействие через DI    | Всё взаимодействие только через DI контейнер      |
| Импорт типов разрешён      | Можно импортировать интерфейсы и типы             |
| Импорт реализаций запрещён | Нельзя импортировать классы и функции напрямую    |
| Указывайте dependencies    | Для гарантии порядка загрузки и доступа к токенам |

> **Важно:** Прямой импорт реализаций между модулями категорически запрещён — как для MFE модулей, так и для локальных.

## Что разрешено импортировать

### ✅ Разрешено между модулями: только интерфейсы и типы

\`\`\`typescript
// ПРАВИЛЬНО — импорт только типов из другого модуля
import type { Product } from '@packages/catalog/models/product.entity';
import type { CatalogModel } from '@packages/catalog/models/catalog.model';
\`\`\`

### ✅ Разрешено из библиотек: всё

Через библиотеки (\`@platform/*\`) можно шарить токены, enum, сущности и реализации:

\`\`\`typescript
// ПРАВИЛЬНО — импорт из библиотек
import { IOC_CORE_TOKENS, HttpMethod } from '@platform/core';
import { AccessControlModel } from '@platform/common';
import { useVM, ThemeProvider } from '@platform/ui';
\`\`\`

### ❌ Запрещено между модулями: классы, реализации, enums и токены

\`\`\`typescript
// НЕПРАВИЛЬНО — прямой импорт реализации из другого модуля
import { CatalogModel } from '@packages/catalog/models/catalog.model';

// НЕПРАВИЛЬНО — импорт токенов из другого модуля
import { CATALOG_DI_TOKENS } from '@packages/catalog/config/di.tokens';

// НЕПРАВИЛЬНО — импорт enum из другого модуля
import { CatalogStatus } from '@packages/catalog/models/catalog.enum';
\`\`\`

## Взаимодействие через DI

### Способ 1: Токены из библиотек

Платформенные токены доступны через \`@platform/core\`:

\`\`\`typescript
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
\`\`\`

### Способ 2: Описание токенов в своём модуле

Для токенов из других модулей — описываем у себя:

\`\`\`typescript
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
\`\`\`

Использование:

\`\`\`typescript
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
\`\`\`

> **Важно:** Значение токена (\`'CatalogModel'\`) должно совпадать с тем, как его регистрирует модуль-поставщик.

### Указание зависимости

Для гарантии доступности токена укажите модуль в dependencies:

\`\`\`typescript
// packages/orders/src/config/module_config.ts
export const mockModuleInfo: RemoteModuleInfo = {
  name: 'orders',
  loadType: ModuleLoadType.NORMAL,
  dependencies: ['catalog'], // Гарантирует загрузку catalog до orders
};
\`\`\`

### Защита от отсутствующих зависимостей

Используйте декоратор \`@optional()\` для защиты от ошибки, если сущность не зарегистрирована в DI:

\`\`\`typescript
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
\`\`\`

| Сценарий                 | Без \`@optional()\`                  | С \`@optional()\`        |
| ------------------------ | ---------------------------------- | ---------------------- |
| Токен зарегистрирован    | Инжектится зависимость             | Инжектится зависимость |
| Токен не зарегистрирован | Ошибка: No matching bindings found | Значение \`undefined\`   |

> **Когда использовать:** \`@optional()\` полезен для опциональных интеграций, когда модуль может работать без зависимости.

## Шаринг компонентов

### ❌ Не рекомендуется: Module Federation remotes

Прямое использование remote компонентов через Module Federation создаёт жёсткую связь:

### ✅ Рекомендуется: обёртки через DI

Модуль-поставщик регистрирует компонент в DI:

\`\`\`typescript
// packages/catalog/src/config/di.config.ts
container.bind('ProductCardComponent').toConstantValue(ProductCard);
\`\`\`

Модуль-потребитель использует хук \`useSharedComponent\`:

\`\`\`typescript
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
\`\`\`

### Опции useSharedComponent

| Опция               | Тип         | По умолчанию | Описание                             |
| ------------------- | ----------- | ------------ | ------------------------------------ |
| \`moduleName\`        | \`string\`    | -            | Имя модуля для диагностики ошибок    |
| \`fallback\`          | \`ReactNode\` | -            | Fallback компонент, если не найден   |
| \`suppressErrors\`    | \`boolean\`   | \`true\`       | Подавлять ошибки и возвращать null   |
| \`validateComponent\` | \`boolean\`   | \`true\`       | Валидировать что это React компонент |

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

\`\`\`typescript
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
\`\`\`

Использование:

\`\`\`typescript
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
\`\`\`

## Типичные ошибки

### ❌ Прямой импорт между модулями

\`\`\`typescript
// НЕПРАВИЛЬНО — прямой импорт класса
import { CatalogModel } from '@packages/catalog/models/catalog.model';

@injectable()
export class OrdersUsecase {
  private catalog = new CatalogModel(); // Создание напрямую
}

// НЕПРАВИЛЬНО — импорт токенов из другого модуля
import { CATALOG_DI_TOKENS } from '@packages/catalog/config/di.tokens';
\`\`\`

\`\`\`typescript
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
\`\`\`

### ❌ Отсутствие зависимости в конфигурации

\`\`\`typescript
// НЕПРАВИЛЬНО — зависимость не указана
export const mockModuleInfo: RemoteModuleInfo = {
  name: 'orders',
  loadType: ModuleLoadType.NORMAL,
  // dependencies: ['catalog'] — забыли указать! и если модуль не загрузиться, то его сущности не появятся в DI контейнере
};

// Ошибка: No matching bindings found for CATALOG_DI_TOKENS.MODEL_CATALOG
\`\`\`

### ❌ Циклическая зависимость

\`\`\`typescript
// НЕПРАВИЛЬНО — цикл зависимостей
// catalog зависит от orders
// orders зависит от catalog

// Решение: выделите общую логику в отдельный модуль или библиотеку
\`\`\`




---

# Конфигурация модуля

Каждый модуль имеет файл конфигурации \`module_config.ts\`, который определяет его поведение: маршруты, инициализацию, переводы и мок-данные для разработки.

## Структура конфигурации

\`\`\`typescript
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
\`\`\`

## Интерфейс ModuleConfig

\`\`\`typescript
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
\`\`\`

## ROUTES — Маршруты модуля

Функция \`ROUTES\` возвращает массив маршрутов модуля. Маршруты регистрируются автоматически при загрузке модуля.

### Базовый маршрут

\`\`\`typescript
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
\`\`\`

### Маршрут с меню

\`\`\`typescript
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
\`\`\`

### Хуки жизненного цикла маршрута

за более полным набором конфигурации роутинга, можно обратиться к документации роутера

\`\`\`typescript
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
\`\`\`

**Параметры хуков:**

| Параметр    | Тип                  | Описание                     |
| ----------- | -------------------- | ---------------------------- |
| \`toState\`   | \`State\`              | Состояние целевого маршрута  |
| \`fromState\` | \`State\`              | Состояние исходного маршрута |
| \`deps\`      | \`RouterDependencies\` | Зависимости (DI, menu)       |

### Редирект

\`\`\`typescript
{
  name: 'home',
  path: '/',
  forwardTo: 'dashboard',  // Перенаправление на другой маршрут
}
\`\`\`

### Полный интерфейс IRoute

\`\`\`typescript
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
\`\`\`

## onModuleInit — Инициализация модуля

Функция \`onModuleInit\` вызывается при загрузке модуля. Здесь вы настраиваете DI, подписки и выполняете начальную логику.

### Базовая инициализация

\`\`\`typescript
onModuleInit: (bootstrap) => {
  // Регистрация DI
  DI_CONFIG(bootstrap.di);

  // Логирование
  log.debug('initialized', { prefix: 'module.my-module' });
},
\`\`\`

### Асинхронная инициализация

\`\`\`typescript
onModuleInit: async (bootstrap) => {
  // Регистрация DI
  DI_CONFIG(bootstrap.di);

  // Асинхронная загрузка данных
  const dataService = bootstrap.di.get<DataService>(DI_TOKENS.DATA_SERVICE);
  await dataService.preloadCriticalData();

  log.debug('initialized', { prefix: 'module.my-module' });
},
\`\`\`

### Доступ к Bootstrap

Объект \`bootstrap\` предоставляет доступ к сервисам приложения:

\`\`\`typescript
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
\`\`\`

## DI конфигурация

DI конфигурация выносится в отдельный файл \`di.config.ts\`.

### Токены DI

\`\`\`typescript
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
\`\`\`

### Регистрация зависимостей

\`\`\`typescript
// di.config.ts
import type { Container } from 'inversify';
import { MY_MODULE_DI_TOKENS } from './di.tokens';
import { DataModel } from '../models/data.model';
import { DataViewModel } from '../viewmodels/data.vm';
import { LoadDataUsecase } from '../usecases/loadData.usecase';
import { SaveDataUsecase } from '../usecases/saveData.usecase';

export const DI_CONFIG = (container: Container) => {
  // Models — singleton (одно состояние на модуль)
  container
    .bind(MY_MODULE_DI_TOKENS.MODEL_DATA)
    .to(DataModel)
    .inSingletonScope();

  // ViewModels
  container.bind(MY_MODULE_DI_TOKENS.VIEW_MODEL_DATA).to(DataViewModel);

  // Usecases
  container.bind(MY_MODULE_DI_TOKENS.USECASE_LOAD_DATA).to(LoadDataUsecase);
  container.bind(MY_MODULE_DI_TOKENS.USECASE_SAVE_DATA).to(SaveDataUsecase);

  return container;
};
\`\`\`

## I18N — Локализация

Функция \`I18N\` регистрирует переводы модуля.

### Регистрация переводов

\`\`\`typescript
import en from './i18n/en_my-module.json';
import ru from './i18n/ru_my-module.json';

I18N: (i18n) => {
  i18n.addResourceBundle('en', 'my-module', en);
  i18n.addResourceBundle('ru', 'my-module', ru);
},
\`\`\`

### Структура файлов переводов

\`\`\`
src/config/i18n/
├── en_my-module.json
└── ru_my-module.json
\`\`\`

### Пример файла переводов

\`\`\`json
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
\`\`\`

### Использование в компонентах

\`\`\`typescript
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
\`\`\`

### Плюрализация

\`\`\`json
{
  "items": {
    "count_zero": "No items",
    "count_one": "{{count}} item",
    "count_other": "{{count}} items"
  }
}
\`\`\`

\`\`\`typescript
t('items.count', { count: 5 }); // "5 items"
\`\`\`

## mockModuleInfo — Информация о модуле

Объект \`mockModuleInfo\` содержит метаданные модуля для манифеста. В DEV режиме эти данные используются для регистрации модуля.

\`\`\`typescript
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
\`\`\`

### Типы загрузки

| Тип      | Когда загружается | Примеры                   |
| -------- | ----------------- | ------------------------- |
| \`init\`   | До рендера UI     | core, layout              |
| \`normal\` | После рендера UI  | todo, dashboard, settings |

### Зависимости

\`\`\`typescript
// Модуль загрузится только после загрузки 'auth' и 'catalog'
dependencies: ['auth', 'catalog'],
\`\`\`

> Зависимости поддерживаются только для \`normal\` модулей.

### Feature Flags и Permissions

\`\`\`typescript
// Модуль загрузится только если:
// - feature flag 'admin.enabled' включен
// - permission 'admin.access' есть у пользователя
featureFlags: ['admin.enabled'],
accessPermissions: ['admin.access'],
\`\`\`

## mockModuleData — Мок-данные

Объект \`mockModuleData\` содержит тестовые данные для DEV режима.

\`\`\`typescript
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
\`\`\`

Эти данные автоматически добавляются в \`AccessControlModel\` при загрузке модуля в DEV режиме.

## mockHandlers — API моки

MSW handlers для мокирования API в DEV режиме.

### Создание моков

\`\`\`typescript
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
\`\`\`

### Регистрация моков

\`\`\`typescript
// module_config.ts
import { handlers } from './mocks';

export default {
  // ...
  mockHandlers: handlers,
} as ModuleConfig;
\`\`\`

### Мок-данные из файлов

\`\`\`typescript
// config/mocks/index.ts
import { http, HttpResponse } from 'msw';
import mockData from './data/items.json';

export const handlers = [
  http.get('/api/items', () => {
    return HttpResponse.json(mockData);
  }),
];
\`\`\`

## Полный пример конфигурации

\`\`\`typescript
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
\`\`\`

## Модуль без маршрутов

Некоторые модули не имеют UI и используются только для инициализации:

\`\`\`typescript
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
\`\`\`

## Различия MFE и локальных модулей

| Аспект           | MFE модуль           | Локальный модуль     |
| ---------------- | -------------------- | -------------------- |
| \`mockModuleInfo\` | Обязателен           | Не нужен             |
| \`mockModuleData\` | Используется         | Не нужен             |
| \`mockHandlers\`   | Используется         | Опционально          |
| Регистрация в DI | Через \`onModuleInit\` | Через \`onModuleInit\` |
| Переводы         | Через \`I18N\`         | Через \`I18N\`         |
| Маршруты         | Через \`ROUTES\`       | Через \`ROUTES\`       |

> Локальные модули не используют \`mockModuleInfo\` и \`mockModuleData\`, так как их параметры загрузки указываются напрямую в \`host/src/modules/modules.ts\`.

## Расширение конфигурации

Интерфейс \`ModuleConfig\` можно расширить, добавив собственные поля.

Вы можете расширить интерфейс \`ModuleConfig\`, добавив собственные поля:

\`\`\`typescript
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
\`\`\`

Использование в модуле:

\`\`\`typescript
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
\`\`\`

Для обработки новых полей добавьте логику в \`LifecycleManager\` или создайте отдельный обработчик:

\`\`\`typescript
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
\`\`\`

**Пример: добавление хука onModuleDestroy**

\`\`\`typescript
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
\`\`\`

> При расширении конфигурации следите за обратной совместимостью — новые поля должны быть опциональными.


---

# Типы модулей

Модули в платформе классифицируются по двум параметрам: **тип загрузки** (INIT/NORMAL) и **расположение** (local/MFE).

## Классификация модулей

\`\`\`
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
\`\`\`

## Типы по загрузке: INIT vs NORMAL

### INIT модули

INIT модули загружаются **до рендера UI**. Используйте их для критической функциональности, без которой приложение не может работать.

\`\`\`typescript
// host/src/modules/modules.ts
{
  name: 'core',
  config: CoreConfig,
  loadType: ModuleLoadType.INIT,
  loadPriority: 0,  // Загрузится первым
}
\`\`\`

**Характеристики:**

| Параметр         | Значение                          |
| ---------------- | --------------------------------- |
| Момент загрузки  | До рендера UI                     |
| Порядок загрузки | Последовательно по \`loadPriority\` |
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

\`\`\`typescript
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
\`\`\`

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

Зависимости между модулями гарантируют порядок инициализации. Если модуль \`orders\` зависит от модуля \`catalog\`, то \`catalog\` загрузится и выполнит \`onModuleInit\` **до** загрузки \`orders\`. Это позволяет \`orders\` использовать DI-токены, зарегистрированные модулем \`catalog\`:

\`\`\`typescript
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
\`\`\`

> Без указания зависимости модуль может загрузиться раньше и получить ошибку "No matching bindings found" при резолве DI-токена.

### Сравнение INIT и NORMAL

| Аспект               | INIT                                   | NORMAL                                  |
| -------------------- | -------------------------------------- | --------------------------------------- |
| \`loadType\`           | \`ModuleLoadType.INIT\`                  | \`ModuleLoadType.NORMAL\` (или не указан) |
| \`loadCondition\`      | Запрещен                               | Разрешен                                |
| \`loadPriority\`       | Критичен для порядка                   | Влияет на очередность                   |
| Загрузка             | Последовательно                        | Параллельно по уровням                  |
| UI во время загрузки | Loader/Splash screen                   | Приложение уже работает                 |
| Ошибка загрузки      | Критическая (приложение не запустится) | Graceful degradation                    |

## Типы по расположению: Local vs MFE

### Local модули

Local модули находятся в \`host/src/modules/\` и являются частью хост-приложения.

\`\`\`
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
\`\`\`

**Характеристики:**

- Регистрируются вручную в \`modules.ts\`
- Конфиг импортируется синхронно
- Не требуют \`mockModuleInfo\` (параметры указаны в \`modules.ts\`)
- \`mockModuleData\` опционален (можно указать в конфиге или в \`appStartData.json\`)
- Собираются вместе с хостом

**Регистрация:**

\`\`\`typescript
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
\`\`\`

**Конфигурация local модуля:**

\`\`\`typescript
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
\`\`\`

### MFE модули

MFE (Micro-Frontend) модули находятся в \`packages/\` и собираются отдельно от хоста.

\`\`\`
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
\`\`\`

**Характеристики:**

- Регистрируются автоматически (Launcher в DEV, манифест в PROD)
- Конфиг загружается через Module Federation (remote) или динамически
- Требуют \`mockModuleInfo\` и \`mockModuleData\` для DEV режима
- Собираются отдельно, имеют свой \`package.json\`

### Сравнение Local и MFE

| Аспект             | Local                          | MFE                             |
| ------------------ | ------------------------------ | ------------------------------- |
| Расположение       | \`host/src/modules/\`            | \`packages/\`                     |
| Регистрация        | Вручную в \`modules.ts\`         | Автоматически                   |
| \`mockModuleInfo\`   | Не нужен                       | Обязателен                      |
| \`mockModuleData\`   | Опционально (или appStartData) | Обязателен для условий загрузки |
| Сборка             | Вместе с хостом                | Отдельно                        |
| Загрузка кода      | Синхронно из бандла            | Через Module Federation         |
| Независимый деплой | Нет                            | Да                              |
| Создание           | Вручную или копированием       | Через Launcher                  |

## Комбинации типов

Модули могут комбинировать оба параметра:

| Тип загрузки | Расположение | Пример                | Описание                     |
| ------------ | ------------ | --------------------- | ---------------------------- |
| INIT         | Local        | \`core\`, \`core.layout\` | Базовая инфраструктура хоста |
| INIT         | MFE          | \`auth\`, \`analytics\`   | Критические микрофронтенды   |
| NORMAL       | Local        | \`local-module\`        | Фичи, встроенные в хост      |
| NORMAL       | MFE          | \`todo\`, \`dashboard\`   | Независимые микрофронтенды   |

## Выбор типа модуля

### Схема принятия решения

\`\`\`
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
\`\`\`

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

\`\`\`typescript
interface InitModule {
  name: string;
  loadType: ModuleLoadType.INIT;
  loadPriority?: number;
  config: ModuleConfig | Promise<ModuleConfig>;
  // loadCondition запрещен
}
\`\`\`

### NormalModule

\`\`\`typescript
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
\`\`\`


---

# MVVM паттерн

MVVM (Model-View-ViewModel) — архитектурный паттерн, используемый в модулях платформы. Он разделяет бизнес-логику, состояние и представление.

## Архитектура

\`\`\`
┌─────────────────────────────────────────────────────────────────┐
│                           View                                  │
│                    (React компоненты)                           │
│                                                                 │
│   ┌─────────────────┐      ┌─────────────────┐                  │
│   │    useVM()      │      │    observer()   │                  │
│   └────────┬────────┘      └────────┬────────┘                  │
└────────────┼────────────────────────┼───────────────────────────┘
             │                        │
             │ получает               │ подписывается на изменения
             ▼                        ▼
┌─────────────────────────────────────────────────────────────────┐
│                        ViewModel                                │
│                    (MobX observable)                            │
│                                                                 │
│   - Предоставляет данные для View                               │
│   - Вызывает Use Cases                                          │
│   - Не содержит бизнес-логику                                   │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           │ делегирует
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Use Cases                                │
│                    (бизнес-логика)                              │
│                                                                 │
│   - Оркестрирует операции                                       │
│   - Работает с Model и Repository                               │
│   - Единственное место для бизнес-логики                        │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           │ изменяет / читает
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                          Model                                  │
│                    (MobX observable)                            │
│                                                                 │
│   - Хранит состояние                                            │
│   - Предоставляет методы изменения                              │
│   - Не знает о View и ViewModel                                 │
└─────────────────────────────────────────────────────────────────┘
\`\`\`

## Структура файлов модуля

\`\`\`
packages/your-module/src/
├── config/
│   ├── di.tokens.ts       # DI токены
│   ├── di.config.ts       # Регистрация зависимостей
│   └── routes.ts          # Маршруты
├── models/
│   ├── entity.entity.ts     # Entity — структура данных
│   └── entity.model.ts      # Model — методы работы с данными
├── viewmodels/
│   └── entity.vm.ts         # ViewModel
├── usecases/
│   ├── loadEntity.usecase.ts
│   └── updateEntity.usecase.ts
├── data/
│   ├── entity.repository.ts  # Работа с внешними источниками данных
│   ├── entity.dto.ts         # Data Transfer Objects
│   └── validation/
│       └── entity.schema.ts  # Zod схемы валидации
└── view/
    ├── EntityPage.tsx       # Страница
    └── components/
        └── EntityCard.tsx   # Компоненты
\`\`\`

## Model

Model хранит состояние и предоставляет методы для его изменения. Используйте MobX для реактивности.

\`\`\`typescript
// models/todo_list.model.ts
import { action, computed, makeAutoObservable } from 'mobx';
import { injectable } from 'inversify';
import { TodoList } from './todo_list.entity';

@injectable()
export class TodoListModel {
  private _todos: TodoList[] = [];
  private _loading = false;

  constructor() {
    makeAutoObservable(this, {
      items: computed,
      setItem: action,
      removeItem: action,
    });
  }

  // Геттеры для доступа к данным
  get items(): TodoList[] {
    return this._todos;
  }

  get loading(): boolean {
    return this._loading;
  }

  // Методы изменения состояния
  setItem(item: TodoList) {
    this._todos.push(item);
  }

  removeItem(id: string) {
    this._todos = this._todos.filter((item) => item.id !== id);
  }

  setLoading(loading: boolean) {
    this._loading = loading;
  }

  // Очистка при размонтировании
  dispose() {
    this._todos = [];
    this._loading = false;
  }
}
\`\`\`

**Правила для Model:**

| Правило                | Описание                             |
| ---------------------- | ------------------------------------ |
| Только состояние       | Model не содержит бизнес-логику      |
| Приватные поля         | Данные доступны только через геттеры |
| \`@injectable()\`        | Model регистрируется в DI            |
| \`makeAutoObservable()\` | Делает свойства реактивными          |
| \`dispose()\`            | Метод очистки состояния              |

### Разделение на Entity и Model

Model можно разделить на две части для удобства:

- **Entity** — содержит структуру данных
- **Model** — содержит методы для работы с этой структурой

\`\`\`
models/
├── todo_list.entity.ts      # Entity — структура данных
└── todo_list.model.ts       # Model — методы работы с данными
\`\`\`

**Entity** — класс с полями данных:

\`\`\`typescript
// models/todo_list.entity.ts
export class TodoList {
  id: string = '';
  description: string = '';
  completed: boolean = false;
  created_at: Date = new Date();
  updated_at: Date = new Date();
}
\`\`\`

**Model** — класс с состоянием и методами для работы с Entity:

\`\`\`typescript
// models/todo_list.model.ts
import { TodoList } from './todo_list.entity';

@injectable()
export class TodoListModel {
  private _todos: TodoList[] = []; // Массив объектов Entity

  get items(): TodoList[] {
    return this._todos;
  }

  setItem(item: TodoList) {
    this._todos.push(item);
  }

  removeItem(id: string) {
    this._todos = this._todos.filter((item) => item.id !== id);
  }
}
\`\`\`

> Такое разделение упрощает типизацию, тестирование и переиспользование структур данных. Возможно так же структуры делать наблюдаемыми через mobx.

## ViewModel

ViewModel связывает View с Model и Use Cases. Предоставляет данные и методы для View.

> **Важно:** ViewModel — это **не хранилище данных**. Он только предоставляет доступ к данным из Model и делегирует операции в Use Cases. Все состояние хранится в Model.

\`\`\`typescript
// viewmodels/todo_list.vm.ts
import { makeAutoObservable } from 'mobx';
import { inject, injectable } from 'inversify';
import { TodoListModel } from '../models/todo_list.model';
import { AddTaskUsecase, RemoveTaskUsecase } from '../usecases';
import { TODO_DI_TOKENS } from '../config/di.tokens';

@injectable()
export class TodoListViewModel {
  constructor(
    @inject(TODO_DI_TOKENS.MODEL_TODO_LIST)
    private todoModel: TodoListModel,
    @inject(TODO_DI_TOKENS.USECASE_ADD_TASK)
    private addTaskUsecase: AddTaskUsecase,
    @inject(TODO_DI_TOKENS.USECASE_REMOVE_TASK)
    private removeTaskUsecase: RemoveTaskUsecase,
  ) {
    makeAutoObservable(this);
  }

  // Геттеры — прокси к Model
  get items() {
    return this.todoModel.items;
  }

  get loading() {
    return this.todoModel.loading;
  }

  // Вычисляемые свойства
  get completedCount() {
    return this.todoModel.items.filter((item) => item.completed).length;
  }

  get pendingCount() {
    return this.todoModel.items.filter((item) => !item.completed).length;
  }

  // Методы — делегируют в Use Cases
  addItem(text: string) {
    this.addTaskUsecase.execute(text);
  }

  removeItem(id: string) {
    this.removeTaskUsecase.execute(id);
  }
}
\`\`\`

**Правила для ViewModel:**

| Правило              | Описание                                                      |
| -------------------- | ------------------------------------------------------------- |
| Нет бизнес-логики    | ViewModel только делегирует в Use Cases                       |
| Геттеры из Model     | Данные берутся из Model через геттеры                         |
| Вычисляемые свойства | Производные данные вычисляются в ViewModel                    |
| Несколько ViewModel  | View может использовать несколько ViewModel при необходимости |
| \`@injectable()\`      | ViewModel регистрируется в DI                                 |

## Use Cases

Use Case инкапсулирует единицу бизнес-логики. Оркестрирует работу с Model и Repository.

ViewModel вызывает Use Cases для выполнения операций:

\`\`\`typescript
// В ViewModel
addItem(text: string) {
  this.addTaskUsecase.execute(text);  // Делегирование в Use Case
}
\`\`\`

> Подробнее о создании и использовании Use Cases 

## View

View — React компоненты, отображающие данные из ViewModel.

### Страница

\`\`\`typescript
// view/TodoPage.tsx
import { type FC } from 'react';
import { useVM, Container, Box } from '@platform/ui';
import { Observer } from 'mobx-react-lite';
import type { TodoListViewModel } from '../viewmodels/todo_list.vm';
import { TODO_DI_TOKENS } from '../config/di.tokens';
import TodoInput from './components/TodoInput';
import TodoItem from './components/TodoItem';

const TodoPage: FC = () => {
  // Получаем ViewModel из DI
  const viewModel = useVM<TodoListViewModel>(TODO_DI_TOKENS.VIEW_MODEL_TODO_LIST);

  return (
    <Container>
      <TodoInput onAdd={(text) => viewModel.addItem(text)} />

      {/* Observer подписывается на изменения */}
      <Observer>
        {() => (
          <Box>
            {viewModel.items.map((item) => (
              <TodoItem
                key={item.id}
                item={item}
                onRemove={() => viewModel.removeItem(item.id)}
              />
            ))}
          </Box>
        )}
      </Observer>
    </Container>
  );
};

export default TodoPage;
\`\`\`

### Компонент с observer

\`\`\`typescript
// view/components/JokeMessage.tsx
import { type FC } from 'react';
import { observer } from 'mobx-react-lite';
import { useVM, Typography, Button, Skeleton } from '@platform/ui';
import type { JokeViewModel } from '../../viewmodels/joke.vm';
import { API_EXAMPLE_DI_TOKENS } from '../../config/di.tokens';

const JokeMessage: FC = () => {
  const viewModel = useVM<JokeViewModel>(API_EXAMPLE_DI_TOKENS.VIEW_MODEL_JOKE);

  const handleGetJoke = () => {
    void viewModel.getJoke();
  };

  if (viewModel.loading) {
    return <Skeleton height={150} />;
  }

  return (
    <div>
      <Typography>{viewModel.joke?.setup}</Typography>
      <Typography>{viewModel.joke?.punchline}</Typography>
      <Button onClick={handleGetJoke}>Get Joke</Button>
    </div>
  );
};

// observer делает компонент реактивным
export default observer(JokeMessage);
\`\`\`

### useVM и observer

\`useVM()\` и \`observer()\` работают вместе:

- \`useVM()\` — получает ViewModel из DI контейнера
- \`observer()\` — делает компонент реактивным (без него изменения MobX не вызовут перерисовку)

| Инструмент   | Назначение                           |
| ------------ | ------------------------------------ |
| \`useVM()\`    | Получение ViewModel из DI            |
| \`observer()\` | Обертка компонента для реактивности  |
| \`<Observer>\` | Локальная подписка внутри компонента |

**Примеры использования:**

\`\`\`typescript
// Компонент обернут в observer — реактивен весь
const MyComponent: FC = observer(() => {
  const vm = useVM<MyViewModel>(DI_TOKENS.VIEW_MODEL);
  return <div>{vm.data}</div>;
});

// Или локальная подписка через Observer
const MyComponent: FC = () => {
  const vm = useVM<MyViewModel>(DI_TOKENS.VIEW_MODEL);
  return (
    <div>
      <Observer>{() => <span>{vm.data}</span>}</Observer>
    </div>
  );
};
\`\`\`

## Repository (слой данных)

Repository инкапсулирует работу с внешними источниками данных (API, LocalStorage и т.д.).

Use Cases используют Repository для получения и сохранения данных:

\`\`\`typescript
// В Use Case
const data = await this.repository.getData();
this.model.setData(data);
\`\`\`

> Подробнее о Repository, DTO и валидации см. Работа с данными

## DI регистрация

Все компоненты MVVM регистрируются в DI контейнере.

### Токены

\`\`\`typescript
// config/di.tokens.ts
export enum TODO_DI_TOKENS {
  // Models
  MODEL_TODO_LIST = 'TodoListModel',

  // ViewModels
  VIEW_MODEL_TODO_LIST = 'TodoListViewModel',

  // Usecases
  USECASE_ADD_TASK = 'AddTaskUsecase',
  USECASE_REMOVE_TASK = 'RemoveTaskUsecase',
  USECASE_UPDATE_TASK = 'UpdateTaskUsecase',

  // Repositories
  REPOSITORY_TODO = 'TodoRepository',
}
\`\`\`

### Регистрация

\`\`\`typescript
// config/di.config.ts
import type { Container } from 'inversify';
import { TODO_DI_TOKENS } from './di.tokens';
import { TodoListModel } from '../models/todo_list.model';
import { TodoListViewModel } from '../viewmodels/todo_list.vm';
import { AddTaskUsecase, RemoveTaskUsecase } from '../usecases';

export const DI_CONFIG = (container: Container) => {
  // Models — singleton (одно состояние на модуль)
  container
    .bind(TODO_DI_TOKENS.MODEL_TODO_LIST)
    .to(TodoListModel)
    .inSingletonScope();

  // ViewModels
  container.bind(TODO_DI_TOKENS.VIEW_MODEL_TODO_LIST).to(TodoListViewModel);

  // Usecases
  container.bind(TODO_DI_TOKENS.USECASE_ADD_TASK).to(AddTaskUsecase);
  container.bind(TODO_DI_TOKENS.USECASE_REMOVE_TASK).to(RemoveTaskUsecase);

  return container;
};
\`\`\`

> Model обычно регистрируется как singleton, чтобы состояние сохранялось между переходами по страницам.

## Поток данных

\`\`\`
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│    View     │───▶│  ViewModel  │───▶│   UseCase   │───▶│    Model    │
│   (click)   │    │  (method)   │    │  (execute)  │    │  (setState) │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
       ▲                  ▲                                     │
       │                  │                                     │
       │   observer()     │         MobX реактивность           │
       └──────────────────┴─────────────────────────────────────┘
\`\`\`

**Пример потока:**

1. Пользователь нажимает кнопку "Add Task" в View
2. View вызывает \`viewModel.addItem(text)\`
3. ViewModel делегирует в \`addTaskUsecase.execute(text)\`
4. UseCase создает задачу и вызывает \`model.setItem(task)\`
5. Model обновляет состояние
6. ViewModel (геттеры из Model) становится реактивно обновлённым
7. View (обёрнутый в \`observer\`) перерисовывается

## Типичные ошибки

### ❌ Бизнес-логика в ViewModel

\`\`\`typescript
// НЕПРАВИЛЬНО
class TodoListViewModel {
  addItem(text: string) {
    if (!text) return;
    const task = {
      id: Date.now().toString(),
      description: text,
      completed: false,
    };
    this.todoModel.setItem(task); // Бизнес-логика в ViewModel
  }
}

// ПРАВИЛЬНО
class TodoListViewModel {
  addItem(text: string) {
    this.addTaskUsecase.execute(text); // Делегирование в UseCase
  }
}
\`\`\`

### ❌ API запросы в ViewModel

\`\`\`typescript
// НЕПРАВИЛЬНО
class JokeViewModel {
  async getJoke() {
    const response = await fetch('/api/jokes'); // API в ViewModel
    this.jokesModel.setJoke(await response.json());
  }
}

// ПРАВИЛЬНО
class JokeViewModel {
  async getJoke() {
    await this.getJokeUsecase.execute(); // Делегирование
  }
}
\`\`\`

### ❌ Забыли observer

\`\`\`typescript
// НЕПРАВИЛЬНО — компонент не обновится при изменении данных
const MyComponent: FC = () => {
  const vm = useVM<MyViewModel>(DI_TOKENS.VIEW_MODEL);
  return <div>{vm.data}</div>;
};

// ПРАВИЛЬНО
const MyComponent: FC = observer(() => {
  const vm = useVM<MyViewModel>(DI_TOKENS.VIEW_MODEL);
  return <div>{vm.data}</div>;
});
\`\`\`


---

# Use Cases

Use Case инкапсулирует единицу бизнес-логики. Один Use Case — одна операция.

## Структура

\`\`\`
usecases/
├── addTask.usecase.ts
├── removeTask.usecase.ts
├── updateTask.usecase.ts
├── loadTaskList.usecase.ts
├── disposeTaskList.usecase.ts
└── index.ts
\`\`\`

## Базовая структура Use Case

\`\`\`typescript
import { makeAutoObservable } from 'mobx';
import { inject, injectable } from 'inversify';
import { TodoListModel } from '../models/todo_list.model';
import { DI_TOKENS } from '../config/di.tokens';

@injectable()
export class AddTaskUsecase {
  constructor(
    @inject(DI_TOKENS.MODEL_TODO_LIST)
    private todoModel: TodoListModel,
  ) {
    makeAutoObservable(this);
  }

  execute(text: string): void {
    if (!text) return;

    this.todoModel.setItem({
      id: Date.now().toString(),
      description: text,
      completed: false,
      created_at: new Date(),
      updated_at: new Date(),
    });
  }
}
\`\`\`

## Правила Use Case

| Правило                  | Описание                                     |
| ------------------------ | -------------------------------------------- |
| Одна операция            | Один Use Case выполняет одну бизнес-операцию |
| \`@injectable()\`          | Use Case регистрируется в DI                 |
| \`makeAutoObservable\`     | Делает Use Case реактивным (опционально)     |
| Метод \`execute()\`        | Единственная точка входа в Use Case          |
| Работа через Model       | Изменение данных только через методы Model   |
| Валидация входных данных | Проверяйте данные в начале execute()         |

## Типы Use Case

### Синхронный Use Case

Простые операции без асинхронных вызовов:

\`\`\`typescript
@injectable()
export class RemoveTaskUsecase {
  constructor(
    @inject(DI_TOKENS.MODEL_TODO_LIST)
    private todoModel: TodoListModel,
    @inject(IOC_CORE_TOKENS.REPOSITORY_LOCAL_STORAGE)
    private localStorageRepository: LocalStorageRepository,
  ) {
    makeAutoObservable(this);
  }

  execute(id: string): void {
    if (!id) return;

    // 1. Обновляем Model
    this.todoModel.removeItem(id);

    // 2. Синхронизируем с хранилищем
    const todoList = this.localStorageRepository.getKey<string>('todoList');
    const parsedTodoList = todoList ? JSON.parse(todoList) : [];
    const filtered = parsedTodoList.filter((todo) => todo.id !== id);
    this.localStorageRepository.setKey('todoList', JSON.stringify(filtered));
  }
}
\`\`\`

### Асинхронный Use Case

Операции с API запросами:

\`\`\`typescript
import { executeWithAbortHandling } from '@platform/core';

@injectable()
export class GetJokeUsecase {
  private requestIdTracker = { current: 0 };

  constructor(
    @inject(DI_TOKENS.REPOSITORY_JOKE)
    private jokesRepository: JokesRepository,
    @inject(DI_TOKENS.MODEL_JOKE)
    private jokesModel: JokesModel,
    @inject(IOC_CORE_TOKENS.MODEL_APP)
    private appModel: AppModel,
  ) {
    makeAutoObservable(this);
  }

  async execute(): Promise<void> {
    await executeWithAbortHandling({
      // Функция запроса к Repository
      requestFn: async () => {
        const jokes = await this.jokesRepository.getJokes();
        return jokes[0];
      },

      // Получение предыдущих данных для восстановления при отмене
      getPreviousData: () => this.jokesModel.joke,

      // Установка данных в Model
      setData: (joke) => {
        if (joke) {
          this.jokesModel.setJoke(joke);
        }
      },

      // Управление состоянием загрузки
      setLoading: (loading) => {
        this.jokesModel.loading = loading;
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
\`\`\`

### Use Case с возвратом данных

Use Case может возвращать данные (например, для фильтрации):

\`\`\`typescript
@injectable()
export class GetTaskListUsecase {
  constructor(
    @inject(DI_TOKENS.MODEL_TODO_LIST)
    private todoModel: TodoListModel,
  ) {
    makeAutoObservable(this);
  }

  execute(): TodoList[] {
    if (this.todoModel.completeFilter) {
      return this.todoModel.items;
    }
    return this.todoModel.items.filter((item) => !item.completed);
  }
}
\`\`\`

### Dispose Use Case

Use Case для очистки состояния при выходе со страницы:

\`\`\`typescript
@injectable()
export class DisposeTaskListUsecase {
  constructor(
    @inject(DI_TOKENS.MODEL_TODO_LIST)
    private todoModel: TodoListModel,
  ) {
    makeAutoObservable(this);
  }

  execute(): void {
    this.todoModel.dispose();
  }
}
\`\`\`

## Обработка ошибок

### try/catch/finally

Для асинхронных Use Cases без \`executeWithAbortHandling\` используйте \`try/catch/finally\`:

\`\`\`typescript
@injectable()
export class LoadDataUsecase {
  constructor(
    @inject(DI_TOKENS.REPOSITORY)
    private repository: DataRepository,
    @inject(DI_TOKENS.MODEL)
    private model: DataModel,
    @inject(IOC_CORE_TOKENS.MODEL_APP)
    private appModel: AppModel,
  ) {
    makeAutoObservable(this);
  }

  async execute(): Promise<void> {
    // Устанавливаем loading в начале
    this.model.setLoading(true);

    try {
      const data = await this.repository.getData();
      this.model.setData(data);
    } catch (error) {
      // Обрабатываем ошибку
      if (error instanceof Error) {
        this.appModel.notification = error.message;
      }
      // Можно также логировать или пробросить ошибку
      throw error;
    } finally {
      // Сбрасываем loading в любом случае
      this.model.setLoading(false);
    }
  }
}
\`\`\`

### Паттерн с сохранением предыдущих данных

\`\`\`typescript
async execute(): Promise<void> {
  const previousData = this.model.data;
  this.model.setLoading(true);

  try {
    const data = await this.repository.getData();
    this.model.setData(data);
  } catch (error) {
    // Восстанавливаем предыдущие данные при ошибке
    if (previousData) {
      this.model.setData(previousData);
    }

    if (error instanceof Error) {
      this.appModel.notification = error.message;
    }
  } finally {
    this.model.setLoading(false);
  }
}
\`\`\`

### Когда использовать executeWithAbortHandling

| Сценарий                         | Рекомендация               |
| -------------------------------- | -------------------------- |
| Запросы, которые могут дублиться | \`executeWithAbortHandling\` |
| Простой одиночный запрос         | \`try/catch/finally\`        |
| Нужно восстановление данных      | \`executeWithAbortHandling\` |
| Цепочка зависимых запросов       | \`try/catch/finally\`        |

## Вызов Use Case

### Из ViewModel

\`\`\`typescript
@injectable()
export class TodoListViewModel {
  constructor(
    @inject(DI_TOKENS.USECASE_ADD_TASK)
    private addTaskUsecase: AddTaskUsecase,
    @inject(DI_TOKENS.USECASE_REMOVE_TASK)
    private removeTaskUsecase: RemoveTaskUsecase,
  ) {
    makeAutoObservable(this);
  }

  // ViewModel делегирует в Use Case
  setItem(text: string) {
    this.addTaskUsecase.execute(text);
  }

  removeItem(id: string) {
    this.removeTaskUsecase.execute(id);
  }
}
\`\`\`

### Из onEnter роута

\`\`\`typescript
// config/routes.ts
export const routes: IRoutes = [
  {
    name: 'todo',
    path: '/todo',
    pageComponent: lazy(() => import('../view/TodoPage')),
    onEnterNode: async (_toState, _fromState, deps) => {
      const container = deps.di;
      container
        .get<LoadTaskListUsecase>(DI_TOKENS.USECASE_LOAD_TASK_LIST)
        .execute();
    },
    onExitNode: async (_toState, _fromState, deps) => {
      const container = deps.di;
      container
        .get<DisposeTaskListUsecase>(DI_TOKENS.USECASE_DISPOSE_TASK_LIST)
        .execute();
    },
  },
];
\`\`\`

## Регистрация в DI

### Токены

\`\`\`typescript
// config/di.tokens.ts
export enum DI_TOKENS {
  // Models
  MODEL_TODO_LIST = 'TodoListModel',

  // ViewModels
  VIEW_MODEL_TODO_LIST = 'TodoListViewModel',

  // Usecases
  USECASE_ADD_TASK = 'AddTaskUsecase',
  USECASE_REMOVE_TASK = 'RemoveTaskUsecase',
  USECASE_UPDATE_TASK = 'UpdateTaskUsecase',
  USECASE_LOAD_TASK_LIST = 'LoadTaskListUsecase',
  USECASE_DISPOSE_TASK_LIST = 'DisposeTaskListUsecase',
}
\`\`\`

### Конфигурация

\`\`\`typescript
// config/di.config.ts
import { AddTaskUsecase } from '../usecases/addTask.usecase';
import { RemoveTaskUsecase } from '../usecases/removeTask.usecase';
import { LoadTaskListUsecase } from '../usecases/loadTaskList.usecase';
import { DisposeTaskListUsecase } from '../usecases/disposeTaskList.usecase';

export const DI_CONFIG = (container: Container) => {
  // Models — singleton (одно состояние на модуль)
  container
    .bind(DI_TOKENS.MODEL_TODO_LIST)
    .to(TodoListModel)
    .inSingletonScope();

  // ViewModels
  container.bind(DI_TOKENS.VIEW_MODEL_TODO_LIST).to(TodoListViewModel);

  // Usecases
  container.bind(DI_TOKENS.USECASE_ADD_TASK).to(AddTaskUsecase);
  container.bind(DI_TOKENS.USECASE_REMOVE_TASK).to(RemoveTaskUsecase);
  container.bind(DI_TOKENS.USECASE_LOAD_TASK_LIST).to(LoadTaskListUsecase);
  container
    .bind(DI_TOKENS.USECASE_DISPOSE_TASK_LIST)
    .to(DisposeTaskListUsecase);

  return container;
};
\`\`\`

## Экспорт

\`\`\`typescript
// usecases/index.ts
export { AddTaskUsecase } from './addTask.usecase';
export { RemoveTaskUsecase } from './removeTask.usecase';
export { UpdateTaskUsecase } from './updateTask.usecase';
export { LoadTaskListUsecase } from './loadTaskList.usecase';
export { DisposeTaskListUsecase } from './disposeTaskList.usecase';
\`\`\`

## Паттерны именования

| Тип операции | Пример имени             | Описание                  |
| ------------ | ------------------------ | ------------------------- |
| Создание     | \`AddTaskUsecase\`         | Добавление новой сущности |
| Чтение       | \`GetTaskListUsecase\`     | Получение данных          |
| Обновление   | \`UpdateTaskUsecase\`      | Изменение сущности        |
| Удаление     | \`RemoveTaskUsecase\`      | Удаление сущности         |
| Загрузка     | \`LoadTaskListUsecase\`    | Загрузка данных из API    |
| Очистка      | \`DisposeTaskListUsecase\` | Очистка состояния         |

## Типичные ошибки

### ❌ Бизнес-логика в ViewModel

\`\`\`typescript
// НЕПРАВИЛЬНО
class TodoListViewModel {
  addItem(text: string) {
    // Бизнес-логика в ViewModel
    const task = {
      id: Date.now().toString(),
      description: text,
      completed: false,
    };
    this.todoModel.setItem(task);
  }
}

// ПРАВИЛЬНО
class TodoListViewModel {
  addItem(text: string) {
    this.addTaskUsecase.execute(text);
  }
}
\`\`\`

### ❌ Прямые API вызовы в ViewModel

\`\`\`typescript
// НЕПРАВИЛЬНО
class JokeViewModel {
  async getJoke() {
    const response = await fetch('/api/jokes');
    this.jokesModel.setJoke(await response.json());
  }
}

// ПРАВИЛЬНО
class JokeViewModel {
  async getJoke() {
    await this.getJokeUsecase.execute();
  }
}
\`\`\`

### ❌ Use Case без валидации

\`\`\`typescript
// НЕПРАВИЛЬНО
execute(id: string): void {
  this.todoModel.removeItem(id); // Может быть пустой id
}

// ПРАВИЛЬНО
execute(id: string): void {
  if (!id) return;
  this.todoModel.removeItem(id);
}
\`\`\`

`;

/**
 * Страница документации: Модули.
 *
 * @component
 */
const ModulesPage: FC = () => {
  const { t } = useTranslation('doc-platform');

  return (
    <Container maxWidth={false} sx={{ padding: 0 }}>
      <Typography variant="h4" gutterBottom>
        {t('menu.modules')}
      </Typography>

      <Paper sx={(theme) => ({ width: '100%', p: theme.spacing(6) })}>
        <MarkdownRenderer content={pageMarkdown} />
      </Paper>
    </Container>
  );
};

export default ModulesPage;
