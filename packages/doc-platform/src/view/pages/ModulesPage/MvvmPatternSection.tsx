import { type FC } from 'react';
import {
  DocSection,
  DocCodeBlock,
  DocList,
  DocNote,
  DocTable,
} from '../../common';

export const MvvmPatternSection: FC = () => (
  <DocSection title="MVVM Pattern">
    <DocSection title="Архитектура">
      <DocCodeBlock
        code={`┌─────────────────────────────────────────────┐
│                     View                    │
│            (React Components)               │
│                  ↓ useVM()                  │
├─────────────────────────────────────────────┤
│                   ViewModel                 │
│         (Proxy to Model, User Actions)      │
│                  ↓ execute()                │
├─────────────────────────────────────────────┤
│                   Use Case                  │
│           (Business Logic Only)             │
│                 ↓ operations                │
├─────────────────────────────────────────────┤
│                    Model                    │
│            (State Storage Only)             │
│                  ↓ methods                  │
├─────────────────────────────────────────────┤
│                  Repository                 │
│         (Data Source Encapsulation)         │
└─────────────────────────────────────────────┘`}
        language="text"
      />
    </DocSection>
    <DocSection title="Model">
      <p>Хранит только состояние. Не содержит бизнес-логику.</p>
      <DocCodeBlock
        code={`@injectable()
export class TodoListModel {
  private _todos: Todo[] = [];
  private _loading = false;

  constructor() {
    makeAutoObservable(this, {
      items: computed,
      setItem: action,
    });
  }

  get items(): Todo[] {
    return this._todos;
  }

  setItem(item: Todo): void {
    this._todos.push(item);
  }

  setLoading(loading: boolean): void {
    this._loading = loading;
  }

  dispose(): void {
    this._todos = [];
  }
}`}
        language="typescript"
      />
      <DocList
        items={[
          '✅ Хранит только состояние',
          '✅ Предоставляет методы для изменения состояния',
          '✅ Не содержит бизнес-логику',
          '✅ Реализует dispose() для очистки',
        ]}
      />
    </DocSection>
    <DocSection title="ViewModel">
      <p>Прокси к Model и делегирование в Use Cases.</p>
      <DocCodeBlock
        code={`@injectable()
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

  get loading() {
    return this.todoModel.loading;
  }

  // ✅ Методы делегируют в Use Cases
  addItem(text: string): void {
    this.addTaskUsecase.execute(text);
  }
}`}
        language="typescript"
      />
      <DocList
        items={[
          '✅ Прокси к Model (геттеры)',
          '✅ Делегирует действия в Use Cases',
          '✅ Не хранит данные',
          '✅ Не содержит бизнес-логику',
          '❌ Не вызывает API напрямую',
        ]}
      />
    </DocSection>
    <DocSection title="Use Cases">
      <p>Содержит бизнес-логику. Один Use Case = одна операция.</p>
      <DocCodeBlock
        code={`@injectable()
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

    // ✅ Выполнение операции
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
}`}
        language="typescript"
      />
      <DocList
        items={[
          '✅ Одна бизнес-операция',
          '✅ Валидация входных данных',
          '✅ Работа через Repository',
          '✅ Метод execute() - единственная точка входа',
          '❌ Не содержит UI логику',
        ]}
      />
    </DocSection>
    <DocSection title="View">
      <p>React компоненты, использующие ViewModel.</p>
      <DocCodeBlock
        code={`import { type FC } from 'react';
import { observer } from 'mobx-react-lite';
import { useVM } from '@platform/ui';
import type { TodoListViewModel } from '../viewmodels/todo_list.vm';
import { TODO_DI_TOKENS } from '../config/di.tokens';

const TodoPage: FC = observer(() => {
  const viewModel = useVM<TodoListViewModel>(
    TODO_DI_TOKENS.VIEW_MODEL_TODO_LIST,
  );

  return (
    <div>
      {viewModel.items.map((item) => (
        <div key={item.id}>{item.description}</div>
      ))}
      <button onClick={() => viewModel.addItem('New task')}>
        Add Task
      </button>
    </div>
  );
});`}
        language="typescript"
      />
      <DocList
        items={[
          '✅ Обернут в observer()',
          '✅ Использует useVM()',
          '✅ Вызывает методы ViewModel',
          '✅ Не содержит бизнес-логику',
        ]}
      />
    </DocSection>
    <DocSection title="Entity vs Model">
      <DocTable
        columns={[
          { header: 'Entity', key: 'entity' },
          { header: 'Model', key: 'model' },
        ]}
        rows={[
          {
            entity: 'Структура данных',
            model: 'Класс с методами',
          },
          {
            entity: 'Без бизнес-логики',
            model: 'Содержит методы для управления состоянием',
          },
          {
            entity: 'Только интерфейс/тип',
            model: 'Реализует makeAutoObservable',
          },
          {
            entity: 'Используется как тип',
            model: 'Регистрируется в DI как singleton',
          },
        ]}
      />
    </DocSection>
    <DocNote type="error" title="Распространенные ошибки">
      <DocList
        items={[
          '❌ Бизнес-логика в Model',
          '❌ Хранение данных в ViewModel',
          '❌ API запросы в ViewModel',
          '❌ Отсутствие observer() на компоненте',
          '❌ Прямой вызов Repository из View',
        ]}
      />
    </DocNote>
  </DocSection>
);
