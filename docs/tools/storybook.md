# Storybook

Проект использует **Storybook 9** для разработки и документирования UI-компонентов в изоляции.

---

## Быстрый старт

```bash
# Запуск Storybook в режиме разработки
npm run storybook

# Сборка статического Storybook
npm run build-storybook
```

После запуска Storybook будет доступен по адресу: http://localhost:6006

---

## Структура

```
libs/ui/
├── .storybook/
│   ├── main.ts          # Основная конфигурация
│   └── preview.tsx      # Глобальные декораторы и параметры
└── src/
    ├── components/
    │   └── ui/
    │       └── IconButton/
    │           ├── IconButton.tsx
    │           └── IconButton.stories.tsx    # Stories
    └── hooks/
        └── useSharedComponent/
            ├── useSharedComponent.tsx
            ├── useSharedComponent.stories.tsx
            └── useSharedComponent.mdx        # MDX документация
```

> **Соглашение**: Файлы stories размещаются рядом с компонентом с суффиксом `.stories.tsx`.

---

## Написание Stories

### Базовый пример

```typescript
// IconButton.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { IconButton } from './IconButton';
import DeleteIcon from '@mui/icons-material/Delete';

const meta = {
  title: 'Components/IconButton',
  component: IconButton,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'], // Автогенерация документации
} satisfies Meta<typeof IconButton>;

export default meta;
type Story = StoryObj<typeof meta>;

// Базовый вариант
export const Primary: Story = {
  args: {
    children: <DeleteIcon />,
    color: 'primary',
    size: 'medium',
    disabled: false,
  },
};

// Дополнительные варианты
export const Secondary: Story = {
  args: {
    children: <DeleteIcon />,
    color: 'secondary',
    size: 'medium',
  },
};

export const Small: Story = {
  args: {
    children: <DeleteIcon />,
    size: 'small',
  },
};

export const Disabled: Story = {
  args: {
    children: <DeleteIcon />,
    disabled: true,
  },
};
```

### Story с render функцией

```typescript
import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { ErrorBoundary } from './ErrorBoundary';
import { Box, Button, Typography } from '@mui/material';

// Компонент, который выбрасывает ошибку
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Тестовая ошибка');
  }
  return <Typography>Компонент работает нормально</Typography>;
};

const meta = {
  title: 'Components/ErrorBoundary',
  component: ErrorBoundary,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Компонент для перехвата и обработки ошибок в React.',
      },
    },
  },
  argTypes: {
    children: {
      control: false,
      description: 'Дочерние компоненты',
    },
    fallback: {
      control: false,
      description: 'Кастомный fallback UI',
    },
    logPrefix: {
      control: 'text',
      description: 'Префикс для логирования',
    },
    showReloadButton: {
      control: 'boolean',
      description: 'Показывать кнопку перезагрузки',
    },
  },
} satisfies Meta<typeof ErrorBoundary>;

export default meta;
type Story = StoryObj<typeof meta>;

// Story без args, с render функцией
type StoryWithRender = Omit<Story, 'args'>;

export const Default: StoryWithRender = {
  render: () => {
    const [shouldThrow, setShouldThrow] = useState(false);

    return (
      <Box sx={{ p: 3 }}>
        <Button
          variant="contained"
          color="error"
          onClick={() => setShouldThrow(true)}
          sx={{ mb: 2 }}
        >
          Вызвать ошибку
        </Button>
        <ErrorBoundary>
          <ThrowError shouldThrow={shouldThrow} />
        </ErrorBoundary>
      </Box>
    );
  },
};
```

---

## MDX документация

MDX файлы позволяют создавать богатую документацию с интерактивными примерами.

### Пример MDX файла

````mdx
{/* ErrorBoundary.mdx */}
import { Meta, Canvas, Controls, ArgTypes } from '@storybook/addon-docs/blocks';
import { ErrorBoundary } from './ErrorBoundary';
import \* as ErrorBoundaryStories from './ErrorBoundary.stories';

<Meta of={ErrorBoundaryStories} />

# ErrorBoundary

Компонент для перехвата и обработки ошибок в React-компонентах.

## Основные возможности

- ✅ Автоматический перехват ошибок
- ✅ Логирование через Logger
- ✅ Настраиваемый fallback UI
- ✅ Callback функция для обработки ошибок

## API Reference

<ArgTypes of={ErrorBoundaryStories.Default} />

| Prop               | Тип                                   | По умолчанию      | Описание                       |
| ------------------ | ------------------------------------- | ----------------- | ------------------------------ |
| `children`         | `ReactNode`                           | —                 | Дочерние компоненты            |
| `fallback`         | `ReactNode \| (error: Error) => Node` | —                 | Кастомный fallback UI          |
| `logPrefix`        | `string`                              | `'ErrorBoundary'` | Префикс для логирования        |
| `showReloadButton` | `boolean`                             | `true`            | Показывать кнопку перезагрузки |

## Примеры

### Базовое использование

```tsx
import { ErrorBoundary } from '@platform/ui';

function App() {
  return (
    <ErrorBoundary>
      <YourComponent />
    </ErrorBoundary>
  );
}
```
````

### С кастомным fallback

```tsx
<ErrorBoundary
  fallback={(error) => (
    <div>
      <h2>Ошибка</h2>
      <p>{error.message}</p>
    </div>
  )}
>
  <YourComponent />
</ErrorBoundary>
```

````

---

## Организация stories

### Структура title

```typescript
// Компоненты UI
title: 'Components/Button'
title: 'Components/IconButton'
title: 'Components/ErrorBoundary'

// Хуки
title: 'Hooks/useSharedComponent'
title: 'Hooks/useVM'

// Утилиты
title: 'Utils/ErrorBoundary'

// По модулям
title: 'Todo/Components/TodoList'
title: 'Todo/Hooks/useTodoVM'
````

### Группировка stories

```typescript
const meta = {
  title: 'Components/Button',
  component: Button,
} satisfies Meta<typeof Button>;

// Варианты
export const Primary: Story = { args: { variant: 'primary' } };
export const Secondary: Story = { args: { variant: 'secondary' } };

// Состояния
export const Disabled: Story = { args: { disabled: true } };
export const Loading: Story = { args: { loading: true } };

// Размеры
export const Small: Story = { args: { size: 'small' } };
export const Large: Story = { args: { size: 'large' } };
```

---

## Декораторы

### Глобальные декораторы

Определяются в `preview.tsx` и применяются ко всем stories:

```typescript
decorators: [
  (Story, context) => (
    <ThemeWrapper theme={context.globals?.theme || 'light'}>
      <Story />
    </ThemeWrapper>
  ),
];
```

### Декораторы для story

```typescript
export const WithWrapper: Story = {
  decorators: [
    (Story) => (
      <Box sx={{ padding: 4, backgroundColor: 'grey.100' }}>
        <Story />
      </Box>
    ),
  ],
};
```

### Декораторы для meta

```typescript
const meta = {
  title: 'Components/Button',
  component: Button,
  decorators: [
    (Story) => (
      <Box sx={{ p: 2 }}>
        <Story />
      </Box>
    ),
  ],
} satisfies Meta<typeof Button>;
```

---

## Параметры

### Layout

```typescript
parameters: {
  layout: 'centered',  // По центру
  layout: 'padded',    // С отступами
  layout: 'fullscreen' // На весь экран
}
```

### Docs

```typescript
parameters: {
  docs: {
    description: {
      component: 'Описание компонента',
      story: 'Описание конкретной story',
    },
  },
}
```

---

## Аддоны

### Установленные аддоны

| Аддон                   | Описание                   |
| ----------------------- | -------------------------- |
| `@storybook/addon-docs` | Автогенерация документации |
| `@storybook/addon-a11y` | Проверка доступности       |

### addon-docs

Автоматически генерирует документацию из JSDoc комментариев и типов TypeScript:

```typescript
interface ButtonProps {
  /** Текст кнопки */
  children: React.ReactNode;
  /** Вариант стиля */
  variant?: 'primary' | 'secondary';
  /** Размер кнопки */
  size?: 'small' | 'medium' | 'large';
  /** Отключена ли кнопка */
  disabled?: boolean;
}
```

### addon-a11y

Проверяет компоненты на соответствие стандартам доступности (WCAG).

---

## argTypes

### Управление controls

```typescript
argTypes: {
  // Скрыть control
  children: { control: false },

  // Текстовый input
  title: { control: 'text' },

  // Boolean checkbox
  disabled: { control: 'boolean' },

  // Number input
  count: { control: { type: 'number', min: 0, max: 10 } },

  // Select
  variant: {
    control: 'select',
    options: ['primary', 'secondary', 'tertiary'],
  },

  // Radio
  size: {
    control: 'radio',
    options: ['small', 'medium', 'large'],
  },

  // Color picker
  color: { control: 'color' },

  // Описание
  onClick: {
    control: false,
    description: 'Callback при клике',
    table: {
      type: { summary: '() => void' },
    },
  },
}
```

---

## Тема

### Переключение темы

Тема переключается через toolbar в Storybook. Глобальный параметр `theme` доступен в декораторах:

```typescript
globalTypes: {
  theme: {
    description: 'Global theme for components',
    defaultValue: 'light',
    toolbar: {
      title: 'Theme',
      icon: 'circlehollow',
      items: ['light', 'dark'],
      dynamicTitle: true,
    },
  },
},
```

### Использование в декораторе

```typescript
decorators: [
  (Story, context) => {
    const theme = context.globals?.theme || 'light';
    const muiTheme = theme === 'dark' ? themeDark : themeLight;

    return (
      <ThemeProvider theme={muiTheme}>
        <CssBaseline />
        <Story />
      </ThemeProvider>
    );
  },
],
```

---

## Best Practices

### Структура story файла

```typescript
// 1. Импорты
import type { Meta, StoryObj } from '@storybook/react';
import { MyComponent } from './MyComponent';

// 2. Meta конфигурация
const meta = {
  title: 'Components/MyComponent',
  component: MyComponent,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  argTypes: {
    /* ... */
  },
} satisfies Meta<typeof MyComponent>;

export default meta;
type Story = StoryObj<typeof meta>;

// 3. Stories в порядке важности
export const Default: Story = {
  args: {
    /* ... */
  },
};
export const Variant: Story = {
  args: {
    /* ... */
  },
};
export const WithState: Story = {
  render: () => {
    /* ... */
  },
};
```

### Именование

```typescript
// ✅ Правильно — понятные имена
export const Primary: Story = {};
export const Disabled: Story = {};
export const WithLongText: Story = {};
export const Loading: Story = {};

// ❌ Неправильно — непонятные имена
export const Test1: Story = {};
export const Example: Story = {};
```

### Покрытие вариантов

Создавайте stories для:

- Основного состояния (Default)
- Всех вариантов (Primary, Secondary)
- Всех размеров (Small, Medium, Large)
- Всех состояний (Disabled, Loading, Error)
- Граничных случаев (Empty, WithLongText)

---

## Команды

| Команда                   | Описание                         |
| ------------------------- | -------------------------------- |
| `npm run storybook`       | Запуск dev-сервера на порту 6006 |
| `npm run build-storybook` | Сборка статического Storybook    |

---

## Связанные разделы

- [UI библиотека](../libs/ui.md) — Компоненты @platform/ui
- [Тестирование](./testing.md) — Vitest и тестирование
- [Линтинг](./linting.md) — ESLint и проверка кода
- [Создание библиотек](../libs/create.md) — Структура библиотеки
