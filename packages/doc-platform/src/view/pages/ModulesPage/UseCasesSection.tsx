import { type FC } from 'react';
import { DocSection, DocCodeBlock, DocList } from '../../common';

export const UseCasesSection: FC = () => (
  <DocSection title="Use Cases">
    <DocSection title="Основные принципы">
      <DocList
        items={[
          'Один Use Case = одна бизнес-операция',
          'Метод `execute()` - единственная точка входа',
          'Валидация входных данных обязательна',
          'Работа через Repository',
          'Изменение состояния только через Model',
        ]}
      />
    </DocSection>
    <DocSection title="Типы Use Cases">
      <DocList
        items={[
          'Synchronous - синхронные операции (без API запросов)',
          'Asynchronous - асинхронные операции (с API запросами)',
          'Return Data - возвращают данные',
          'Dispose - очистка ресурсов',
        ]}
      />
    </DocSection>
    <DocSection title="Synchronous Use Case">
      <DocCodeBlock
        code={`@injectable()
export class ToggleTaskUsecase {
  constructor(
    @inject(TODO_DI_TOKENS.MODEL_TODO_LIST)
    private todoModel: TodoListModel,
  ) {}

  execute(id: string): void {
    const item = this.todoModel.items.find((item) => item.id === id);
    if (item) {
      item.completed = !item.completed;
    }
  }
}`}
        language="typescript"
      />
    </DocSection>
    <DocSection title="Asynchronous Use Case">
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
    if (!text || text.trim().length === 0) {
      return;
    }

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
    </DocSection>
    <DocSection title="Return Data Use Case">
      <DocCodeBlock
        code={`@injectable()
export class GetTaskUsecase {
  constructor(
    @inject(TODO_DI_TOKENS.MODEL_TODO_LIST)
    private todoModel: TodoListModel,
  ) {}

  execute(id: string): Todo | undefined {
    return this.todoModel.items.find((item) => item.id === id);
  }
}

// Использование в ViewModel
getTask(id: string): Todo | undefined {
  return this.getTaskUsecase.execute(id);
}`}
        language="typescript"
      />
    </DocSection>
    <DocSection title="Dispose Use Case">
      <DocCodeBlock
        code={`@injectable()
export class DisposeTaskListUsecase {
  constructor(
    @inject(TODO_DI_TOKENS.MODEL_TODO_LIST)
    private todoModel: TodoListModel,
  ) {}

  execute(): void {
    this.todoModel.dispose();
  }
}

// Использование в onExitNode маршрута
onExitNode: async (_toState, _fromState, deps) => {
  const container = deps.di;
  container
    .get<DisposeTaskListUsecase>(TODO_DI_TOKENS.USECASE_DISPOSE_TASK_LIST)
    .execute();
}`}
        language="typescript"
      />
    </DocSection>
    <DocSection title="Naming Patterns">
      <DocList
        items={[
          'Add - добавить данные: AddTaskUsecase',
          'Get - получить данные: GetTaskUsecase',
          'Update - обновить данные: UpdateTaskUsecase',
          'Remove - удалить данные: RemoveTaskUsecase',
          'Load - загрузить список: LoadTaskListUsecase',
          'Dispose - очистить ресурсы: DisposeTaskListUsecase',
          'Toggle - переключить состояние: ToggleTaskUsecase',
        ]}
      />
    </DocSection>
    <DocSection title="Registration in DI">
      <DocCodeBlock
        code={`// di.config.ts
export const DI_CONFIG = (container: Container): Container => {
  container
    .bind(TODO_DI_TOKENS.USECASE_ADD_TASK)
    .to(AddTaskUsecase);
  container
    .bind(TODO_DI_TOKENS.USECASE_GET_TASK)
    .to(GetTaskUsecase);
  container
    .bind(TODO_DI_TOKENS.USECASE_LOAD_TASK_LIST)
    .to(LoadTaskListUsecase);
  container
    .bind(TODO_DI_TOKENS.USECASE_DISPOSE_TASK_LIST)
    .to(DisposeTaskListUsecase);

  return container;
};`}
        language="typescript"
      />
    </DocSection>
  </DocSection>
);
