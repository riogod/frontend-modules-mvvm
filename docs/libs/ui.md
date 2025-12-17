# UI библиотека (@platform/ui)

Библиотека React компонентов, хуков и провайдеров для построения UI.

## Подключение

```typescript
import {
  useVM,
  useSharedComponent,
  DIProvider,
  ThemeProvider,
  themeDark,
  themeLight,
} from '@platform/ui';
```

## Хуки

### useVM

Хук для получения зависимостей из DI контейнера.

```typescript
import { useVM } from '@platform/ui';
import type { MyViewModel } from '../viewmodels/my.vm';
import { MY_DI_TOKENS } from '../config/di.tokens';

const MyComponent: FC = () => {
  const viewModel = useVM<MyViewModel>(MY_DI_TOKENS.VIEW_MODEL);

  return <div>{viewModel.data}</div>;
};
```

### useSharedComponent

Хук для получения shared UI-компонентов из DI контейнера между модулями.

```typescript
import { useSharedComponent } from '@platform/ui';
import { Suspense } from 'react';

const MyPage: FC = () => {
  const SharedButton = useSharedComponent<ButtonProps>('SharedButtonComponent', {
    moduleName: 'shared-ui',
    fallback: <button>Fallback</button>,
  });

  return (
    <Suspense fallback={<div>Загрузка...</div>}>
      {SharedButton && <SharedButton onClick={handleClick} />}
    </Suspense>
  );
};
```

#### Опции useSharedComponent

| Опция               | Тип         | По умолчанию | Описание                             |
| ------------------- | ----------- | ------------ | ------------------------------------ |
| `moduleName`        | `string`    | -            | Имя модуля для диагностики ошибок    |
| `fallback`          | `ReactNode` | -            | Fallback компонент, если не найден   |
| `suppressErrors`    | `boolean`   | `true`       | Подавлять ошибки и возвращать null   |
| `validateComponent` | `boolean`   | `true`       | Валидировать что это React компонент |

## Провайдеры

### DIProvider

Провайдер DI контейнера для React-дерева.

```typescript
import { DIProvider } from '@platform/ui';

const App: FC = () => (
  <DIProvider container={bootstrap.di}>
    <MyComponent />
  </DIProvider>
);
```

### ThemeProvider

Провайдер темы Material UI.

```typescript
import { ThemeProvider, themeDark, themeLight } from '@platform/ui';

const App: FC = () => (
  <ThemeProvider theme={isDark ? themeDark : themeLight}>
    <MyComponent />
  </ThemeProvider>
);
```

## Темы

### Доступные темы

| Тема         | Описание     |
| ------------ | ------------ |
| `themeLight` | Светлая тема |
| `themeDark`  | Тёмная тема  |
| `theme`      | Базовая тема |

### CssVariablesSync

Компонент для синхронизации CSS переменных с темой MUI.

```typescript
import { CssVariablesSync } from '@platform/ui';

const App: FC = () => (
  <ThemeProvider theme={themeLight}>
    <CssVariablesSync />
    <MyComponent />
  </ThemeProvider>
);
```

### Создание кастомной темы

```typescript
import { createTheme } from '@platform/ui';

const customTheme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
  },
});
```

## Компоненты

### ErrorBoundary

Компонент для перехвата ошибок в React-дереве.

```typescript
import { ErrorBoundary } from '@platform/ui';

const App: FC = () => (
  <ErrorBoundary fallback={<div>Что-то пошло не так</div>}>
    <MyComponent />
  </ErrorBoundary>
);
```

### IconButton

Кастомный компонент кнопки с иконкой.

```typescript
import { IconButton } from '@platform/ui';
import { DeleteIcon } from '@platform/ui';

const MyComponent: FC = () => (
  <IconButton onClick={handleDelete}>
    <DeleteIcon />
  </IconButton>
);
```

## MUI компоненты

Библиотека переэкспортирует компоненты Material UI:

```typescript
import {
  Box,
  Container,
  Grid,
  Stack,
  Paper,
  TextField,
  Button,
  Typography,
  Card,
  CardContent,
  Dialog,
  Alert,
  Snackbar,
  // ... и многие другие
} from '@platform/ui';
```

### Список компонентов

**Layout:** Box, Container, Grid, Stack, Paper

**Inputs:** TextField, Button, Checkbox, Radio, Switch, Slider, Select, Autocomplete

**Navigation:** AppBar, Toolbar, Drawer, Menu, MenuItem, Tabs, Tab, Breadcrumbs, Link

**Feedback:** Alert, Snackbar, Dialog, CircularProgress, LinearProgress, Skeleton

**Data Display:** Typography, Card, Avatar, Chip, Badge, Divider, List, Table, Tooltip

**Transitions:** Collapse, Fade, Grow, Slide, Zoom

## MUI иконки

```typescript
import { DeleteIcon, EditIcon, AddIcon } from '@platform/ui';
```

## Утилиты

### merge

Утилита для глубокого слияния объектов:

```typescript
import { merge } from '@platform/ui';

const result = merge.deepMerge(obj1, obj2);
```

### styled

Утилита styled-components от MUI:

```typescript
import { styled } from '@platform/ui';

const StyledBox = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  backgroundColor: theme.palette.background.paper,
}));
```

## Контексты

### DIContext

Контекст для доступа к DI контейнеру:

```typescript
import { DIContext } from '@platform/ui';
import { useContext } from 'react';

const container = useContext(DIContext);
```

### setGlobalDIContainer

Установка глобального DI контейнера (fallback для remote модулей):

```typescript
import { setGlobalDIContainer } from '@platform/ui';

setGlobalDIContainer(container);
```

## Связанные разделы

- [Core библиотека](./core.md)
- [Share библиотека](./share.md)
- [MVVM паттерн](../modules/mvvm-pattern.md)
- [UI Провайдеры](../bootstrap/ui-providers.md)
