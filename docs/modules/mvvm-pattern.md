# MVVM паттерн

MVVM (Model-View-ViewModel) — архитектурный паттерн, используемый в модулях платформы. Он разделяет бизнес-логику, состояние и представление.

## Архитектура

```
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
```

## Структура файлов модуля

```
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
```

## Model

Model хранит состояние и предоставляет методы для его изменения. Используйте MobX для реактивности.

```typescript
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
```

**Правила для Model:**

| Правило                | Описание                             |
| ---------------------- | ------------------------------------ |
| Только состояние       | Model не содержит бизнес-логику      |
| Приватные поля         | Данные доступны только через геттеры |
| `@injectable()`        | Model регистрируется в DI            |
| `makeAutoObservable()` | Делает свойства реактивными          |
| `dispose()`            | Метод очистки состояния              |

### Разделение на Entity и Model

Model можно разделить на две части для удобства:

- **Entity** — содержит структуру данных
- **Model** — содержит методы для работы с этой структурой

```
models/
├── todo_list.entity.ts      # Entity — структура данных
└── todo_list.model.ts       # Model — методы работы с данными
```

**Entity** — класс с полями данных:

```typescript
// models/todo_list.entity.ts
export class TodoList {
  id: string = '';
  description: string = '';
  completed: boolean = false;
  created_at: Date = new Date();
  updated_at: Date = new Date();
}
```

**Model** — класс с состоянием и методами для работы с Entity:

```typescript
// models/todo_list.model.ts
import { TodoList } from './todo_list.entity';

@injectable()
export class TodoListModel {
  private _todos: TodoList[] = []; // Массив объектов Entity

  get items(): TodoList[] {
    return this._todos;
  }

  setItem(description: string) {
    // Создаём объект Entity
    const item = new TodoList();
    item.id = Date.now().toString();
    item.description = description;
    this._todos.push(item);
  }

  removeItem(id: string) {
    this._todos = this._todos.filter((item) => item.id !== id);
  }
}
```

> Такое разделение упрощает типизацию, тестирование и переиспользование структур данных. Возможно так же структуры делать наблюдаемыми через mobx.

## ViewModel

ViewModel связывает View с Model и Use Cases. Предоставляет данные и методы для View.

> **Важно:** ViewModel — это **не хранилище данных**. Он только предоставляет доступ к данным из Model и делегирует операции в Use Cases. Все состояние хранится в Model.

```typescript
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
```

**Правила для ViewModel:**

| Правило              | Описание                                                      |
| -------------------- | ------------------------------------------------------------- |
| Нет бизнес-логики    | ViewModel только делегирует в Use Cases                       |
| Геттеры из Model     | Данные берутся из Model через геттеры                         |
| Вычисляемые свойства | Производные данные вычисляются в ViewModel                    |
| Несколько ViewModel  | View может использовать несколько ViewModel при необходимости |
| `@injectable()`      | ViewModel регистрируется в DI                                 |

## Use Cases

Use Case инкапсулирует единицу бизнес-логики. Оркестрирует работу с Model и Repository.

ViewModel вызывает Use Cases для выполнения операций:

```typescript
// В ViewModel
addItem(text: string) {
  this.addTaskUsecase.execute(text);  // Делегирование в Use Case
}
```

> Подробнее о создании и использовании Use Cases см. [Use Cases](./usecases.md)

## View

View — React компоненты, отображающие данные из ViewModel.

### Страница

```typescript
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
```

### Компонент с observer

```typescript
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
```

### useVM и observer

`useVM()` и `observer()` работают вместе:

- `useVM()` — получает ViewModel из DI контейнера
- `observer()` — делает компонент реактивным (без него изменения MobX не вызовут перерисовку)

| Инструмент   | Назначение                           |
| ------------ | ------------------------------------ |
| `useVM()`    | Получение ViewModel из DI            |
| `observer()` | Обертка компонента для реактивности  |
| `<Observer>` | Локальная подписка внутри компонента |

**Примеры использования:**

```typescript
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
```

## Repository (слой данных)

Repository инкапсулирует работу с внешними источниками данных (API, LocalStorage и т.д.).

Use Cases используют Repository для получения и сохранения данных:

```typescript
// В Use Case
const data = await this.repository.getData();
this.model.setData(data);
```

> Подробнее о Repository, DTO и валидации см. [Работа с данными](./data-layer.md)

## DI регистрация

Все компоненты MVVM регистрируются в DI контейнере.

### Токены

```typescript
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
```

### Регистрация

```typescript
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
```

> Model обычно регистрируется как singleton, чтобы состояние сохранялось между переходами по страницам.

## Поток данных

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│    View     │───▶│  ViewModel  │───▶│   UseCase   │───▶│    Model    │
│   (click)   │    │  (method)   │    │  (execute)  │    │  (setState) │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
       ▲                  ▲                                     │
       │                  │                                     │
       │   observer()     │         MobX реактивность           │
       └──────────────────┴─────────────────────────────────────┘
```

**Пример потока:**

1. Пользователь нажимает кнопку "Add Task" в View
2. View вызывает `viewModel.addItem(text)`
3. ViewModel делегирует в `addTaskUsecase.execute(text)`
4. UseCase создает задачу и вызывает `model.setItem(task)`
5. Model обновляет состояние
6. ViewModel (геттеры из Model) становится реактивно обновлённым
7. View (обёрнутый в `observer`) перерисовывается

## Типичные ошибки

### ❌ Бизнес-логика в ViewModel

```typescript
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
```

### ❌ API запросы в ViewModel

```typescript
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
```

### ❌ Забыли observer

```typescript
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
```
