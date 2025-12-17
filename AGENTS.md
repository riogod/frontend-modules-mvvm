# Project Agents Configuration - Modular Frontend Platform (MFP)

## Overview

**Цель**: Генерировать код, который строго следует архитектуре MVVM, принципам чистой архитектуры и правилам платформы MFP.

**Технологический стек**: React 19, TypeScript, MobX, Inversify, Vite, Module Federation, Material-UI, i18next, Zod, Axios

**Архитектура**: Модульная платформа с изолированными модулями, взаимодействующими через DI контейнер. Подробнее: `@docs/architecture.md`

## Project Structure

### Корневая структура

```
frontend-modules-mvvm/
├── host/                   # Хост-приложение (bootstrap, локальные модули)
├── libs/                   # Библиотеки платформы
│   ├── core/              # APIClient, Logger, Router, IOC_CORE_TOKENS
│   ├── common/            # AccessControlModel, Use Cases для permissions/features
│   ├── ui/                # React компоненты, useVM, ThemeProvider
│   └── share/             # Общие ресурсы для шаринга
├── packages/               # MFE-модули (api_example, todo, app-test)
├── config/                 # Конфигурации инструментов
│   ├── vite-config/        # Фабрика конфигураций Vite
│   ├── eslint-config/      # Фабрика конфигураций ESLint
│   └── dev-server/         # Dev-сервер для API-проксирования
├── scripts/                # Утилиты сборки и разработки
│   ├── dev-runner.mjs      # CLI-лаунчер разработки
│   └── launcher/           # CLI-лаунчер модулей
├── docs/                   # Документация
├── dist/                   # Артефакты сборки
├── package.json            # Корневой package.json (npm workspaces)
└── tsconfig.base.json      # Базовая конфигурация TypeScript
```

### host/ — Хост-приложение

```
host/
├── src/
│   ├── bootstrap/          # Система инициализации
│   │   ├── handlers/       # Обработчики инициализации (APIClient, DI, Router, etc.)
│   │   └── services/       # Сервисы платформы
│   │       ├── appStart/   # Загрузка стартовых данных
│   │       ├── moduleLoader/  # Загрузчик модулей
│   │       └── router/     # Сервис роутинга
│   ├── config/             # Конфигурация приложения
│   ├── modules/            # Локальные модули (INIT)
│   │   ├── core/           # Базовый модуль
│   │   └── core.layout/   # Модуль макета
│   ├── mocks/              # Моки для разработки
│   └── main.tsx            # Точка входа React
├── index.html
├── vite.config.mts
└── tsconfig.json
```

### libs/ — Библиотеки платформы

```
libs/
├── core/src/
│   ├── APIClient/          # HTTP-клиент на базе axios
│   ├── Logger/             # Система логирования
│   ├── ModuleInterfaces/   # Интерфейсы модулей
│   ├── Router/             # Типы роутинга
│   └── index.ts            # Экспорт + IOC_CORE_TOKENS
├── common/src/
│   ├── models/
│   │   └── access_control/  # Модель контроля доступа
│   └── usecases/
│       ├── featureFlag/     # Работа с feature flags
│       └── permission/       # Работа с разрешениями
├── ui/src/
│   ├── components/         # UI-компоненты
│   ├── hooks/
│   │   ├── useVM.ts        # Получение ViewModel из DI
│   │   └── useSharedComponent/  # Хук для shared компонентов
│   ├── providers/
│   │   └── DIProvider.tsx  # React-провайдер для DI
│   └── theme/              # Темы MUI
└── share/src/
    └── ThemeSchema/         # Обертка для темы
```

### packages/ — Бизнес-модули (MFE)

```
packages/
├── todo/                   # Пример модуля Todo
├── api_example/            # Пример работы с API
└── app-test/               # Тестовый модуль
```

### Алиасы путей

| Алиас              | Путь              |
| ------------------ | ----------------- |
| `@platform/core`   | `libs/core/src`   |
| `@platform/common` | `libs/common/src` |
| `@platform/ui`     | `libs/ui/src`     |
| `@platform/share`  | `libs/share/src`  |

**Подробнее**: `@docs/project-structure.md`

## Global Rules for AI Agents

### 1. Project Context

- **Монорепозиторий** с npm workspaces
- **Module Federation** для распределенной разработки
- **MVVM паттерн** в каждом модуле
- **Dependency Injection** через Inversify для всех зависимостей
- **Реактивность** через MobX

### 2. Core Principles

- ✅ Все модули изолированы и взаимодействуют только через DI контейнер
- ✅ Четкое разделение слоев: Model → ViewModel → View → Use Cases → Repository
- ✅ Бизнес-логика только в Use Cases, данные только в Model
- ✅ ViewModel НЕ хранит данные, только прокси к Model
- ❌ Прямой импорт реализаций между модулями ЗАПРЕЩЕН

### 3. Design Before Implementation - КРИТИЧЕСКИ ВАЖНО

**Перед написанием кода всегда:**

1. **Анализ и планирование**
   - Проанализируйте требования и контекст задачи
   - Определите, какие компоненты/слои будут затронуты
   - Продумайте взаимодействие между компонентами
   - Учтите существующие паттерны и архитектуру платформы

2. **Выбор архитектурных паттернов**
   - Используйте **MVVM паттерн** для структуры модуля
   - Применяйте **Repository паттерн** для работы с данными
   - Используйте **Dependency Injection** для управления зависимостями
   - Рассмотрите **Strategy**, **Factory**, **Observer** где уместно
   - Избегайте антипаттернов (God Object, Spaghetti Code, Tight Coupling)

   **Паттерны проектирования по категориям:**

   **Порождающие паттерны** (гибкое создание объектов без лишних зависимостей):
   - **Factory** — создание объектов через фабричные методы (Use Cases, Repositories)
   - **Builder** — пошаговое создание сложных объектов (конфигурации, запросы)
   - **Singleton** — единственный экземпляр (Model в DI как singleton)
   - **Dependency Injection** — внедрение зависимостей через конструктор

   **Структурные паттерны** (построение связей между объектами):
   - **Adapter** — адаптация интерфейсов (DTO → Entity маппинг)
   - **Facade** — упрощенный интерфейс к сложной подсистеме (APIClient)
   - **Proxy** — прокси-объект для контроля доступа (ViewModel как прокси к Model)
   - **Decorator** — добавление функциональности без изменения структуры

   **Поведенческие паттерны** (эффективная коммуникация между объектами):
   - **Observer** — уведомление об изменениях (MobX реактивность)
   - **Strategy** — выбор алгоритма во время выполнения (разные стратегии валидации)
   - **Command** — инкапсуляция запросов (Use Cases как команды)
   - **Template Method** — определение скелета алгоритма (базовые Use Cases)

3. **Применение SOLID принципов**
   - **S**ingle Responsibility: каждый класс/функция решает одну задачу
   - **O**pen/Closed: открыт для расширения, закрыт для модификации
   - **L**iskov Substitution: подтипы должны заменять базовые типы
   - **I**nterface Segregation: много специфичных интерфейсов лучше одного общего
   - **D**ependency Inversion: зависеть от абстракций, а не от конкретных реализаций

4. **Оптимизация алгоритмов**
   - Выбирайте оптимальные структуры данных (Map вместо Array для поиска, Set для уникальности)
   - Используйте эффективные алгоритмы (O(n log n) вместо O(n²) где возможно)
   - Избегайте преждевременной оптимизации, но учитывайте сложность операций
   - Кэшируйте вычисления через MobX computed свойства
   - Используйте мемоизацию для тяжелых вычислений

5. **Примеры правильного подхода**

```typescript
// ✅ ПРАВИЛЬНО: Продуманная архитектура
// 1. Анализ: нужен Use Case для загрузки списка задач
// 2. Паттерн: Use Case + Repository
// 3. SOLID: Single Responsibility (только загрузка), Dependency Inversion (через DI)
// 4. Алгоритм: O(n) для маппинга, оптимально

@injectable()
export class LoadTaskListUsecase {
  constructor(
    @inject(TODO_DI_TOKENS.MODEL_TODO_LIST)
    private todoModel: TodoListModel,
    @inject(TODO_DI_TOKENS.REPOSITORY_TODO)
    private todoRepository: TodoRepository,
  ) {}

  async execute(): Promise<void> {
    const todos = await this.todoRepository.getTodos();
    // ✅ Эффективный маппинг O(n)
    todos.forEach((todo) => {
      this.todoModel.setItem(todo);
    });
  }
}

// ❌ НЕПРАВИЛЬНО: Без планирования
// - Нарушение SRP (много ответственностей)
// - Прямые зависимости
// - Неоптимальный алгоритм O(n²)
@injectable()
export class BadUsecase {
  async loadAndFilterAndSort(): Promise<void> {
    const response = await fetch('/api/todos');
    const data = await response.json();
    // ❌ O(n²) - вложенные циклы
    const filtered = data.filter((item) => {
      return data.some((other) => other.id === item.parentId);
    });
    // ❌ Нарушение SRP - сортировка должна быть отдельно
    filtered.sort((a, b) => a.date - b.date);
    this.model.setItems(filtered);
  }
}
```

**Правило**: Всегда думайте перед кодом. Плохо спроектированное решение сложнее исправить, чем написать правильно с первого раза.

### 3.1. Code Readability and Structure - КРИТИЧЕСКИ ВАЖНО

**Код должен быть структурирован и легко читаться:**

1. **Структура кода**
   - Разделяйте код на логические блоки с пустыми строками
   - Группируйте связанные функции и методы вместе
   - Используйте осмысленные имена переменных и функций
   - Избегайте глубокой вложенности (максимум 3-4 уровня)
   - Выносите сложную логику в отдельные функции/методы

2. **Читаемость**
   - Код должен быть самодокументируемым через имена
   - Используйте константы вместо магических чисел/строк
   - Разбивайте длинные функции на более мелкие (Single Responsibility)
   - Используйте ранний возврат (early return) для уменьшения вложенности
   - Комментируйте "почему", а не "что" (код должен говорить сам за себя)

3. **Примеры**

```typescript
// ✅ ПРАВИЛЬНО: Структурированный и читаемый код
@injectable()
export class TodoListViewModel {
  constructor(
    @inject(TODO_DI_TOKENS.MODEL_TODO_LIST)
    private todoModel: TodoListModel,
    @inject(TODO_DI_TOKENS.USECASE_ADD_TASK)
    private addTaskUsecase: AddTaskUsecase,
    @inject(TODO_DI_TOKENS.USECASE_DELETE_TASK)
    private deleteTaskUsecase: DeleteTaskUsecase,
  ) {
    makeAutoObservable(this);
  }

  // Группировка: геттеры
  get items() {
    return this.todoModel.items;
  }

  get completedCount() {
    return this.todoModel.items.filter((item) => item.completed).length;
  }

  // Группировка: методы действий
  addItem(text: string): void {
    if (!this.isValidText(text)) {
      return; // Early return
    }
    this.addTaskUsecase.execute(text);
  }

  deleteItem(id: string): void {
    this.deleteTaskUsecase.execute(id);
  }

  // Группировка: приватные вспомогательные методы
  private isValidText(text: string): boolean {
    return text.trim().length > 0;
  }
}

// ❌ НЕПРАВИЛЬНО: Плохо структурированный код
@injectable()
export class BadViewModel {
  constructor(
    @inject('Model') private m: Model,
    @inject('Usecase') private u: Usecase,
  ) {
    makeAutoObservable(this);
  }
  get items() {
    return this.m.items;
  }
  add(text: string) {
    if (text && text.trim() && text.trim().length > 0) {
      // ❌ Глубокая вложенность
      if (this.m.items.length < 100) {
        // ❌ Магическое число
        this.u.execute(text);
      }
    }
  }
}
```

**Правило**: Код пишется один раз, но читается множество раз. Приоритет читаемости над краткостью.

### 4. File Structure

```
module-name/src/
├── config/
│   ├── module_config.ts    # Главная конфигурация
│   ├── routes.ts           # Маршруты с lazy()
│   ├── di.config.ts        # Регистрация в DI
│   ├── di.tokens.ts        # Токены DI
│   ├── endpoints.ts        # API эндпоинты
│   └── i18n/               # Переводы
├── models/                 # Model (только состояние)
├── viewmodels/             # ViewModel (прокси к Model)
├── usecases/               # Use Cases (бизнес-логика)
├── view/                   # React компоненты
│   ├── pages/
│   └── components/
└── data/                   # Repository, DTO, валидация
    ├── entity.repository.ts
    ├── entity.dto.ts
    └── validation/
```

**Подробнее**: `@docs/modules/mvvm-pattern.md`, `@docs/project-structure.md`

### 5. Naming Conventions

- React компоненты: `PascalCase` → `TodoPage.tsx`
- Модели: `snake_case` → `todo_list.model.ts`
- ViewModels: `snake_case` → `todo_list.vm.ts`
- Use Cases: `camelCase` → `getTaskList.usecase.ts`
- Конфигурация: `snake_case` → `module_config.ts`
- Тесты: `*.test.ts` → `TodoModel.test.ts`
- Переводы: `lang_module.json` → `en_todo.json`

### 6. Error Handling

- Используйте `executeWithAbortHandling` для асинхронных Use Cases с запросами
- Всегда валидируйте входные данные в Use Cases
- Логируйте ошибки через `log.error()` с префиксом: `{ prefix: 'module.usecase' }`
- Никогда не глотайте исключения молча

### 7. Testing Requirements

- Пишите тесты рядом с кодом
- Используйте `*.test.ts` для тестов
- Тестируйте поведение, а не реализацию

## MVVM Pattern Rules

### Model - Только состояние

```typescript
// ✅ ПРАВИЛЬНО
@injectable()
export class TodoListModel {
  private _todos: Todo[] = [];
  private _loading = false;

  constructor() {
    makeAutoObservable(this, {
      items: true, // computed
      setItem: action,
    });
  }

  get items(): Todo[] {
    return this._todos;
  }

  setItem(item: Todo): void {
    this._todos.push(item);
  }
}

// ❌ НЕПРАВИЛЬНО: Бизнес-логика в Model
@injectable()
export class TodoListModel {
  setItem(text: string): void {
    // ❌ Создание объекта с бизнес-логикой
    const item = {
      id: Date.now().toString(),
      description: text,
      completed: false,
    };
    this._todos.push(item);
  }
}
```

**Правило**: Model хранит только состояние. Создание объектов с бизнес-логикой должно быть в Use Case.

**Подробнее**: `@docs/modules/mvvm-pattern.md`

### ViewModel - Прокси к Model

```typescript
// ✅ ПРАВИЛЬНО
@injectable()
export class TodoListViewModel {
  constructor(
    @inject(TODO_DI_TOKENS.MODEL_TODO_LIST)
    private todoModel: TodoListModel,
    @inject(TODO_DI_TOKENS.USECASE_ADD_TASK)
    private addTaskUsecase: AddTaskUsecase,
  ) {
    makeAutoObservable(this);
  }

  // ✅ Геттеры — прокси к Model
  get items() {
    return this.todoModel.items;
  }

  // ✅ Методы делегируют в Use Cases
  addItem(text: string): void {
    this.addTaskUsecase.execute(text);
  }
}

// ❌ НЕПРАВИЛЬНО: Хранение данных или бизнес-логики
@injectable()
export class TodoListViewModel {
  private _items: Todo[] = []; // ❌ Данные должны быть в Model
  async loadData(): Promise<void> {
    // ❌ API запросы должны быть в Repository через Use Case
    const response = await fetch('/api/todos');
    this.todoModel.setItems(await response.json());
  }
}
```

**Правило**: ViewModel НЕ хранит данные и НЕ содержит бизнес-логику. Только прокси к Model и делегирование в Use Cases.

### View - React компоненты

```typescript
// ✅ ПРАВИЛЬНО
import { type FC } from 'react';
import { observer } from 'mobx-react-lite';
import { useVM } from '@platform/ui';
import type { TodoListViewModel } from '../viewmodels/todo_list.vm';
import { TODO_DI_TOKENS } from '../config/di.tokens';

const TodoPage: FC = observer(() => {
  const viewModel = useVM<TodoListViewModel>(TODO_DI_TOKENS.VIEW_MODEL_TODO_LIST);

  return (
    <div>
      {viewModel.items.map((item) => (
        <div key={item.id}>{item.description}</div>
      ))}
    </div>
  );
});

// ❌ НЕПРАВИЛЬНО
const TodoPage: FC = () => {
  // ❌ Без observer — компонент не обновится
  const viewModel = useVM<TodoListViewModel>(TODO_DI_TOKENS.VIEW_MODEL_TODO_LIST);
  return <div>{viewModel.items}</div>;
};
```

**Правило**: Всегда используйте `observer()` и вызывайте Use Cases только через ViewModel.

### Use Cases - Бизнес-логика

```typescript
// ✅ ПРАВИЛЬНО
@injectable()
export class AddTaskUsecase {
  private requestIdTracker = { current: 0 };

  constructor(
    @inject(TODO_DI_TOKENS.MODEL_TODO_LIST)
    private todoModel: TodoListModel,
    @inject(TODO_DI_TOKENS.REPOSITORY_TODO)
    private todoRepository: TodoRepository,
  ) {}

  async execute(text: string): Promise<void> {
    // ✅ Валидация входных данных
    if (!text || text.trim().length === 0) {
      return;
    }

    // ✅ Использование executeWithAbortHandling для запросов
    await executeWithAbortHandling({
      requestFn: async () => {
        return await this.todoRepository.createTask({ description: text });
      },
      getPreviousData: () => this.todoModel.items,
      setData: (task) => {
        if (task) {
          this.todoModel.setItem(task);
        }
      },
      setLoading: (loading) => {
        this.todoModel.setLoading(loading);
      },
      onError: (error) => {
        if (error instanceof Error) {
          log.error('Failed to add task', { prefix: 'todo.usecase' }, error);
        }
      },
      requestIdTracker: this.requestIdTracker,
    });
  }
}
```

**Правило**: Один Use Case = одна операция, метод `execute()` — единственная точка входа, всегда валидируйте входные данные.

**Подробнее**: `@docs/modules/usecases.md`, `@docs/libs/core.md`

### Repository - Работа с данными

```typescript
// ✅ ПРАВИЛЬНО
@injectable()
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
        response: todoResponseSchema, // ✅ Zod валидация
      },
      useAbortController: true, // ✅ Автоматическая отмена дублей
    });

    // ✅ Маппинг DTO в Entity
    return response.map(mapTodoDTOToEntity);
  }
}

// ❌ НЕПРАВИЛЬНО
@injectable()
export class TodoRepository {
  async getTodos(): Promise<Todo[]> {
    // ❌ Прямой fetch вместо APIClient
    const response = await fetch('/api/todos');
    return await response.json(); // ❌ Нет валидации и маппинга
  }
}
```

**Правило**: Всегда используйте `APIClient`, валидируйте через Zod схемы, маппите DTO в Entity.

**Подробнее**: `@docs/modules/data-layer.md`, `@docs/libs/core.md`

## Dependency Injection

### Токены

```typescript
// ✅ Токены в di.tokens.ts
export enum TODO_DI_TOKENS {
  MODEL_TODO_LIST = 'TodoListModel',
  VIEW_MODEL_TODO_LIST = 'TodoListViewModel',
  USECASE_ADD_TASK = 'AddTaskUsecase',
  REPOSITORY_TODO = 'TodoRepository',
}

// ✅ Платформенные токены из @platform/core
import { IOC_CORE_TOKENS } from '@platform/core';
// IOC_CORE_TOKENS.APIClient
// IOC_CORE_TOKENS.MODEL_APP
// IOC_CORE_TOKENS.USECASE_GET_FEATURE_FLAG
```

### Регистрация

```typescript
// ✅ Регистрация в di.config.ts
export const DI_CONFIG = (container: Container): Container => {
  // ✅ Model как singleton
  container
    .bind(TODO_DI_TOKENS.MODEL_TODO_LIST)
    .to(TodoListModel)
    .inSingletonScope();

  // ✅ ViewModel и Use Cases без scope
  container.bind(TODO_DI_TOKENS.VIEW_MODEL_TODO_LIST).to(TodoListViewModel);
  container.bind(TODO_DI_TOKENS.USECASE_ADD_TASK).to(AddTaskUsecase);
  container.bind(TODO_DI_TOKENS.REPOSITORY_TODO).to(TodoRepository);

  return container;
};
```

## Inter-Module Communication - КРИТИЧЕСКИ ВАЖНО

### ✅ РАЗРЕШЕНО

```typescript
// ✅ Импорт типов из других модулей
import type { CatalogModel } from '@packages/catalog/models/catalog.model';

// ✅ Импорт всего из библиотек
import { IOC_CORE_TOKENS, APIClient } from '@platform/core';
import { useVM, ThemeProvider } from '@platform/ui';
```

### ❌ ЗАПРЕЩЕНО

```typescript
// ❌ Импорт класса из другого модуля
import { CatalogModel } from '@packages/catalog/models/catalog.model';

// ❌ Импорт токенов из другого модуля
import { CATALOG_DI_TOKENS } from '@packages/catalog/config/di.tokens';

// ❌ Импорт enum из другого модуля
import { CatalogStatus } from '@packages/catalog/models/catalog.enum';
```

### ✅ ПРАВИЛЬНО: Взаимодействие через DI

```typescript
// ✅ Описываем токен в своем модуле
export const EXTERNAL_TOKENS = {
  CATALOG_MODEL: 'CatalogModel', // Значение должно совпадать с регистрацией
} as const;

// ✅ Используем через DI
@injectable()
export class OrdersUsecase {
  constructor(
    @inject(EXTERNAL_TOKENS.CATALOG_MODEL)
    private catalogModel: CatalogModel, // Тип импортирован через type
  ) {}
}

// ✅ Указываем зависимость в module_config.ts
export default {
  mockModuleInfo: {
    name: 'orders',
    dependencies: ['catalog'], // Гарантирует загрузку catalog до orders
  },
} as ModuleConfig;
```

**КРИТИЧЕСКОЕ ПРАВИЛО**: Всё взаимодействие между модулями ТОЛЬКО через DI контейнер. Прямой импорт реализаций категорически запрещен.

**Подробнее**: `@docs/modules/inter-module-communication.md`

## Module Configuration

### module_config.ts

```typescript
import { type ModuleConfig } from '@platform/core';
import { routes } from './routes';
import { DI_CONFIG } from './di.config';
import { handlers } from './mocks';
import en from './i18n/en_my-module.json';
import ru from './i18n/ru_my-module.json';

export default {
  // ✅ Маршруты модуля (обязательно функция)
  ROUTES: () => routes,

  // ✅ Инициализация модуля
  onModuleInit: (bootstrap) => {
    DI_CONFIG(bootstrap.di);
  },

  // ✅ Регистрация переводов
  I18N: (i18n) => {
    i18n.addResourceBundle('en', 'my-module', en);
    i18n.addResourceBundle('ru', 'my-module', ru);
  },

  // ✅ MSW handlers для моков (опционально)
  mockHandlers: handlers,

  // ✅ Информация о модуле (обязательно для MFE модулей)
  mockModuleInfo: {
    name: 'my-module',
    loadType: 'normal', // 'init' | 'normal'
    loadPriority: 10,
    dependencies: ['auth'],
    featureFlags: ['my-module.enabled'],
    accessPermissions: ['my-module.access'],
  },

  // ✅ Мок-данные для DEV режима (опционально)
  mockModuleData: {
    features: { 'my-module.enabled': true },
    permissions: { 'my-module.access': true },
    params: { 'my-module.api-url': 'https://api.example.com' },
  },
} as ModuleConfig;
```

**Важные детали**:

- **ROUTES**: Всегда функция `() => routes`, не просто `routes`
- **I18N**: Namespace должен совпадать с именем модуля
- **mockModuleInfo**: Обязателен для MFE модулей, не нужен для Local модулей

**Подробнее**: `@docs/modules/module-config.md`, `@docs/modules/module-types.md`

## Module Types

### INIT vs NORMAL

**INIT модули:**

- Загружаются **до рендера UI**, синхронно
- Не поддерживают `loadCondition`
- Загружаются последовательно по `loadPriority`
- Примеры: `core`, `layout`, `auth`

**NORMAL модули:**

- Загружаются **после рендера UI**, асинхронно
- Поддерживают `loadCondition` (dependencies, featureFlags, permissions)
- Загружаются параллельно по уровням зависимостей
- Примеры: `todo`, `dashboard`, `settings`

### Local vs MFE

**Local модули:**

- Расположение: `host/src/modules/module-name/`
- Регистрируются вручную в `host/src/modules/modules.ts`
- Собираются вместе с хостом

**MFE модули:**

- Расположение: `packages/module-name/`
- Регистрируются автоматически (Launcher в DEV, манифест в PROD)
- Собираются отдельно, независимый деплой

**Подробнее**: `@docs/modules/module-types.md`, `@docs/modules/creating-module.md`

## Routing

```typescript
import { type IRoutes } from '@platform/core';
import { lazy } from 'react';

export const routes: IRoutes = [
  {
    name: 'todo',
    path: '/todo',
    pageComponent: lazy(() => import('../view/pages/TodoPage')), // ✅ lazy()
    menu: { text: 'todo:menu.title' },
    browserTitle: 'Todo List',
    // ✅ Загрузка данных при входе
    onEnterNode: async (_toState, _fromState, deps) => {
      const container = deps.di;
      container
        .get<LoadTaskListUsecase>(TODO_DI_TOKENS.USECASE_LOAD_TASK_LIST)
        .execute();
    },
    // ✅ Очистка при выходе
    onExitNode: async (_toState, _fromState, deps) => {
      const container = deps.di;
      container
        .get<DisposeTaskListUsecase>(TODO_DI_TOKENS.USECASE_DISPOSE_TASK_LIST)
        .execute();
    },
  },
];
```

## Feature Flags и Permissions

```typescript
@injectable()
export class DashboardViewModel {
  constructor(
    @inject(IOC_CORE_TOKENS.USECASE_GET_FEATURE_FLAG)
    private getFeatureFlagUsecase: GetFeatureFlagUsecase,
    @inject(IOC_CORE_TOKENS.USECASE_GET_PERMISSION)
    private getPermissionUsecase: GetPermissionUsecase,
  ) {
    makeAutoObservable(this);
  }

  // ✅ Реактивные геттеры для проверки
  get isNewWidgetsEnabled(): boolean {
    return this.getFeatureFlagUsecase.execute('dashboard.widgets.v2');
  }

  get canCreateUser(): boolean {
    return this.getPermissionUsecase.execute('user.create');
  }
}
```

**Подробнее**: `@docs/mechanics/feature-toggles.md`, `@docs/mechanics/permissions.md`, `@docs/libs/common.md`

## Server Parameters

```typescript
@injectable()
export class MyViewModel {
  constructor(
    @inject(IOC_CORE_TOKENS.USECASE_GET_PARAM)
    private getParamUsecase: GetParamUsecase,
  ) {
    makeAutoObservable(this);
  }

  // ✅ Типизированное получение параметра
  get apiUrl(): string {
    return this.getParamUsecase.execute<string>('my-module.api-url') || '';
  }
}
```

**Подробнее**: `@docs/mechanics/server-parameters.md`, `@docs/libs/common.md`

## Validation with Zod

```typescript
// data/validation/todo.response.schema.ts
import z from 'zod';

const todoSchema = z.object({
  id: z.string(),
  description: z.string().min(1),
  completed: z.boolean(),
  created_at: z.string().datetime(),
});

export const todoResponseSchema = z.array(todoSchema).min(0).max(100);
```

**Использование в Repository**:

```typescript
const response = await this.apiClient.request<null, TodoResponseDTO[]>({
  route: EEndpoints.TODOS,
  method: HttpMethod.GET,
  validationSchema: {
    response: todoResponseSchema, // ✅ Валидация ответа
  },
  useAbortController: true,
});
```

## Logging

```typescript
import { log } from '@platform/core';

// ✅ С префиксом для фильтрации
log.info('Task added', { prefix: 'todo.usecase' });
log.error('Failed to load tasks', { prefix: 'todo.repository' }, error);
log.debug('Processing item', { prefix: 'todo.model' }, { id: 123 });
```

**Подробнее**: `@docs/libs/core.md`

## Development Tools Configuration

### Vite

```typescript
// vite.config.mts
import { defineConfig } from 'vite';
import { createViteConfig } from '@platform/vite-config';

export default defineConfig(
  createViteConfig({
    type: 'module', // 'host' | 'lib' | 'module'
    dirname: __dirname,
    localConfigPath: './vite.config.local.mts', // Опционально
  }),
);
```

### ESLint

```javascript
// .eslintrc.js
const { createEslintConfig } = require('@platform/eslint-config');

module.exports = createEslintConfig({
  type: 'module', // 'host' | 'lib' | 'module'
  tsconfigPath: './tsconfig.base.json',
  localConfigPath: './.eslintrc.local.js', // Опционально
});
```

**Подробнее**: `@config/vite-config/README.md`, `@config/eslint-config/README.md`

## Code Style Guidelines

### TypeScript

- Используйте TypeScript строго (избегайте `any`)
- Используйте `import type` для импорта типов
- Используйте enum для констант (feature flags, permissions)
- Всегда типизируйте параметры и возвращаемые значения

### JSDoc Documentation

**Всегда документируйте публичные API с помощью JSDoc:**

1. **Обязательные JSDoc комментарии для:**
   - Публичные классы и интерфейсы
   - Публичные методы и функции
   - Сложные алгоритмы и бизнес-логика
   - Use Cases (описание бизнес-операции)
   - Repository методы (описание источника данных)

2. **Формат JSDoc:**

````typescript
/**
 * Загружает список задач из репозитория и обновляет модель.
 *
 * @description Use Case для загрузки всех задач пользователя.
 * Выполняет запрос к API через Repository, валидирует ответ
 * и обновляет состояние в Model.
 *
 * @throws {Error} Если запрос к API завершился ошибкой
 *
 * @example
 * ```typescript
 * const usecase = container.get<LoadTaskListUsecase>(TODO_DI_TOKENS.USECASE_LOAD_TASK_LIST);
 * await usecase.execute();
 * ```
 */
@injectable()
export class LoadTaskListUsecase {
  /**
   * Создает экземпляр Use Case для загрузки списка задач.
   *
   * @param todoModel - Модель для хранения состояния задач
   * @param todoRepository - Репозиторий для получения данных из API
   */
  constructor(
    @inject(TODO_DI_TOKENS.MODEL_TODO_LIST)
    private todoModel: TodoListModel,
    @inject(TODO_DI_TOKENS.REPOSITORY_TODO)
    private todoRepository: TodoRepository,
  ) {}

  /**
   * Выполняет загрузку списка задач.
   *
   * @returns Promise, который разрешается после обновления модели
   */
  async execute(): Promise<void> {
    const todos = await this.todoRepository.getTodos();
    todos.forEach((todo) => {
      this.todoModel.setItem(todo);
    });
  }
}
````

3. **JSDoc теги:**

```typescript
/**
 * @param {Type} paramName - Описание параметра
 * @returns {Type} Описание возвращаемого значения
 * @throws {ErrorType} Когда выбрасывается исключение
 * @example Пример использования
 * @description Подробное описание функциональности
 * @since Версия, когда был добавлен
 * @deprecated Если устарел, укажите альтернативу
 */
```

4. **Примеры для разных типов кода:**

````typescript
// ✅ Use Case
/**
 * Создает новую задачу и добавляет её в модель.
 *
 * @param text - Текст задачи (должен быть непустым)
 * @throws {ValidationError} Если текст пустой или слишком длинный
 */
async execute(text: string): Promise<void> { }

// ✅ Repository метод
/**
 * Получает список всех задач пользователя из API.
 *
 * @returns Promise с массивом задач
 * @throws {APIError} Если запрос к серверу завершился ошибкой
 */
async getTodos(): Promise<Todo[]> { }

// ✅ ViewModel метод
/**
 * Добавляет новую задачу через Use Case.
 *
 * @param text - Текст задачи для добавления
 */
addItem(text: string): void { }

// ✅ React компонент
/**
 * Страница со списком задач.
 *
 * @component
 * @example
 * ```tsx
 * <TodoPage />
 * ```
 */
const TodoPage: FC = observer(() => { });
````

**Правило**: Хорошая документация экономит время при поддержке и онбординге новых разработчиков.

### React

- Всегда используйте `observer()` из `mobx-react-lite` для компонентов
- Используйте `useVM<T>(TOKEN)` для получения ViewModel
- Используйте `lazy()` для всех компонентов страниц
- Используйте компоненты из `@platform/ui`, не напрямую из `@mui/material`

### MobX

- Используйте `makeAutoObservable` для моделей и ViewModels
- Геттеры автоматически становятся computed
- Методы изменения состояния должны быть помечены как `action`

### Error Handling

- Используйте `executeWithAbortHandling` для асинхронных Use Cases с запросами
- Всегда валидируйте входные данные в Use Cases
- Логируйте ошибки через `log.error()` с префиксом
- Никогда не глотайте исключения молча

## Context Management

### Reference Patterns

Используйте ссылки на документацию в промптах:

```
@docs/architecture.md              # Архитектура платформы
@docs/modules/mvvm-pattern.md      # MVVM паттерн
@docs/modules/creating-module.md   # Создание модулей
@docs/modules/usecases.md          # Use Cases
@docs/modules/data-layer.md        # Работа с данными
@docs/modules/inter-module-communication.md  # Межмодульное взаимодействие
@docs/modules/module-config.md     # Конфигурация модуля
@docs/modules/module-types.md      # Типы модулей
@docs/bootstrap/module-loader.md   # Загрузчик модулей
@docs/libs/core.md                 # Core библиотека
@docs/libs/common.md               # Common библиотека
@docs/libs/ui.md                   # UI библиотека
@docs/project-structure.md         # Структура проекта
@config/vite-config/README.md      # Vite конфигурация
@config/eslint-config/README.md    # ESLint конфигурация
```

### Effective Prompts

❌ **Плохо**: "Clean up this code"
✅ **Хорошо**: "Using @docs/modules/mvvm-pattern.md, refactor UserService to extract authentication logic into a Use Case and add comprehensive tests"

❌ **Плохо**: "Make it better"
✅ **Хорошо**: "Following @docs/modules/inter-module-communication.md, refactor the code to use DI instead of direct imports between modules"

❌ **Плохо**: "Add validation"
✅ **Хорошо**: "Using @docs/modules/data-layer.md, add Zod validation schema for the API response in TodoRepository"

## Verification Checklist

Перед завершением работы проверьте:

### Architecture

- [ ] Структура модуля соответствует MVVM паттерну
- [ ] Именование файлов соответствует соглашениям
- [ ] Все React компоненты обернуты в `observer()`
- [ ] View использует `useVM<T>(TOKEN)` для получения ViewModel
- [ ] Бизнес-логика только в Use Cases
- [ ] Данные только в Model, ViewModel только прокси
- [ ] Все API запросы через Repository

### Dependency Injection

- [ ] Все компоненты зарегистрированы в `di.config.ts`
- [ ] Все токены определены в `di.tokens.ts`
- [ ] Все зависимости инжектируются через `@inject(TOKEN)`
- [ ] Model как singleton, ViewModel и Use Cases без scope

### Module Configuration

- [ ] `module_config.ts` содержит все обязательные поля
- [ ] `ROUTES` — функция `() => routes`
- [ ] `onModuleInit` регистрирует DI через `DI_CONFIG(bootstrap.di)`
- [ ] `I18N` зарегистрирован с правильным namespace
- [ ] `mockModuleInfo` для MFE модулей, не нужен для Local

### Inter-Module Communication

- [ ] Нет прямых импортов реализаций между модулями
- [ ] Импорт типов разрешен через `import type`
- [ ] Внешние токены описаны в своем модуле
- [ ] Используются правильные алиасы (`@platform/core`, `@platform/ui`)

### Data & Validation

- [ ] Все запросы/ответы валидируются через Zod схемы
- [ ] DTO маппятся в Entity в Repository
- [ ] Эндпоинты хранятся в `endpoints.ts` как enum
- [ ] Используется `executeWithAbortHandling` для асинхронных Use Cases

## Additional Recommendations

### Performance

- Используйте `lazy()` для всех компонентов страниц
- Включайте `useAbortController: true` для автоматической отмены дублей запросов

### Security

- Всегда проверяйте permissions на бэкенде (не только на фронтенде)
- Валидируйте все данные через Zod схемы

### Code Maintainability

- Следуйте единой структуре во всех модулях
- Используйте осмысленные имена
- Комментируйте сложную логику
- Документируйте публичные API
