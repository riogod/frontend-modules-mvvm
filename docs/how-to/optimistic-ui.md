# Optimistic UI

Optimistic UI — это паттерн, при котором интерфейс обновляется **мгновенно**, не дожидаясь ответа от сервера. Это создает ощущение быстрого и отзывчивого приложения.

## Что это дает

- **Мгновенный отклик** — пользователь сразу видит результат действия
- **Улучшенный UX** — нет задержек и "зависаний" интерфейса
- **Естественное взаимодействие** — приложение ведет себя как нативное

## Принцип работы

```
┌──────────────┐   1. Действие    ┌──────────────┐   2. Обновление   ┌───────────┐
│     View     │ ───────────────▶ │   UseCase    │ ────────────────▶ │   Model   │
│   (кнопка)   │                  │  (execute)   │                   │  (state)  │
└──────────────┘                  └──────────────┘                   └───────────┘
       ▲                                 │                                 │
       │         MobX реактивность       │   3. Сохранение                 │
       └─────────────────────────────────│◀─────(async)────────────────────┘
                 5. Ререндер             │           │
                                         ▼           ▼
                                  ┌──────────────────────┐
                                  │  Repository / API    │
                                  └──────────────────────┘
                                         │
                                         ▼
                                  4. Подтверждение
```

**Последовательность:**

1. Пользователь выполняет действие (клик, ввод)
2. UseCase **сразу** обновляет Model
3. View перерисовывается благодаря MobX-реактивности
4. UseCase асинхронно сохраняет данные
5. При ошибке — откат к предыдущему состоянию

## Реализация в платформе

### MobX как основа реактивности

MobX автоматически отслеживает изменения в моделях и обновляет View. Это ключевой элемент для Optimistic UI.

```typescript
// Model — реактивное хранилище
@injectable()
export class TodoListModel {
  private _todos: TodoList[] = [];

  constructor() {
    makeAutoObservable(this);
  }

  // Мгновенное обновление состояния
  setItem(item: TodoList) {
    this._todos.push(item);
  }

  removeItem(id: string) {
    this._todos = this._todos.filter((item) => item.id !== id);
  }
}
```

### Паттерн "Обнови сейчас, сохрани потом"

UseCase сначала обновляет модель, а потом выполняет сохранение:

```typescript
@injectable()
export class AddTaskUsecase {
  constructor(
    @inject(TODO_DI_TOKENS.MODEL_TODO_LIST)
    private todoModel: TodoListModel,
    @inject(IOC_CORE_TOKENS.REPOSITORY_LOCAL_STORAGE)
    private localStorageRepository: LocalStorageRepository,
  ) {
    makeAutoObservable(this);
  }

  execute(text: string): void {
    if (!text) return;

    // 1. СНАЧАЛА обновляем Model — UI мгновенно отобразит изменения
    this.todoModel.setItem({
      id: Date.now().toString(),
      description: text,
      completed: false,
      created_at: new Date(),
      updated_at: new Date(),
    });

    // 2. ПОТОМ сохраняем в хранилище
    this.saveToStorage();
  }

  private saveToStorage(): void {
    const todoList = this.localStorageRepository.getKey<string>('todoList');
    let parsedTodoList: TodoList[] = [];

    if (todoList && todoList.trim()) {
      try {
        parsedTodoList = JSON.parse(todoList) as TodoList[];
      } catch {
        parsedTodoList = [];
      }
    }

    parsedTodoList.push(this.todoModel.items[this.todoModel.items.length - 1]);
    this.localStorageRepository.setKey('todoList', JSON.stringify(parsedTodoList));
  }
}
```

### Обновление существующих данных

```typescript
@injectable()
export class UpdateTaskUsecase {
  constructor(
    @inject(TODO_DI_TOKENS.MODEL_TODO_LIST)
    private todoModel: TodoListModel,
    @inject(IOC_CORE_TOKENS.REPOSITORY_LOCAL_STORAGE)
    private localStorageRepository: LocalStorageRepository,
  ) {
    makeAutoObservable(this);
  }

  execute(item: UpdateTodoList): void {
    // 1. Мгновенное обновление модели
    this.todoModel.updateItem(item);

    // 2. Синхронизация с хранилищем
    this.syncStorage(item);
  }

  private syncStorage(item: UpdateTodoList): void {
    // ... логика сохранения
  }
}
```

## Работа с API и откат при ошибках

Для работы с API используется утилита `executeWithAbortHandling`, которая автоматически:

- Сохраняет предыдущие данные перед запросом
- Восстанавливает их при отмене или ошибке
- Управляет состоянием загрузки

```typescript
import { executeWithAbortHandling } from '@platform/core';

@injectable()
export class GetJokeUsecase {
  private requestIdTracker = { current: 0 };

  constructor(
    @inject(API_EXAMPLE_DI_TOKENS.REPOSITORY_JOKE)
    private jokesRepository: JokesRepository,
    @inject(API_EXAMPLE_DI_TOKENS.MODEL_JOKE)
    private jokesModel: JokesModel,
    @inject(IOC_CORE_TOKENS.MODEL_APP)
    private appModel: AppModel,
  ) {
    makeAutoObservable(this);
  }

  async execute(): Promise<void> {
    await executeWithAbortHandling({
      // Функция запроса
      requestFn: async () => {
        const joke = await this.jokesRepository.getJoke();
        return joke && joke.length > 0 ? joke[0] : null;
      },
      // Получить предыдущие данные для отката
      getPreviousData: () => this.jokesModel.joke,
      // Установить новые данные
      setData: (joke) => {
        if (joke) {
          this.jokesModel.setJoke(joke);
        }
      },
      // Управление состоянием загрузки
      setLoading: (loading) => {
        this.jokesModel.loading = loading;
      },
      // Обработка ошибок
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

### Параметры `executeWithAbortHandling`

| Параметр           | Описание                                                |
| ------------------ | ------------------------------------------------------- |
| `requestFn`        | Асинхронная функция запроса                             |
| `getPreviousData`  | Функция получения текущих данных для возможного отката  |
| `setData`          | Функция установки новых данных в модель                 |
| `setLoading`       | Функция управления состоянием загрузки                  |
| `onError`          | Обработчик ошибок (не вызывается при отмене)            |
| `requestIdTracker` | Объект для отслеживания актуальности запроса            |

### Как работает откат

```
┌─────────────────────────────────────────────────────────────────┐
│                    executeWithAbortHandling                      │
├─────────────────────────────────────────────────────────────────┤
│  1. Сохранить previousData = getPreviousData()                  │
│  2. setLoading(true)                                            │
│  3. Выполнить requestFn()                                       │
│     ├─ Успех → setData(response)                                │
│     ├─ Отмена → setData(previousData)  // откат                 │
│     └─ Ошибка → onError(error), throw                           │
│  4. setLoading(false)                                           │
└─────────────────────────────────────────────────────────────────┘
```

## Ручной откат при ошибках

Если не используете `executeWithAbortHandling`, реализуйте откат вручную:

```typescript
@injectable()
export class CreateItemUsecase {
  constructor(
    @inject(DI_TOKENS.MODEL) private model: ItemsModel,
    @inject(DI_TOKENS.REPOSITORY) private repository: ItemsRepository,
    @inject(IOC_CORE_TOKENS.MODEL_APP) private appModel: AppModel,
  ) {
    makeAutoObservable(this);
  }

  async execute(item: Item): Promise<void> {
    // 1. Сохраняем для возможного отката
    const previousItems = [...this.model.items];

    // 2. Оптимистичное обновление
    this.model.addItem(item);

    try {
      // 3. Отправляем на сервер
      await this.repository.create(item);
    } catch (error) {
      // 4. Откат при ошибке
      this.model.setItems(previousItems);

      if (error instanceof Error) {
        this.appModel.notification = 'Не удалось создать элемент';
      }
    }
  }
}
```

## Связка с View

View автоматически обновляется благодаря `observer` из MobX:

```tsx
import { observer } from 'mobx-react-lite';

const TodoList: FC = observer(() => {
  const vm = useVM<TodoListViewModel>(TODO_DI_TOKENS.VIEW_MODEL);

  return (
    <ul>
      {vm.items.map((item) => (
        <li key={item.id}>
          {item.description}
          <button onClick={() => vm.removeItem(item.id)}>Удалить</button>
        </li>
      ))}
    </ul>
  );
});
```

При вызове `vm.removeItem(id)`:
1. UseCase мгновенно удаляет элемент из модели
2. MobX замечает изменение
3. Компонент перерисовывается без элемента
4. Пользователь сразу видит результат

## Когда использовать

### ✅ Подходит для

- Добавление/удаление элементов списка
- Переключение состояний (чекбоксы, тоглы)
- Обновление полей форм
- Действия с высокой вероятностью успеха

### ❌ Не подходит для

- Критичные финансовые операции
- Действия с низкой вероятностью успеха
- Операции требующие подтверждения сервера

## Лучшие практики

1. **Всегда сохраняйте предыдущее состояние** перед оптимистичным обновлением
2. **Показывайте индикатор загрузки** для длительных операций
3. **Информируйте об ошибках** при неудачном сохранении
4. **Используйте `executeWithAbortHandling`** для API-запросов
5. **Не забывайте `observer`** в компонентах для реактивности

