# Как это работает

Схематичное представление workflow загрузки данных в MVVM архитектуре.

## Схема

```
┌─────────┐
│  Actor  │
└────┬────┘
     │
     │ http://my.app/route
     ▼
┌─────────────────────────────┐
│ router onEnter() middleware │
└──────────────┬──────────────┘
               │
               │ usecase.execute()
               ▼
┌─────────────────────────────┐      ┌──────────────┐      ┌──────────┐
│          UseCase            │─────▶│  Repository  │─────▶│   Data   │
│                             │◀─────│              │◀─────│ (API/DB) │
└──────────────┬──────────────┘      └──────────────┘      └──────────┘
               │
               │ model.setData()
               ▼
┌─────────────────────────────┐
│           Model             │
│    (observable состояние)   │
└──────────────┬──────────────┘
               │
               │ MobX реактивность
               ▼
┌─────────────────────────────┐
│         ViewModel           │
│      (геттеры из Model)     │
└──────────────┬──────────────┘
               │
               │ observer()
               ▼
┌─────────────────────────────┐
│            View             │
│     (React компонент)       │
└─────────────────────────────┘
```

## Workflow

1. **Пользователь переходит по роуту** `http://my.app/route`

2. **Срабатывает событие `onEnter`** определённое в конфигурации роутинга модуля

3. **Из `onEnter` вызывается UseCase** `usecase.execute()`

4. **UseCase обращается к Repository** `repository.getData()`, который:
   - Выполняет запрос к API эндпоинту
   - Валидирует и обрабатывает полученные данные
   - Возвращает данные в UseCase

5. **UseCase заполняет Model** через методы `model.setData()`

6. **ViewModel читает данные из Model** через геттеры

7. **View автоматически обновляется** при изменении наблюдаемых параметров через MobX реактивность

## Пример из проекта

### Конфигурация роута

```typescript
// packages/todo/src/config/routes.ts
export const routes: IRoutes = [
  {
    name: 'todo',
    path: '/todo',
    pageComponent: lazy(() => import('../view/TodoPage')),
    onEnterNode: async (_toState, _fromState, deps) => {
      const container = deps.di;
      container
        .get<LoadTaskListUsecase>(TODO_DI_TOKENS.USECASE_LOAD_TASK_LIST)
        .execute();
    },
    onExitNode: async (_toState, _fromState, deps) => {
      const container = deps.di;
      container
        .get<DisposeTaskListUsecase>(TODO_DI_TOKENS.USECASE_DISPOSE_TASK_LIST)
        .execute();
    },
  },
];
```

### UseCase

```typescript
// packages/todo/src/usecases/loadTaskList.usecase.ts
@injectable()
export class LoadTaskListUsecase {
  constructor(
    @inject(TODO_DI_TOKENS.MODEL_TODO_LIST)
    private todoModel: TodoListModel,
    @inject(IOC_CORE_TOKENS.REPOSITORY_LOCAL_STORAGE)
    private localStorageRepository: LocalStorageRepository,
  ) {}

  execute(): void {
    // Получаем данные из Repository
    const todoList = this.localStorageRepository.getKey<string>('todoList');
    const parsedTodoList = todoList ? JSON.parse(todoList) : [];

    // Заполняем Model
    parsedTodoList.forEach((item) => {
      this.todoModel.setItem(item);
    });
  }
}
```

### Model

```typescript
// packages/todo/src/models/todo_list.model.ts
@injectable()
export class TodoListModel {
  private _todos: TodoList[] = [];

  constructor() {
    makeAutoObservable(this);
  }

  get items(): TodoList[] {
    return this._todos;
  }

  setItem(item: TodoList) {
    this._todos.push(item);
  }
}
```

### ViewModel

```typescript
// packages/todo/src/viewmodels/todo_list.vm.ts
@injectable()
export class TodoListViewModel {
  constructor(
    @inject(TODO_DI_TOKENS.MODEL_TODO_LIST)
    private todoModel: TodoListModel,
  ) {
    makeAutoObservable(this);
  }

  // Геттер из Model — реактивен через MobX
  get items() {
    return this.todoModel.items;
  }
}
```

### View

```typescript
// packages/todo/src/view/TodoPage.tsx
const TodoPage: FC = () => {
  const viewModel = useVM<TodoListViewModel>(TODO_DI_TOKENS.VIEW_MODEL_TODO_LIST);

  return (
    <Observer>
      {() => (
        <div>
          {viewModel.items.map((item) => (
            <TodoItem key={item.id} item={item} />
          ))}
        </div>
      )}
    </Observer>
  );
};
```

## Состояние загрузки

Model может иметь свойство `loading` для отслеживания состояния загрузки:

```typescript
// Model
@observable _loading = false;

get loading() {
  return this._loading;
}

setLoading(loading: boolean) {
  this._loading = loading;
}
```

```typescript
// UseCase
async execute(): Promise<void> {
  this.model.setLoading(true);
  try {
    const data = await this.repository.getData();
    this.model.setData(data);
  } finally {
    this.model.setLoading(false);
  }
}
```

```typescript
// View
const MyComponent = observer(() => {
  const vm = useVM<MyViewModel>(DI_TOKENS.VIEW_MODEL);

  if (vm.loading) {
    return <Spinner />;
  }

  return <div>{vm.data}</div>;
});
```

> Для детального изучения данного процесса рассмотрите модуль `todo` в `packages/todo/` и `api_example` в `packages/api_example/`.

## Связанные разделы

- [MVVM паттерн](./modules/mvvm-pattern.md)
- [Конфигурация модуля](./modules/module-config.md)
- [Use Cases](./modules/usecases.md)
- [Работа с данными](./modules/data-layer.md)
