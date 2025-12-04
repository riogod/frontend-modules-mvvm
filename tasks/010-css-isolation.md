# Задача 010: CSS изоляция и стилизация

## Статус: 🟢 Частично реализована (MUI)

## Описание

Обеспечение консистентного UI и изоляции CSS стилей между модулями. Проект использует **MUI (Material UI)** как основной инструмент стилизации через `sx` prop и `styled` компоненты — это CSS-in-JS подход с автоматической изоляцией стилей.

**Текущее состояние:**

- ✅ Модули используют MUI для стилизации (`sx` prop, `styled`)
- ✅ Компоненты MUI проксируются через `@platform/ui` для tree-shaking
- ✅ Темы (светлая/темная) настроены в `libs/ui/src/theme/`
- ⬜ ESLint правило для предотвращения глобальных CSS отсутствует
- ⬜ Утилиты `cn`/`createCx` для работы с классами отсутствуют
- ⬜ CSS переменные для использования вне MUI не настроены

## Зависимости

- **Задача 001**: Реструктуризация проекта (модули в packages/)
- **Задача 002**: Vite конфигурация для модулей

## Что уже реализовано

### Стилизация через MUI

Компоненты модулей используют MUI `sx` prop для стилизации:

```tsx
// packages/todo/src/view/components/TodoItem.tsx
<Card
  sx={{
    p: 1,
    m: 1,
    display: 'flex',
    '&:hover': {
      '& .actionIcon': { opacity: 1 },
    },
  }}
>
```

### Проксирование MUI через @platform/ui

```typescript
// libs/ui/src/index.ts
export {
  Box,
  Container,
  Card,
  Button,
  Typography,
  ThemeProvider,
  createTheme,
  useTheme,
  styled,
  // ... и другие MUI компоненты
} from './mui_proxy';
```

### Темы

```
libs/ui/src/theme/
├── theme.ts        # Базовая тема
├── themeDark.ts    # Темная тема
└── themeLight.ts   # Светлая тема
```

## Подзадачи

### 1. Создание ESLint правила для глобальных стилей

- [ ] Создать директорию `config/eslint-config/rules/`

- [ ] Создать `config/eslint-config/rules/no-global-css.js`:

```javascript
/**
 * ESLint правило: запрет импорта глобальных CSS в MFE модулях
 * Разрешены только CSS Modules (.module.css) и импорты из @platform/ui
 */
module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow global CSS imports in MFE modules',
      category: 'Best Practices',
    },
    messages: {
      noGlobalCss:
        'Global CSS imports are not allowed in modules. Use MUI sx prop, styled components, or CSS Modules instead.',
    },
  },
  create(context) {
    return {
      ImportDeclaration(node) {
        const importPath = node.source.value;

        // Проверяем импорт CSS файлов
        if (
          typeof importPath === 'string' &&
          (importPath.endsWith('.css') || importPath.endsWith('.scss'))
        ) {
          // Разрешаем CSS Modules
          if (importPath.includes('.module.')) {
            return;
          }

          // Разрешаем импорт из @platform/ui
          if (importPath.includes('@platform/ui')) {
            return;
          }

          // Разрешаем импорт из node_modules (библиотеки)
          if (importPath.startsWith('@') || !importPath.startsWith('.')) {
            return;
          }

          context.report({
            node,
            messageId: 'noGlobalCss',
          });
        }
      },
    };
  },
};
```

### 2. Обновление ESLint конфигурации для модулей

- [ ] Обновить `config/eslint-config/base.config.ts`:

```typescript
import type { ESLintConfig } from './types';

/**
 * Базовый конфиг для всех TypeScript проектов
 */
export const baseConfig: ESLintConfig = {
  root: true,
  ignorePatterns: ['**/*'],
  plugins: ['platform'], // Добавить кастомный плагин
  overrides: [
    // ... существующие overrides ...
    {
      // Правило только для packages/ (MFE модули)
      files: ['packages/*/src/**/*.{ts,tsx}'],
      rules: {
        'platform/no-global-css': 'error',
      },
    },
  ],
};
```

- [ ] Создать `config/eslint-config/plugins/platform.js`:

```javascript
const noGlobalCss = require('../rules/no-global-css');

module.exports = {
  rules: {
    'no-global-css': noGlobalCss,
  },
};
```

### 3. Создание утилит для работы с CSS классами

- [ ] Создать `libs/ui/src/utils/classNames.ts`:

```typescript
type ClassValue = string | undefined | null | false | ClassValue[];

/**
 * Утилита для объединения CSS классов
 * Поддерживает условные классы и работу с MUI className prop
 *
 * @example
 * cn('container', isActive && 'active', className)
 * cn(styles.container, isActive && styles.active)
 */
export function cn(...classes: ClassValue[]): string {
  return classes
    .flat()
    .filter((c): c is string => typeof c === 'string' && c.length > 0)
    .join(' ');
}

/**
 * Создает функцию для работы с CSS Modules
 * Полезно при использовании CSS Modules вместе с MUI
 *
 * @example
 * const cx = createCx(styles);
 * <div className={cx('container', { active: isActive })}>
 */
export function createCx(styles: Record<string, string>) {
  return function cx(
    ...args: (string | Record<string, boolean | undefined>)[]
  ): string {
    const classes: string[] = [];

    for (const arg of args) {
      if (typeof arg === 'string') {
        if (styles[arg]) {
          classes.push(styles[arg]);
        }
      } else if (typeof arg === 'object') {
        for (const [key, value] of Object.entries(arg)) {
          if (value && styles[key]) {
            classes.push(styles[key]);
          }
        }
      }
    }

    return classes.join(' ');
  };
}
```

- [ ] Обновить `libs/ui/src/index.ts`:

```typescript
// Utils
export * as merge from './utils/merge';
export { cn, createCx } from './utils/classNames';
```

### 4. Настройка CSS Modules в Vite (для будущего использования)

- [ ] Обновить `config/vite-config/module.config.js` для поддержки CSS Modules:

```javascript
// В функции createModuleConfig добавить:
css: {
  modules: {
    // Генерация уникальных имен классов с префиксом модуля
    generateScopedName: (name, filename) => {
      const modulePart = moduleName.replace(/-/g, '_');
      // В production используем короткий хеш
      if (process.env.NODE_ENV === 'production') {
        const hash = crypto
          .createHash('md5')
          .update(filename + name)
          .digest('base64')
          .substring(0, 5)
          .replace(/[+/=]/g, '_');
        return `${modulePart}_${name}_${hash}`;
      }
      // В dev используем читаемое имя
      return `${modulePart}__${name}`;
    },
    localsConvention: 'camelCase',
  },
},
```

### 5. Создание CSS переменных (опционально)

- [ ] Создать `libs/ui/src/theme/cssVariables.ts`:

```typescript
/**
 * CSS переменные, синхронизированные с MUI темой
 * Используются для стилизации в CSS Modules или нативном CSS
 *
 * Примечание: Для большинства случаев рекомендуется использовать
 * MUI sx prop или styled компоненты вместо CSS переменных
 */
export const cssVariables = {
  // Цвета (синхронизированы с MUI palette)
  '--color-primary': '#00bcd4',
  '--color-primary-light': '#33c9dc',
  '--color-primary-dark': '#008394',
  '--color-secondary': '#ff3d00',
  '--color-secondary-light': '#ff6333',
  '--color-secondary-dark': '#b22a00',

  // Фон
  '--bg-default': '#fafafa',
  '--bg-paper': '#ffffff',

  // Текст
  '--text-primary': 'rgba(0, 0, 0, 0.87)',
  '--text-secondary': 'rgba(0, 0, 0, 0.6)',

  // Отступы (синхронизация с MUI spacing: 8px)
  '--spacing-1': '8px',
  '--spacing-2': '16px',
  '--spacing-3': '24px',
  '--spacing-4': '32px',

  // Радиусы
  '--border-radius': '8px',
};

/**
 * Инжектирует CSS переменные в :root
 * Вызывается при инициализации приложения
 */
export function injectCSSVariables(): void {
  const existingStyle = document.getElementById('platform-css-variables');
  if (existingStyle) return;

  const style = document.createElement('style');
  style.id = 'platform-css-variables';

  const cssText = Object.entries(cssVariables)
    .map(([key, value]) => `${key}: ${value};`)
    .join('\n  ');

  style.textContent = `:root {\n  ${cssText}\n}`;
  document.head.appendChild(style);
}
```

### 6. Документация по стилизации

- [ ] Создать `docs/styling-guide.md`:

````markdown
# Руководство по стилизации

## Основные принципы

Проект использует **MUI (Material UI)** как основной инструмент стилизации.
Это обеспечивает автоматическую изоляцию стилей между модулями.

## Рекомендуемые подходы (в порядке приоритета)

### 1. MUI `sx` prop (рекомендуется)

```tsx
import { Box, Card } from '@platform/ui';

<Card sx={{ p: 2, m: 1, display: 'flex' }}>
  <Box sx={{ flexGrow: 1 }}>Content</Box>
</Card>;
```
````

### 2. MUI `styled` компоненты

```tsx
import { styled, Card } from '@platform/ui';

const StyledCard = styled(Card)(({ theme }) => ({
  padding: theme.spacing(2),
  margin: theme.spacing(1),
  '&:hover': {
    boxShadow: theme.shadows[4],
  },
}));
```

### 3. CSS Modules (для сложных стилей)

```tsx
import styles from './Component.module.css';
import { cn } from '@platform/ui';

<div className={cn(styles.container, isActive && styles.active)}>
```

## Запрещено в MFE модулях

- ❌ Глобальные CSS файлы (ESLint выдаст ошибку)
- ❌ Инлайн `<style>` теги
- ❌ Переопределение MUI стилей глобально

## Переиспользование компонентов

Все UI компоненты импортируются из `@platform/ui`:

```tsx
import { Button, Card, Typography } from '@platform/ui';
```

Не создавайте дубликаты — добавляйте общие компоненты в `libs/ui`.

````

### 7. Тестирование изоляции

- [ ] Проверить отсутствие CSS файлов в packages/:
  ```bash
  find packages -name "*.css" -o -name "*.scss"
````

- [ ] Проверить ESLint правило при добавлении глобального CSS
- [ ] Проверить работу тем (светлая/темная) в модулях

## Definition of Done (DoD)

1. ✅ Модули используют MUI для стилизации (уже реализовано)
2. ⬜ ESLint правило `no-global-css` создано и включено
3. ⬜ Утилиты `cn` и `createCx` созданы в libs/ui
4. ⬜ CSS Modules настроены в module.config.js (для будущего использования)
5. ⬜ Документация по стилизации создана
6. ✅ Нет конфликтов стилей между модулями (MUI обеспечивает)
7. ✅ Тема (светлая/темная) работает во всех модулях

## Архитектура стилизации

```
┌─────────────────────────────────────────────────────────┐
│                    Host Application                      │
│  ┌───────────────────────────────────────────────────┐  │
│  │           ThemeProvider (MUI)                      │  │
│  │  ┌─────────────────┐  ┌─────────────────────────┐ │  │
│  │  │   themeDark.ts  │  │    themeLight.ts        │ │  │
│  │  └─────────────────┘  └─────────────────────────┘ │  │
│  └───────────────────────────────────────────────────┘  │
│                          │                               │
│                          ▼                               │
│  ┌───────────────────────────────────────────────────┐  │
│  │              MFE Modules                           │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌───────────┐  │  │
│  │  │   Todo      │  │ API Example │  │  Other    │  │  │
│  │  │ (sx prop)   │  │ (sx prop)   │  │ (styled)  │  │  │
│  │  └─────────────┘  └─────────────┘  └───────────┘  │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

## Пример структуры компонента

```
packages/todo/src/view/components/
├── TodoItem/
│   ├── index.ts
│   ├── TodoItem.tsx          # Использует MUI sx prop
│   └── TodoItem.module.css   # Опционально, для сложных стилей
```

## Сравнение подходов

| Подход         | Изоляция          | Производительность | Когда использовать              |
| -------------- | ----------------- | ------------------ | ------------------------------- |
| MUI `sx`       | ✅ Автоматическая | ⚡ Отличная        | Простые стили                   |
| MUI `styled`   | ✅ Автоматическая | ⚡ Отличная        | Переиспользуемые стили          |
| CSS Modules    | ✅ По хешу        | ⚡ Отличная        | Сложные анимации, media queries |
| Глобальный CSS | ❌ Нет            | ⚡ Быстрая         | **Запрещено в модулях**         |

## Риски и митигация

| Риск                                 | Вероятность | Влияние | Митигация                          |
| ------------------------------------ | ----------- | ------- | ---------------------------------- |
| Случайное добавление глобального CSS | Низкая      | Среднее | ESLint правило                     |
| Дублирование компонентов             | Низкая      | Низкое  | Code review, документация          |
| Конфликты с MUI стилями              | Низкая      | Среднее | Избегать переопределения глобально |

## Время выполнения

Ожидаемое время: **2-3 часа** (основная работа уже сделана через MUI)

## Примечания

- **MUI — основной инструмент стилизации** — CSS-in-JS с автоматической изоляцией
- CSS Modules настроены как запасной вариант для сложных случаев
- ESLint правило предотвращает случайное добавление глобальных стилей
- Глобальные стили разрешены только в Host (`host/src/main.css`)
- Все UI компоненты должны импортироваться из `@platform/ui`
