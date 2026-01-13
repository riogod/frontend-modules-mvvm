import { type FC } from 'react';
import { DocSection, DocCodeBlock, DocList, DocNote } from '../../common';

/**
 * Секция документации по Storybook - инструменту для разработки
 * и документирования UI компонентов.
 *
 * @component
 */
export const StorybookSection: FC = () => (
  <DocSection title="Storybook">
    <DocSection title="Запуск Storybook">
      <DocCodeBlock
        code={`# Запустить Storybook (порт 6006)
npm run storybook

# Собрать Storybook
npm run build-storybook

# Запустить Storybook с конкретным модулем
npm run storybook -- --only-modules=todo`}
        language="bash"
      />
    </DocSection>

    <DocSection title="Создание Story">
      <p>Создайте `.stories.tsx` файл рядом с компонентом:</p>

      <DocCodeBlock
        code={`import type { Meta, StoryObj } from '@storybook/react';
import { TodoCard } from './TodoCard';

const meta: Meta<typeof TodoCard> = {
  title: 'Todo/TodoCard',
  component: TodoCard,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Карточка задачи с описанием и статусом.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof TodoCard>;

export const Default: Story = {
  args: {
    title: 'My Todo',
    description: 'This is a todo item',
    completed: false,
  },
};

export const Completed: Story = {
  args: {
    title: 'Completed Todo',
    description: 'This todo is completed',
    completed: true,
  },
};

export const LongDescription: Story = {
  args: {
    title: 'Long Todo',
    description: 'This is a very long description that wraps to multiple lines.',
    completed: false,
  },
};`}
        language="typescript"
      />
    </DocSection>

    <DocSection title="Meta и Parameters">
      <DocCodeBlock
        code={`const meta: Meta<typeof Component> = {
  title: 'Module/Component',
  component: Component,
  parameters: {
    layout: 'centered', // 'centered' | 'fullscreen' | 'padded'
    docs: {
      description: {
        component: 'Описание компонента',
      },
    },
  },
  tags: ['autodocs'],
};

// ArgTypes для controls
export const WithControls: Story = {
  argTypes: {
    title: {
      control: 'text',
      description: 'Заголовок',
    },
    completed: {
      control: 'boolean',
      description: 'Статус выполнения',
    },
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'tertiary'],
      description: 'Вариант компонента',
    },
    count: {
      control: {
        type: 'range',
        min: 0,
        max: 100,
        step: 1,
      },
      description: 'Количество',
    },
    color: {
      control: 'color',
      description: 'Цвет',
    },
  },
};`}
        language="typescript"
      />

      <DocList
        items={[
          'text - текстовое поле',
          'boolean - переключатель',
          'number - число',
          'select - выбор из списка',
          'radio - радиокнопки',
          'color - выбор цвета',
          'range - слайдер',
        ]}
      />
    </DocSection>

    <DocSection title="Decorators">
      <p>Декораторы для обертки компонентов:</p>

      <DocCodeBlock
        code={`import { ThemeProvider } from '@mui/material';

const meta: Meta = {
  component: MyComponent,
  decorators: [
    (Story) => (
      <ThemeProvider theme={theme}>
        <Story />
      </ThemeProvider>
    ),
    (Story) => (
      <div style={{ padding: 32 }}>
        <Story />
      </div>
    ),
  ],
};`}
        language="typescript"
      />
    </DocSection>

    <DocSection title="MDX Documentation">
      <p>Создавайте `.stories.mdx` файлы для документации:</p>

      <DocCodeBlock
        code={`import { Meta, Canvas, Controls, Story } from '@storybook/addon-docs/blocks';

<Meta title="Todo/TodoCard" />

# TodoCard

Карточка задачи с описанием и статусом.

## Examples

<Canvas>
  <Story id="todo-todocard--default" />
</Canvas>

## Controls

<Controls of="todo-todocard--default" />

## API

| Prop | Type | Default |
|------|------|---------|
| title | string | - |
| description | string | - |
| completed | boolean | false |`}
        language="markdown"
      />
    </DocSection>

    <DocSection title="Theme Toggle">
      <p>Переключение темы в Storybook:</p>

      <DocCodeBlock
        code={`// .storybook/preview.ts
import type { Preview } from '@storybook/react';
import { withThemeByDataAttribute } from '@storybook/addon-themes';

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
    },
    backgrounds: {
      default: 'light',
      values: [
        { name: 'light', value: '#ffffff' },
        { name: 'dark', value: '#1a1a1a' },
      ],
    },
  },
  globalTypes: {
    theme: {
      name: 'Theme',
      description: 'Global theme for components',
      toolbar: {
        title: 'Theme',
        icon: 'circlehollow',
        items: [
          { value: 'light', title: 'light' },
          { value: 'dark', title: 'dark' },
        ],
        dynamicTitle: true,
      },
    },
  },
  decorators: [
    withThemeByDataAttribute({
      themes: {
        light: 'light',
        dark: 'dark',
      },
      defaultTheme: 'light',
      attributeName: 'data-theme',
    }),
  ],
};

export default preview;`}
        language="typescript"
      />
    </DocSection>

    <DocSection title="Addons">
      <p>Установленные аддоны:</p>

      <DocList
        items={[
          '@storybook/addon-docs - документация (autodocs)',
          '@storybook/addon-a11y - проверка доступности',
          '@storybook/addon-themes - переключение тем',
          '@storybook/addon-controls - управление параметрами',
          '@storybook/addon-actions - отслеживание событий',
        ]}
      />
    </DocSection>

    <DocNote type="info" title="Best Practices">
      <DocList
        items={[
          'Используйте понятные имена для stories',
          'Покрывайте все варианты компонента',
          'Добавляйте stories для разных размеров, состояний и edge cases',
          'Пишите описания на русском языке',
          'Используйте автодокументацию (tags: ["autodocs"])',
        ]}
      />
    </DocNote>
  </DocSection>
);
