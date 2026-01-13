import { type FC } from 'react';
import { DocSection, DocCodeBlock, DocList, DocNote } from '../../common';

export const OptimisticUISection: FC = () => (
  <DocSection title="Optimistic UI">
    <DocSection title="Обзор">
      <p>
        Оптимистичный UI - мгновенное обновление интерфейса перед отправкой
        запроса на сервер.
      </p>
      <p>Преимущества:</p>
      <DocList
        items={[
          'Мгновенный отклик пользователя',
          'Улучшение пользовательского опыта',
          'Снижение ощущения задержки',
        ]}
      />
      <p>
        Шаблон: <code>update now, save later</code>
      </p>
    </DocSection>
    <DocSection title="Пример добавления задачи">
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

    // ✅ 1. Создаем оптимистичную задачу
    const optimisticTask: Todo = {
      id: \`temp_\${Date.now()}\`,
      description: text,
      completed: false,
      createdAt: new Date(),
    };

    // ✅ 2. Сразу добавляем в модель (мгновенный отклик)
    this.todoModel.setItem(optimisticTask);

    try {
      // ✅ 3. Отправляем запрос на сервер
      const result = await this.todoRepository.createTask({ description: text });

      // ✅ 4. Заменяем оптимистичную задачу на реальную
      this.todoModel.removeItem(optimisticTask.id);
      this.todoModel.setItem(result);
    } catch (error) {
      // ✅ 5. Откат на ошибке
      this.todoModel.removeItem(optimisticTask.id);
      throw error;
    }
  }
}`}
        language="typescript"
      />
    </DocSection>
    <DocSection title="Использование executeWithAbortHandling">
      <p>Автоматический rollback через executeWithAbortHandling:</p>
      <DocCodeBlock
        code={`@injectable()
export class UpdateTaskUsecase {
  private requestIdTracker = { current: 0 };

  constructor(
    @inject(TODO_DI_TOKENS.MODEL_TODO_LIST)
    private todoModel: TodoListModel,
    @inject(TODO_DI_TOKENS.REPOSITORY_TODO)
    private todoRepository: TodoRepository,
  ) {}

  async execute(id: string, updates: Partial<Todo>): Promise<void> {
    // ✅ Сохраняем предыдущее состояние для отката
    const previousTask = this.todoModel.items.find((item) => item.id === id);
    if (!previousTask) return;

    // ✅ Применяем оптимистичные изменения
    Object.assign(previousTask, updates);

    // ✅ Используем executeWithAbortHandling с rollback
    await executeWithAbortHandling({
      requestFn: async () => {
        return await this.todoRepository.updateTask(id, updates);
      },
      getPreviousData: () => [previousTask],
      setData: (result) => {
        if (result) {
          // Обновляем результат с сервера
          Object.assign(previousTask, result);
        }
      },
      onError: () => {
        // ✅ Автоматический rollback к предыдущим данным
        this.todoModel.setItem(previousTask);
      },
      requestIdTracker: this.requestIdTracker,
    });
  }
}`}
        language="typescript"
      />
    </DocSection>
    <DocSection title="Оптимистичное удаление">
      <DocCodeBlock
        code={`@injectable()
export class DeleteTaskUsecase {
  private requestIdTracker = { current: 0 };

  constructor(
    @inject(TODO_DI_TOKENS.MODEL_TODO_LIST)
    private todoModel: TodoListModel,
    @inject(TODO_DI_TOKENS.REPOSITORY_TODO)
    private todoRepository: TodoRepository,
  ) {}

  async execute(id: string): Promise<void> {
    // ✅ Сохраняем задачу для отката
    const previousTask = this.todoModel.items.find((item) => item.id === id);
    if (!previousTask) return;

    // ✅ Сразу удаляем из UI
    this.todoModel.removeItem(id);

    try {
      // ✅ Отправляем запрос на сервер
      await this.todoRepository.deleteTask(id);
    } catch (error) {
      // ✅ Откат: возвращаем задачу обратно
      this.todoModel.setItem(previousTask);
      throw error;
    }
  }
}`}
        language="typescript"
      />
    </DocSection>
    <DocSection title="Оптимистичное переключение">
      <DocCodeBlock
        code={`@injectable()
export class ToggleTaskUsecase {
  async execute(id: string): Promise<void> {
    const item = this.todoModel.items.find((item) => item.id === id);
    if (!item) return;

    // ✅ Сразу меняем состояние
    const previousCompleted = item.completed;
    item.completed = !item.completed;

    try {
      // ✅ Отправляем запрос
      await this.todoRepository.toggleTask(id);
    } catch (error) {
      // ✅ Откат: возвращаем предыдущее состояние
      item.completed = previousCompleted;
      throw error;
    }
  }
}`}
        language="typescript"
      />
    </DocSection>
    <DocSection title="Отображение загрузки">
      <DocCodeBlock
        code={`@injectable()
export class TodoListViewModel {
  get isLoading() {
    return this.todoModel.loading;
  }

  get optimisticItems() {
    return this.todoModel.items.map((item) => ({
      ...item,
      // Показываем loading для оптимистичных элементов
      isLoading: item.id.startsWith('temp_') && this.isLoading,
    }));
  }
}

// В View
{viewModel.optimisticItems.map((item) => (
  <TodoCard
    key={item.id}
    item={item}
    loading={item.isLoading}
  />
))}`}
        language="typescript"
      />
    </DocSection>
    <DocSection title="Ручной rollback">
      <p>Если не используете executeWithAbortHandling:</p>
      <DocCodeBlock
        code={`private rollback(id: string, previousData: Todo): void {
  const item = this.todoModel.items.find((item) => item.id === id);
  if (item) {
    Object.assign(item, previousData);
  }
}

// Использование
try {
  this.optimisticUpdate(id, updates);
  await this.apiCall();
} catch (error) {
  this.rollback(id, previousData);
  throw error;
}`}
        language="typescript"
      />
    </DocSection>
    <DocNote type="warning" title="Важно">
      Всегда предусматривайте rollback при ошибке. Оптимистичный UI без rollback
      может привести к рассинхронизации данных.
    </DocNote>
  </DocSection>
);
