# Use Cases

Use Case инкапсулирует единицу бизнес-логики. Один Use Case — одна операция.

## Структура

```
usecases/
├── addTask.usecase.ts
├── removeTask.usecase.ts
├── updateTask.usecase.ts
├── loadTaskList.usecase.ts
├── disposeTaskList.usecase.ts
└── index.ts
```

## Базовая структура Use Case

```typescript
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
```

## Правила Use Case

| Правило                  | Описание                                     |
| ------------------------ | -------------------------------------------- |
| Одна операция            | Один Use Case выполняет одну бизнес-операцию |
| `@injectable()`          | Use Case регистрируется в DI                 |
| `makeAutoObservable`     | Делает Use Case реактивным (опционально)     |
| Метод `execute()`        | Единственная точка входа в Use Case          |
| Работа через Model       | Изменение данных только через методы Model   |
| Валидация входных данных | Проверяйте данные в начале execute()         |

## Типы Use Case

### Синхронный Use Case

Простые операции без асинхронных вызовов:

```typescript
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
```

### Асинхронный Use Case

Операции с API запросами:

```typescript
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
```

### Use Case с возвратом данных

Use Case может возвращать данные (например, для фильтрации):

```typescript
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
```

### Dispose Use Case

Use Case для очистки состояния при выходе со страницы:

```typescript
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
```

## Обработка ошибок

### try/catch/finally

Для асинхронных Use Cases без `executeWithAbortHandling` используйте `try/catch/finally`:

```typescript
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
```

### Паттерн с сохранением предыдущих данных

```typescript
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
```

### Когда использовать executeWithAbortHandling

| Сценарий                         | Рекомендация               |
| -------------------------------- | -------------------------- |
| Запросы, которые могут дублиться | `executeWithAbortHandling` |
| Простой одиночный запрос         | `try/catch/finally`        |
| Нужно восстановление данных      | `executeWithAbortHandling` |
| Цепочка зависимых запросов       | `try/catch/finally`        |

## Вызов Use Case

### Из ViewModel

```typescript
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
```

### Из onEnter роута

```typescript
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
```

## Регистрация в DI

### Токены

```typescript
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
```

### Конфигурация

```typescript
// config/di.config.ts
import { AddTaskUsecase } from '../usecases/addTask.usecase';
import { RemoveTaskUsecase } from '../usecases/removeTask.usecase';
import { LoadTaskListUsecase } from '../usecases/loadTaskList.usecase';
import { DisposeTaskListUsecase } from '../usecases/disposeTaskList.usecase';

export const DI_CONFIG = (container: Container) => {
  // Models
  container.bind(DI_TOKENS.MODEL_TODO_LIST).to(TodoListModel);

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
```

## Экспорт

```typescript
// usecases/index.ts
export { AddTaskUsecase } from './addTask.usecase';
export { RemoveTaskUsecase } from './removeTask.usecase';
export { UpdateTaskUsecase } from './updateTask.usecase';
export { LoadTaskListUsecase } from './loadTaskList.usecase';
export { DisposeTaskListUsecase } from './disposeTaskList.usecase';
```

## Паттерны именования

| Тип операции | Пример имени             | Описание                  |
| ------------ | ------------------------ | ------------------------- |
| Создание     | `AddTaskUsecase`         | Добавление новой сущности |
| Чтение       | `GetTaskListUsecase`     | Получение данных          |
| Обновление   | `UpdateTaskUsecase`      | Изменение сущности        |
| Удаление     | `RemoveTaskUsecase`      | Удаление сущности         |
| Загрузка     | `LoadTaskListUsecase`    | Загрузка данных из API    |
| Очистка      | `DisposeTaskListUsecase` | Очистка состояния         |

## Типичные ошибки

### ❌ Бизнес-логика в ViewModel

```typescript
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
```

### ❌ Прямые API вызовы в ViewModel

```typescript
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
```

### ❌ Use Case без валидации

```typescript
// НЕПРАВИЛЬНО
execute(id: string): void {
  this.todoModel.removeItem(id); // Может быть пустой id
}

// ПРАВИЛЬНО
execute(id: string): void {
  if (!id) return;
  this.todoModel.removeItem(id);
}
```

## Связанные разделы

- [MVVM паттерн](./mvvm-pattern.md)
- [Работа с данными](./data-layer.md)
- [Конфигурация модуля](./module-config.md)
- [Как это работает](../how-it-works.md)
