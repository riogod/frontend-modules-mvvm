# CSS-in-JS vs CSS Modules

В платформе поддерживаются оба подхода к стилизации компонентов. Выбор зависит от контекста использования.

## Обзор подходов

| Подход          | Когда использовать                        | Примеры                 |
| --------------- | ----------------------------------------- | ----------------------- |
| **MUI sx prop** | Быстрая стилизация MUI компонентов        | `<Box sx={{ p: 2 }}>`   |
| **styled()**    | Переиспользуемые стилизованные компоненты | `styled(AppBar)({...})` |
| **CSS Modules** | Сложные стили, анимации, медиа-запросы    | `styles.container`      |

## CSS-in-JS (Emotion + MUI)

### sx prop

Самый быстрый способ стилизации MUI компонентов:

```tsx
import { Box, Typography, Button } from '@platform/ui';

export const MyComponent: FC = () => (
  <Box
    sx={{
      p: 2,
      display: 'flex',
      gap: 2,
      bgcolor: 'background.paper',
    }}
  >
    <Typography sx={{ color: 'text.primary' }}>Текст</Typography>
    <Button sx={{ mt: 'auto' }}>Кнопка</Button>
  </Box>
);
```

**Преимущества:**

- Доступ к теме через сокращения (`p`, `mt`, `bgcolor`)
- Автодополнение в IDE
- Типизация из коробки

### styled()

Для создания переиспользуемых стилизованных компонентов в соответствии с концепциями MUI:

```tsx
import { styled, AppBar } from '@platform/ui';

export const AppBarStyled = styled(AppBar)(() => ({
  boxShadow: 'none',
  backdropFilter: 'blur(8px)',
}));

// С доступом к теме
export const StyledCard = styled('div')(({ theme }) => ({
  padding: theme.spacing(2),
  borderRadius: theme.shape.borderRadius,
  backgroundColor: theme.palette.background.paper,
}));
```

**Когда использовать:**

- Компонент используется в нескольких местах
- Нужна кастомизация базового MUI компонента
- Требуется доступ к теме

## CSS Modules

### Базовое использование

Создайте файл с расширением `.module.css`:

```css
/* MyComponent.module.css */
.container {
  padding: var(--spacing-md);
  border: 1px solid var(--mui-palette-divider);
  border-radius: var(--mui-shape-border-radius);
}

.title {
  color: var(--mui-palette-primary-main);
  font-size: 18px;
}

.content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}
```

Импортируйте стили в компонент:

```tsx
import { type FC } from 'react';
import { Box, Typography } from '@platform/ui';
import styles from './MyComponent.module.css';

export const MyComponent: FC = () => (
  <Box className={styles.container}>
    <Typography className={styles.title}>Заголовок</Typography>
    <div className={styles.content}>Контент</div>
  </Box>
);
```

### CSS переменные

CSS переменные из темы MUI доступны глобально через `@platform/ui`:

```css
.element {
  /* Цвета из темы */
  color: var(--mui-palette-primary-main);
  background: var(--mui-palette-background-paper);
  border-color: var(--mui-palette-divider);

  /* Скругления */
  border-radius: var(--mui-shape-border-radius);

  /* Отступы */
  padding: var(--spacing-md);
  margin: var(--spacing-sm);
}
```

**Доступные переменные:**

| Переменная                         | Описание                |
| ---------------------------------- | ----------------------- |
| `--mui-palette-primary-main`       | Основной цвет темы      |
| `--mui-palette-primary-light`      | Светлый вариант primary |
| `--mui-palette-primary-dark`       | Темный вариант primary  |
| `--mui-palette-secondary-main`     | Вторичный цвет          |
| `--mui-palette-background-default` | Фон по умолчанию        |
| `--mui-palette-background-paper`   | Фон карточек            |
| `--mui-palette-text-primary`       | Основной цвет текста    |
| `--mui-palette-text-secondary`     | Вторичный цвет текста   |
| `--mui-palette-divider`            | Цвет разделителей       |
| `--mui-shape-border-radius`        | Скругление углов        |
| `--spacing-xs`                     | 4px                     |
| `--spacing-sm`                     | 8px                     |
| `--spacing-md`                     | 16px                    |
| `--spacing-lg`                     | 24px                    |
| `--spacing-xl`                     | 32px                    |

### Изоляция стилей в модулях

Платформа автоматически добавляет префикс модуля к классам CSS Modules:

```
Development: todo__container
Production:  todo_container_abc12
```

Это обеспечивается конфигурацией Vite:

```javascript
css: {
  modules: {
    generateScopedName: (name, filename) => {
      if (isProduction) {
        return `${modulePart}_${name}_${hash}`;
      }
      return `${modulePart}__${name}`;
    },
    localsConvention: 'camelCase',
  },
}
```

### Медиа-запросы и анимации

CSS Modules отлично подходят для сложных стилей:

```css
.container {
  padding: var(--spacing-md);
}

@media (max-width: 600px) {
  .container {
    padding: var(--spacing-sm);
  }
}

.fadeIn {
  animation: fadeIn 0.3s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

## Правило ESLint: no-global-css

В MFE модулях **запрещен** импорт глобальных CSS файлов. Это обеспечивает изоляцию стилей между модулями.

**Разрешено:**

- CSS Modules (`.module.css`)
- Импорты из `@platform/ui`
- Импорты из `node_modules`

**Запрещено:**

- Глобальные CSS файлы (`./styles.css`)

```typescript
// ❌ Запрещено
import './global-styles.css';

// ✅ Разрешено
import styles from './Component.module.css';
import '@platform/ui/theme/variables.css';
```

## Типизация CSS Modules

Для TypeScript добавьте декларацию в `vite-env.d.ts`:

```typescript
/// <reference types="vite/client" />

declare module '*.module.css' {
  const classes: { [key: string]: string };
  export default classes;
}
```

## Рекомендации по выбору

### Используйте sx prop когда

- Стилизуете единичный MUI компонент
- Нужны простые стили (отступы, цвета, размеры)
- Важна скорость разработки

### Используйте styled() когда

- Создаете переиспользуемый компонент
- Кастомизируете MUI компонент для проекта
- Нужен доступ к теме в стилях

### Используйте CSS Modules когда

- Пишете сложные стили (animations, pseudo-elements)
- Нужны медиа-запросы
- Стилизуете не-MUI элементы
- Команда привыкла к классическому CSS

## Примеры комбинирования

Подходы можно комбинировать в одном компоненте:

```tsx
import { type FC } from 'react';
import { Box, Typography, styled } from '@platform/ui';
import styles from './Card.module.css';

const StyledBox = styled(Box)(({ theme }) => ({
  transition: theme.transitions.create('box-shadow'),
}));

export const Card: FC = () => (
  <StyledBox className={styles.card} sx={{ p: 2 }}>
    <Typography variant="h6" className={styles.title} sx={{ mb: 1 }}>
      Заголовок
    </Typography>
    <div className={styles.content}>Контент карточки</div>
  </StyledBox>
);
```

## Синхронизация темы

CSS переменные автоматически синхронизируются с темой MUI через компонент `CssVariablesSync`:

```tsx
// Автоматически включен в ThemeSchema
import { CssVariablesSync } from '@platform/ui';

// При изменении темы переменные обновляются
<ThemeProvider theme={theme}>
  <CssVariablesSync />
  {children}
</ThemeProvider>;
```

Это позволяет CSS Modules реагировать на смену светлой/темной темы.

## Лучшие практики

1. **Не смешивайте подходы без необходимости** — выберите основной для компонента
2. **Используйте CSS переменные** — они обеспечивают консистентность с темой
3. **Избегайте глобальных стилей** — только в `host/src/main.css`
4. **Именуйте классы по BEM-подобной схеме** — `.container`, `.container__title`
5. **Группируйте стили по компоненту** — один `.module.css` на компонент
