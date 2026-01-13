import { type FC } from 'react';
import { DocSection, DocCodeBlock, DocList, DocNote } from '../../common';

/**
 * Секция документации по инструментам тестирования.
 * Содержит информацию о командах Vitest, конфигурации, структуре тестов,
 * тестировании React компонентов, DI контейнера, MobX моделей, Use Cases
 * и best practices.
 *
 * @component
 */
export const TestingSection: FC = () => (
  <DocSection title="Testing">
    <DocSection title="Команды">
      <DocCodeBlock
        code={`# Запустить все тесты
npm test

# Запустить тесты хоста
npm run test:host

# Запустить тесты библиотеки
npm run test:lib -- --name=core

# Запустить тесты модуля
npm run test:module -- --name=todo

# Запустить тесты всех модулей
npm run test:modules -- --all --parallel

# Watch режим
npm test -- --watch

# UI режим
npm test -- --ui

# С coverage
npm test -- --coverage`}
        language="bash"
      />
    </DocSection>

    <DocSection title="Конфигурация Vitest">
      <p>vitest.config.ts:</p>

      <DocCodeBlock
        code={`import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.mts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'dist/',
        '**/*.test.ts',
        '**/*.test.tsx',
        '**/*.spec.ts',
        '**/*.spec.tsx',
      ],
    },
  },
  resolve: {
    alias: {
      '@platform/core': path.resolve(__dirname, '../../core/src'),
      '@platform/ui': path.resolve(__dirname, '../../ui/src'),
    },
  },
});`}
        language="typescript"
      />
    </DocSection>

    <DocSection title="Setup файл">
      <p>vitest.setup.mts:</p>

      <DocCodeBlock
        code={`import 'reflect-metadata';
import '@testing-library/jest-dom';`}
        language="typescript"
      />
    </DocSection>

    <DocSection title="Структура тестов">
      <p>Тесты можно располагать:</p>

      <DocList
        items={[
          'В директории `__tests__/`',
          'В файлах `.test.ts(x)`',
          'В файлах `.spec.ts(x)`',
        ]}
      />

      <p>Пример структуры:</p>

      <DocCodeBlock
        code={`src/
├── components/
│   ├── Button.tsx
│   ├── Button.test.tsx
│   └── __tests__/
│       └── Button.test.tsx
├── models/
│   ├── todo.model.ts
│   └── __tests__/
│       └── todo.model.test.ts
└── usecases/
    ├── add-task.usecase.ts
    └── add-task.usecase.test.ts`}
        language="text"
      />
    </DocSection>

    <DocSection title="Базовый тест">
      <DocCodeBlock
        code={`import { describe, it, expect, vi } from 'vitest';

describe('MyFunction', () => {
  it('should add two numbers', () => {
    const result = add(2, 3);
    expect(result).toBe(5);
  });

  it('should call callback', () => {
    const callback = vi.fn();
    myFunction(callback);
    expect(callback).toHaveBeenCalled();
  });
});`}
        language="typescript"
      />
    </DocSection>

    <DocSection title="Тестирование React компонентов">
      <DocCodeBlock
        code={`import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TodoCard } from './TodoCard';

describe('TodoCard', () => {
  it('should render title', () => {
    render(<TodoCard title="My Todo" />);
    expect(screen.getByText('My Todo')).toBeInTheDocument();
  });

  it('should toggle completed on click', async () => {
    const onToggle = vi.fn();
    render(<TodoCard title="My Todo" completed={false} onToggle={onToggle} />);

    const button = screen.getByRole('button');
    await userEvent.click(button);

    await waitFor(() => {
      expect(onToggle).toHaveBeenCalledTimes(1);
    });
  });
});`}
        language="typescript"
      />
    </DocSection>

    <DocSection title="Тестирование DI контейнера">
      <DocCodeBlock
        code={`import { describe, it, expect, beforeEach } from 'vitest';
import { Container } from 'inversify';
import { DI_CONFIG } from '../config/di.config';
import { TODO_DI_TOKENS } from '../config/di.tokens';

describe('DI Configuration', () => {
  let container: Container;

  beforeEach(() => {
    container = new Container();
    DI_CONFIG(container);
  });

  it('should resolve TodoListViewModel', () => {
    const viewModel = container.get(TODO_DI_TOKENS.VIEW_MODEL_TODO_LIST);
    expect(viewModel).toBeDefined();
  });

  it('should resolve AddTaskUsecase', () => {
    const usecase = container.get(TODO_DI_TOKENS.USECASE_ADD_TASK);
    expect(usecase).toBeDefined();
  });
});`}
        language="typescript"
      />
    </DocSection>

    <DocSection title="Тестирование MobX моделей">
      <DocCodeBlock
        code={`import { describe, it, expect } from 'vitest';
import { TodoListModel } from '../todo_list.model';

describe('TodoListModel', () => {
  it('should add item', () => {
    const model = new TodoListModel();
    expect(model.items).toHaveLength(0);

    model.setItem({ id: '1', description: 'Todo', completed: false });
    expect(model.items).toHaveLength(1);
    expect(model.items[0].description).toBe('Todo');
  });

  it('should clear items', () => {
    const model = new TodoListModel();
    model.setItem({ id: '1', description: 'Todo', completed: false });
    expect(model.items).toHaveLength(1);

    model.dispose();
    expect(model.items).toHaveLength(0);
  });
});`}
        language="typescript"
      />
    </DocSection>

    <DocSection title="Тестирование Use Cases">
      <DocCodeBlock
        code={`import { describe, it, expect, vi } from 'vitest';
import { AddTaskUsecase } from '../add_task.usecase';
import { TodoListModel } from '../../models/todo_list.model';

describe('AddTaskUsecase', () => {
  it('should add task with valid text', async () => {
    const model = new TodoListModel();
    const repository = {
      createTask: vi.fn().mockResolvedValue({ id: '1', description: 'Todo', completed: false }),
    };
    const usecase = new AddTaskUsecase(model, repository);

    await usecase.execute('New Todo');

    expect(model.items).toHaveLength(1);
    expect(model.items[0].description).toBe('New Todo');
  });

  it('should not add task with empty text', async () => {
    const model = new TodoListModel();
    const repository = {
      createTask: vi.fn(),
    };
    const usecase = new AddTaskUsecase(model, repository);

    await usecase.execute('');

    expect(model.items).toHaveLength(0);
    expect(repository.createTask).not.toHaveBeenCalled();
  });
});`}
        language="typescript"
      />
    </DocSection>

    <DocSection title="Тестирование Bootstrap Handlers">
      <DocCodeBlock
        code={`import { describe, it, expect, vi } from 'vitest';
import { APIClientHandler } from './api-client.handler';

describe('APIClientHandler', () => {
  it('should initialize APIClient', async () => {
    const handler = new APIClientHandler();
    const params = { config: { apiUrl: 'http://api.com' } };
    const next = vi.fn().mockResolvedValue({});

    const result = await handler.handle(params, next);

    expect(next).toHaveBeenCalledWith(params);
    expect(result).toBeDefined();
  });
});`}
        language="typescript"
      />
    </DocSection>

    <DocSection title="Mocking">
      <p>Мокинг модулей:</p>

      <DocCodeBlock
        code={`import { vi } from 'vitest';

// Мокинг модуля
vi.mock('../my-module', () => ({
  myFunction: vi.fn(),
  MY_CONSTANT: 'mocked',
}));

// Мокинг API
import axios from 'axios';
import axiosMockAdapter from 'axios-mock-adapter';

const mock = new axiosMockAdapter(axios);
mock.onGet('/api/todos').reply(200, [{ id: '1', description: 'Todo' }]);

// Мокинг localStorage
Object.defineProperty(global, 'localStorage', {
  value: {
    getItem: vi.fn(() => '{}'),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  },
  writable: true,
});`}
        language="typescript"
      />
    </DocSection>

    <DocSection title="Testing Library Queries">
      <p>Основные методы поиска элементов:</p>

      <DocCodeBlock
        code={`import { render, screen } from '@testing-library/react';

render(<MyComponent />);

// ✅ Предпочтительные методы
screen.getByText('Hello')
screen.getByRole('button')
screen.getByLabelText('Username')
screen.getByPlaceholderText('Search...')
screen.getByTestId('submit-btn')

// ❌ Избегайте тестовых ID
screen.getByTestId('my-element')`}
        language="typescript"
      />

      <DocList
        items={[
          'getBy... - выбрасывает ошибку если не найден',
          'queryBy... - возвращает null если не найден',
          'findBy... - асинхронный, ждет появления',
        ]}
      />
    </DocSection>

    <DocSection title="UserEvent">
      <p>Симуляция пользовательских действий:</p>

      <DocCodeBlock
        code={`import userEvent from '@testing-library/user-event';

const user = userEvent.setup();

await user.click(button);
await user.type(input, 'Hello');
await user.clear(input);
await user.selectOptions(select, 'Option 1');
await user.keyboard('{Enter}');
await user.tab();`}
        language="typescript"
      />
    </DocSection>

    <DocNote type="info" title="Best Practices">
      <DocList
        items={[
          'Тестируйте поведение, а не реализацию',
          'Используйте описательные имена для тестов',
          'Мокайте внешние зависимости',
          'Используйте UserEvent вместо fireEvent',
          'Предпочитайте getByRole вместо getByTestId',
          'Покрывайте критический путь пользователя',
        ]}
      />
    </DocNote>
  </DocSection>
);
