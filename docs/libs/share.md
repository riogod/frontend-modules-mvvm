# Share библиотека (@platform/share)

Библиотека общих ресурсов и компонентов, которые используются на уровне приложения.

## Подключение

```typescript
import { ThemeSchema } from '@platform/share';
```

## ThemeSchema

Компонент для подключения темы приложения с автоматической синхронизацией CSS переменных.

### Назначение

- Подключает светлую или тёмную тему MUI в зависимости от настроек пользователя
- Синхронизирует CSS переменные с темой MUI для использования в CSS Modules
- Реактивно переключает тему через MobX

### Использование

```typescript
import { ThemeSchema } from '@platform/share';

const App: FC = () => (
  <ThemeSchema>
    <YourAppContent />
  </ThemeSchema>
);
```

### Как это работает

```typescript
import { type FC, type ReactNode } from 'react';
import { Observer } from 'mobx-react-lite';
import {
  themeDark,
  themeLight,
  ThemeProvider,
  useVM,
  CssVariablesSync,
} from '@platform/ui';
import { IOC_CORE_TOKENS } from '@platform/core';

const ThemeSchema: FC<{ children?: ReactNode }> = ({ children }) => {
  // Получаем ViewModel с настройками UI
  const ui = useVM<UiSettingsViewModel>(IOC_CORE_TOKENS.VIEW_MODEL_UI_SETTINGS);

  return (
    <Observer>
      {() => (
        // Выбираем тему на основе настроек
        <ThemeProvider theme={ui.themeMode === 'dark' ? themeDark : themeLight}>
          {/* Синхронизируем CSS переменные */}
          <CssVariablesSync />
          {children}
        </ThemeProvider>
      )}
    </Observer>
  );
};
```

### Доступные режимы

| Режим   | Описание                                   |
| ------- | ------------------------------------------ |
| `light` | Светлая тема                               |
| `dark`  | Тёмная тема                                |

### Переключение темы

```typescript
import { useVM } from '@platform/ui';
import { IOC_CORE_TOKENS } from '@platform/core';

const ThemeToggle: FC = observer(() => {
  const ui = useVM<UiSettingsViewModel>(IOC_CORE_TOKENS.VIEW_MODEL_UI_SETTINGS);

  const toggleTheme = () => {
    ui.setThemeMode(ui.themeMode === 'dark' ? 'light' : 'dark');
  };

  return (
    <Button onClick={toggleTheme}>
      {ui.themeMode === 'dark' ? 'Светлая тема' : 'Тёмная тема'}
    </Button>
  );
});
```

## CSS переменные

После инициализации `ThemeSchema` доступны CSS переменные MUI темы:

```css
.myComponent {
  background-color: var(--mui-palette-background-paper);
  color: var(--mui-palette-text-primary);
  border: 1px solid var(--mui-palette-divider);
}
```

### Доступные переменные

| Переменная                           | Описание               |
| ------------------------------------ | ---------------------- |
| `--mui-palette-primary-main`         | Основной цвет          |
| `--mui-palette-secondary-main`       | Вторичный цвет         |
| `--mui-palette-background-default`   | Фон приложения         |
| `--mui-palette-background-paper`     | Фон карточек           |
| `--mui-palette-text-primary`         | Основной текст         |
| `--mui-palette-text-secondary`       | Вторичный текст        |
| `--mui-palette-divider`              | Разделители            |
| `--mui-palette-error-main`           | Цвет ошибок            |
| `--mui-palette-warning-main`         | Цвет предупреждений    |
| `--mui-palette-success-main`         | Цвет успеха            |

## Связанные разделы

- [UI библиотека](./ui.md)
- [UI Провайдеры](../bootstrap/ui-providers.md)

