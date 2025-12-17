# Тестирование

Проект использует **Vitest** для модульного тестирования и **Testing Library** для тестирования React-компонентов.

---

## Быстрый старт

```bash
# Тестировать всё
npm run test

# Тестировать host-приложение
npm run test:host

# Тестировать конкретную библиотеку
npm run test:lib -- --name=common

# Тестировать конкретный модуль
npm run test:module -- --name=todo

# Тестировать все библиотеки
npm run test:libs

# Тестировать все модули
npm run test:modules
```

---

## Структура тестов

```
project/
├── host/
│   ├── src/
│   │   ├── bootstrap/
│   │   │   ├── handlers/
│   │   │   │   └── __tests__/          # Тесты обработчиков
│   │   │   │       ├── DIHandler.test.ts
│   │   │   │       └── ModulesHandler.test.ts
│   │   │   └── __tests__/              # Тесты bootstrap
│   │   │       └── bootstrap.test.ts
│   ├── vite.config.mts                 # Конфиг Vitest (встроен)
│   └── vitest.setup.mts                # Setup файл
├── libs/
│   ├── common/
│   │   ├── src/
│   │   │   └── models/
│   │   │       └── __tests__/          # Тесты моделей
│   │   ├── vitest.config.ts            # Конфиг Vitest
│   │   └── vitest.setup.mts            # Setup файл
│   └── ui/
│       ├── src/
│       │   ├── hooks/__tests__/        # Тесты хуков
│       │   └── components/
│       │       └── ErrorBoundary/
│       │           └── ErrorBoundary.test.tsx
│       ├── vitest.config.ts
│       └── vitest.setup.mts
└── packages/
    └── todo/
        └── src/
            └── __tests__/              # Тесты модуля
```

> **Соглашение**: Тесты размещаются в папке `__tests__/` рядом с тестируемым кодом или непосредственно рядом с файлом с суффиксом `.test.ts(x)` / `.spec.ts(x)`.

---

## Конфигурация Vitest

### Конфигурация для библиотеки

```typescript
// libs/<lib>/vitest.config.ts
/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.mts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
  },
});
```

### Setup файл

```typescript
// vitest.setup.mts
import 'reflect-metadata';
import '@testing-library/jest-dom';
import { vi, beforeEach } from 'vitest';
import 'vitest-canvas-mock';

// Для глобального доступа к vi в тестах
global.vi = vi;

beforeEach(() => {
  process.env.NODE_ENV = 'test';
});
```

### Опции конфигурации

| Опция                  | Описание                                      |
| ---------------------- | --------------------------------------------- |
| `globals: true`        | Делает `describe`, `it`, `expect` глобальными |
| `environment: 'jsdom'` | Эмуляция DOM для тестов                       |
| `setupFiles`           | Файлы, выполняемые перед каждым тестом        |
| `include`              | Паттерн для поиска тестовых файлов            |

---

## Написание тестов

### Базовый тест

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { MyService } from './MyService';

describe('MyService', () => {
  let service: MyService;

  beforeEach(() => {
    service = new MyService();
  });

  it('должен выполнять действие', () => {
    const result = service.doSomething();
    expect(result).toBe('expected');
  });
});
```

### Тест с моками

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { APIClient } from '../APIClient';
import MockAdapter from 'axios-mock-adapter';

describe('APIClient', () => {
  let client: APIClient;
  let mock: MockAdapter;

  beforeEach(() => {
    client = new APIClient('http://example.com');
    mock = new MockAdapter(client.api);
  });

  afterEach(() => {
    mock.reset();
  });

  it('должен выполнять GET запрос', async () => {
    const responseData = { data: 'test' };
    mock.onGet('/users').reply(200, responseData);

    const result = await client.request({
      method: 'GET',
      route: '/users',
    });

    expect(result).toEqual(responseData);
  });

  it('должен обрабатывать ошибки', async () => {
    mock.onGet('/users').reply(500);

    await expect(
      client.request({ method: 'GET', route: '/users' }),
    ).rejects.toThrow();
  });
});
```

### Тест React-компонента

```typescript
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MyComponent } from './MyComponent';

describe('MyComponent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('должен отображать контент', () => {
    render(<MyComponent title="Test" />);

    expect(screen.getByText('Test')).toBeInTheDocument();
  });

  test('должен обрабатывать клик', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();

    render(<MyComponent onClick={onClick} />);

    await user.click(screen.getByRole('button'));

    expect(onClick).toHaveBeenCalled();
  });

  test('должен обновлять состояние', async () => {
    render(<MyComponent />);

    await userEvent.type(screen.getByRole('textbox'), 'hello');

    await waitFor(() => {
      expect(screen.getByDisplayValue('hello')).toBeInTheDocument();
    });
  });
});
```

### Тест с DI-контейнером

```typescript
import { describe, test, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useVM } from '../useVM';
import { DIProvider } from '../../providers/DIProvider';

const mockContainer: any = {
  get: (token: string) => token,
};

describe('useVM', () => {
  test('должен выбрасывать ошибку без DIContext', () => {
    expect(() => {
      renderHook(() => useVM('someVM'));
    }).toThrow('DI Container context not initialized');
  });

  test('должен возвращать ViewModel', () => {
    const wrapper = ({ children }: any) => (
      <DIProvider container={mockContainer}>{children}</DIProvider>
    );

    const { result } = renderHook(() => useVM('someVM'), { wrapper });

    expect(result.current).toBe('someVM');
  });
});
```

### Тест модели MobX

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { AccessControlModel } from '../accessControl.model';

describe('AccessControlModel', () => {
  let model: AccessControlModel;

  beforeEach(() => {
    model = new AccessControlModel();
  });

  describe('setFeatureFlags', () => {
    it('должен устанавливать флаги', () => {
      const flags = { flag1: true, flag2: false };

      model.setFeatureFlags(flags);

      expect(model.allFeatureFlags).toEqual(flags);
    });

    it('должен перезаписывать существующие флаги', () => {
      model.setFeatureFlags({ flag1: true });
      model.setFeatureFlags({ flag2: false });

      expect(model.allFeatureFlags).toEqual({ flag2: false });
    });
  });

  describe('getFeatureFlag', () => {
    it('должен возвращать true для включённого флага', () => {
      model.setFeatureFlags({ 'test.flag': true });

      expect(model.getFeatureFlag('test.flag')).toBe(true);
    });

    it('должен возвращать false для несуществующего флага', () => {
      expect(model.getFeatureFlag('unknown')).toBe(false);
    });
  });
});
```

### Тест обработчика bootstrap

```typescript
import { type Bootstrap } from '../../index';
import { DIHandler } from '../DIHandler';

describe('DIHandler', () => {
  const bootstrapMock: Bootstrap = {
    initDI: vi.fn(),
  } as any;

  test('должен вызывать initDI', async () => {
    const handler = new DIHandler({});

    await handler.handle(bootstrapMock);

    expect(bootstrapMock.initDI).toBeCalled();
  });
});
```

---

## Мокирование

### Мокирование модулей

```typescript
// Мокаем весь модуль
vi.mock('@platform/core', () => ({
  log: {
    error: vi.fn(),
    info: vi.fn(),
  },
}));

// Мокаем частично
vi.mock('./utils', async () => {
  const actual = await vi.importActual('./utils');
  return {
    ...actual,
    specificFunction: vi.fn(),
  };
});
```

### Мокирование функций

```typescript
// Создание мока
const mockFn = vi.fn();

// Мок с возвращаемым значением
const mockFn = vi.fn().mockReturnValue('result');

// Мок с промисом
const mockFn = vi.fn().mockResolvedValue({ data: 'test' });

// Мок с реализацией
const mockFn = vi.fn().mockImplementation((arg) => arg * 2);

// Проверка вызовов
expect(mockFn).toHaveBeenCalled();
expect(mockFn).toHaveBeenCalledWith('arg');
expect(mockFn).toHaveBeenCalledTimes(2);
```

### Мокирование axios

```typescript
import MockAdapter from 'axios-mock-adapter';

const mock = new MockAdapter(axiosInstance);

// GET запрос
mock.onGet('/users').reply(200, { users: [] });

// POST с проверкой body
mock.onPost('/users', { name: 'John' }).reply(201, { id: 1 });

// Ошибка
mock.onGet('/error').reply(500, { message: 'Server error' });

// Сброс после теста
afterEach(() => mock.reset());
```

### Мокирование window

```typescript
// Мокирование location.reload
const reloadSpy = vi.fn();
Object.defineProperty(window, 'location', {
  value: { ...window.location, reload: reloadSpy },
  writable: true,
});

// Мокирование localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });
```

---

## Запуск тестов

### npm-скрипты

| Команда                                  | Описание                    |
| ---------------------------------------- | --------------------------- |
| `npm run test`                           | Запуск всех тестов          |
| `npm run test:host`                      | Тесты host-приложения       |
| `npm run test:lib -- --name=<lib>`       | Тесты конкретной библиотеки |
| `npm run test:libs`                      | Тесты всех библиотек        |
| `npm run test:module -- --name=<module>` | Тесты конкретного модуля    |
| `npm run test:modules`                   | Тесты всех модулей          |

### Параметры скриптов

```bash
# Режим наблюдения (watch mode)
npm run test:lib -- --name=common --watch

# UI режим
npm run test:lib -- --name=common --ui

# С покрытием кода
npm run test:lib -- --name=common --coverage

# Подробный вывод
npm run test:lib -- --name=common --verbose

# Несколько библиотек
npm run test:lib -- --name=common --name=core

# Через переменную окружения
MODULES=common,core npm run test:lib

# Параллельный запуск всех
npm run test:libs -- --parallel
```

### Фильтрация тестов

```bash
# Запуск конкретного файла
npx vitest run src/models/__tests__/myModel.test.ts

# Фильтр по имени теста
npx vitest run -t "должен возвращать"

# Запуск только изменённых тестов
npx vitest --changed
```

---

## Покрытие кода

### Генерация отчёта

```bash
npm run test:lib -- --name=common --coverage
```

### Конфигурация coverage

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      exclude: ['node_modules/', '**/*.test.ts', '**/*.spec.ts', '**/index.ts'],
    },
  },
});
```

---

## Testing Library

### Основные запросы

```typescript
// По тексту
screen.getByText('Submit');
screen.queryByText('Optional'); // null если нет
screen.findByText('Async'); // Promise

// По роли
screen.getByRole('button', { name: 'Submit' });
screen.getByRole('textbox');
screen.getByRole('heading', { level: 1 });

// По label
screen.getByLabelText('Email');

// По placeholder
screen.getByPlaceholderText('Enter name');

// По test-id
screen.getByTestId('submit-btn');
```

### Взаимодействие с userEvent

```typescript
import userEvent from '@testing-library/user-event';

const user = userEvent.setup();

// Клик
await user.click(element);

// Ввод текста
await user.type(input, 'hello');

// Очистка и ввод
await user.clear(input);
await user.type(input, 'new value');

// Выбор из select
await user.selectOptions(select, 'option-value');

// Keyboard events
await user.keyboard('{Enter}');
await user.keyboard('{Shift>}A{/Shift}'); // Shift+A
```

### Асинхронные проверки

```typescript
// waitFor — ожидание условия
await waitFor(() => {
  expect(screen.getByText('Loaded')).toBeInTheDocument();
});

// waitFor с таймаутом
await waitFor(() => expect(callback).toHaveBeenCalled(), { timeout: 3000 });

// findBy* — комбинация getBy + waitFor
const element = await screen.findByText('Async content');
```

---

## Утилиты тестирования

### Подавление ошибок в консоли

```typescript
beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});
```

### Тестирование ошибок

```typescript
// Синхронная ошибка
expect(() => throwingFunction()).toThrow('Error message');

// Асинхронная ошибка
await expect(asyncThrowingFunction()).rejects.toThrow('Error');
await expect(promise).rejects.toBeInstanceOf(CustomError);
```

### Снапшот тестирование

```typescript
test('соответствует снапшоту', () => {
  const { container } = render(<MyComponent />);
  expect(container).toMatchSnapshot();
});

// Inline snapshot
test('inline snapshot', () => {
  expect(result).toMatchInlineSnapshot(`
    Object {
      "key": "value",
    }
  `);
});
```

---

## Best Practices

### Структура теста

```typescript
describe('ComponentName', () => {
  // Setup
  beforeEach(() => {
    // Подготовка перед каждым тестом
  });

  afterEach(() => {
    // Очистка после каждого теста
    vi.clearAllMocks();
  });

  // Группировка по функциональности
  describe('метод или функция', () => {
    test('позитивный сценарий', () => {});
    test('граничный случай', () => {});
    test('обработка ошибки', () => {});
  });
});
```

### Именование тестов

```typescript
// ✅ Правильно — описывает поведение
test('должен возвращать пустой массив для пустого ввода', () => {});
test('должен выбрасывать ошибку при невалидных данных', () => {});

// ❌ Неправильно — описывает реализацию
test('вызывает fetchData', () => {});
test('проверяет массив', () => {});
```

### Изоляция тестов

```typescript
// ✅ Каждый тест независим
beforeEach(() => {
  model = new AccessControlModel(); // Новый экземпляр
});

// ❌ Разделяемое состояние между тестами
const model = new AccessControlModel(); // Опасно!
```

### Тестирование API (Arrange-Act-Assert)

```typescript
test('должен обрабатывать ответ', async () => {
  // Arrange — подготовка
  const expectedData = { id: 1, name: 'Test' };
  mock.onGet('/item').reply(200, expectedData);

  // Act — действие
  const result = await service.getItem();

  // Assert — проверка
  expect(result).toEqual(expectedData);
});
```

---

## Интеграция с IDE

### VS Code

Установите расширение [Vitest](https://marketplace.visualstudio.com/items?itemName=vitest.explorer).

```json
{
  "vitest.enable": true,
  "vitest.commandLine": "npx vitest"
}
```

### WebStorm / IntelliJ IDEA

1. Откройте **Settings → Languages & Frameworks → JavaScript → Testing**
2. Выберите **Vitest** как фреймворк
3. Укажите путь к конфигурации

---

## Связанные разделы

- [Линтинг](./linting.md) — ESLint и проверка кода
- [Лаунчер](./launcher.md) — Локальная разработка
- [Создание модуля](../modules/creating-module.md) — Структура модуля
- [Создание библиотек](../libs/create.md) — Структура библиотеки
