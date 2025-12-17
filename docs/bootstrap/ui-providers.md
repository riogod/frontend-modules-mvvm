# UI Провайдеры

UI провайдеры — это React компоненты, которые транслируют контексты всем дочерним компонентам приложения. Они оборачивают корневой компонент и предоставляют доступ к DI-контейнеру, роутеру, i18n и теме.

## Иерархия провайдеров

```
┌─────────────────────────────────────────────────────────┐
│                   RouterProvider                        │
│  ┌───────────────────────────────────────────────────┐  │
│  │                  DIProvider                       │  │
│  │  ┌─────────────────────────────────────────────┐  │  │
│  │  │              I18nextProvider                │  │  │
│  │  │  ┌───────────────────────────────────────┐  │  │  │
│  │  │  │             ThemeSchema               │  │  │  │
│  │  │  │  ┌─────────────────────────────────┐  │  │  │  │
│  │  │  │  │           Приложение            │  │  │  │  │
│  │  │  │  └─────────────────────────────────┘  │  │  │  │
│  │  │  └───────────────────────────────────────┘  │  │  │
│  │  └─────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

## Код инициализации

```typescript
// host/src/main.tsx
import { RouterProvider } from '@riogz/react-router';
import { DIProvider } from '@platform/ui';
import { I18nextProvider } from 'react-i18next';
import { ThemeSchema } from '@platform/share';

<RouterProvider router={bootstrap.routerService.router}>
  <DIProvider container={bootstrap.di}>
    <I18nextProvider i18n={bootstrap.i18n}>
      <ThemeSchema>
        {/* Приложение */}
      </ThemeSchema>
    </I18nextProvider>
  </DIProvider>
</RouterProvider>
```

## RouterProvider

Предоставляет доступ к роутеру `@riogz/router`.

```typescript
import { RouterProvider } from '@riogz/react-router';

<RouterProvider router={bootstrap.routerService.router}>
  {/* Приложение */}
</RouterProvider>
```

**Что дает:**

- Навигация между маршрутами
- Доступ к параметрам URL
- Автозагрузка модулей при переходе

## DIProvider

Предоставляет доступ к DI-контейнеру Inversify.

```typescript
import { DIProvider } from '@platform/ui';

<DIProvider container={bootstrap.di}>
  {/* Приложение */}
</DIProvider>
```

**Что дает:**

- Доступ к ViewModels и сервисам через `useVM`
- Единый контейнер для всего приложения

**Использование в компонентах:**

```typescript
import { useVM } from '@platform/ui';
import { IOC_TOKENS } from '../config/ioc';

const MyComponent = () => {
  // Получаем ViewModel из DI-контейнера
  const viewModel = useVM<MyViewModel>(IOC_TOKENS.MY_VIEW_MODEL);

  return <div>{viewModel.data}</div>;
};
```

## I18nextProvider

Предоставляет доступ к i18next для интернационализации.

```typescript
import { I18nextProvider } from 'react-i18next';

<I18nextProvider i18n={bootstrap.i18n}>
  {/* Приложение */}
</I18nextProvider>
```

**Что дает:**

- Переводы через `useTranslation`
- Автоматическое определение языка
- Загрузка переводов из модулей

**Использование в компонентах:**

```typescript
import { useTranslation } from 'react-i18next';

const MyComponent = () => {
  const { t } = useTranslation('my-module');

  return <div>{t('greeting')}</div>;
};
```

## ThemeSchema

Предоставляет тему MUI (light/dark) и синхронизирует CSS переменные.

```typescript
import { ThemeSchema } from '@platform/share';

<ThemeSchema>
  {/* Приложение */}
</ThemeSchema>
```

**Что дает:**

- Переключение light/dark темы
- MUI компоненты с правильными цветами
- CSS переменные для использования в CSS Modules

**Как работает:**

```typescript
// ThemeSchema использует UiSettingsViewModel для определения темы
const ThemeSchema = ({ children }) => {
  const ui = useVM<UiSettingsViewModel>(IOC_CORE_TOKENS.VIEW_MODEL_UI_SETTINGS);

  return (
    <Observer>
      {() => (
        <ThemeProvider theme={ui.themeMode === 'dark' ? themeDark : themeLight}>
          <CssVariablesSync />
          {children}
        </ThemeProvider>
      )}
    </Observer>
  );
};
```

**CSS переменные:**

После `CssVariablesSync` вы можете использовать CSS переменные:

```css
.myComponent {
  background-color: var(--mui-palette-background-paper);
  color: var(--mui-palette-text-primary);
}
```

## Порядок провайдеров

Порядок важен! Провайдеры могут зависеть друг от друга:

| Порядок | Провайдер       | Зависит от                    |
| ------- | --------------- | ----------------------------- |
| 1       | RouterProvider  | —                             |
| 2       | DIProvider      | —                             |
| 3       | I18nextProvider | —                             |
| 4       | ThemeSchema     | DIProvider (использует useVM) |

> `ThemeSchema` должен быть внутри `DIProvider`, так как использует `useVM` для получения `UiSettingsViewModel`.

## Использование в модулях

Модули автоматически получают доступ ко всем контекстам:

```typescript
// В любом компоненте модуля
import { useVM } from '@platform/ui';
import { useTranslation } from 'react-i18next';

const ModuleComponent = () => {
  // DI-контейнер доступен
  const vm = useVM<MyViewModel>(IOC_TOKENS.MY_VM);

  // i18n доступен
  const { t } = useTranslation('my-module');

  // Тема применена автоматически
  return <Button>{t('action')}</Button>;
};
```

## Добавление своего провайдера

### 1. Создайте контекст и провайдер

```typescript
// libs/ui/src/contexts/MyFeatureContext.ts
import { createContext, useContext } from 'react';

interface MyFeatureContextValue {
  someData: string;
  doSomething: () => void;
}

export const MyFeatureContext = createContext<MyFeatureContextValue | null>(
  null,
);

// Хук для использования контекста
export function useMyFeature(): MyFeatureContextValue {
  const context = useContext(MyFeatureContext);
  if (!context) {
    throw new Error('useMyFeature must be used within MyFeatureProvider');
  }
  return context;
}
```

```typescript
// libs/ui/src/providers/MyFeatureProvider.tsx
import { type FC, type PropsWithChildren, useMemo } from 'react';
import { MyFeatureContext } from '../contexts/MyFeatureContext';

interface MyFeatureProviderProps {
  initialData?: string;
}

export const MyFeatureProvider: FC<PropsWithChildren<MyFeatureProviderProps>> = ({
  children,
  initialData = '',
}) => {
  const value = useMemo(
    () => ({
      someData: initialData,
      doSomething: () => {
        console.log('Doing something');
      },
    }),
    [initialData],
  );

  return (
    <MyFeatureContext.Provider value={value}>
      {children}
    </MyFeatureContext.Provider>
  );
};
```

### 2. Экспортируйте из библиотеки

```typescript
// libs/ui/src/index.ts
export { MyFeatureProvider } from './providers/MyFeatureProvider';
export { useMyFeature } from './contexts/MyFeatureContext';
```

### 3. Добавьте в иерархию провайдеров

```typescript
// host/src/main.tsx
import { MyFeatureProvider } from '@platform/ui';

<RouterProvider router={bootstrap.routerService.router}>
  <DIProvider container={bootstrap.di}>
    <I18nextProvider i18n={bootstrap.i18n}>
      <ThemeSchema>
        <MyFeatureProvider initialData="some value">
          {/* Приложение */}
        </MyFeatureProvider>
      </ThemeSchema>
    </I18nextProvider>
  </DIProvider>
</RouterProvider>
```

### 4. Используйте в компонентах

```typescript
import { useMyFeature } from '@platform/ui';

const MyComponent = () => {
  const { someData, doSomething } = useMyFeature();

  return (
    <button onClick={doSomething}>
      {someData}
    </button>
  );
};
```

### Правила размещения

| Если провайдер использует... | Разместите после...   |
| ---------------------------- | --------------------- |
| `useVM` (DI-контейнер)       | `DIProvider`          |
| `useTranslation` (i18n)      | `I18nextProvider`     |
| `useTheme` (MUI тема)        | `ThemeSchema`         |
| Ничего из вышеперечисленного | В любом месте цепочки |

### Провайдер с доступом к DI

Если провайдеру нужен доступ к DI-контейнеру:

```typescript
import { useVM } from '@platform/ui';
import { IOC_CORE_TOKENS } from '@platform/core';

export const AnalyticsProvider: FC<PropsWithChildren> = ({ children }) => {
  // Получаем сервис из DI
  const apiClient = useVM<APIClient>(IOC_CORE_TOKENS.API_CLIENT);

  const value = useMemo(
    () => ({
      track: (event: string) => {
        apiClient.post('/analytics', { event });
      },
    }),
    [apiClient],
  );

  return (
    <AnalyticsContext.Provider value={value}>
      {children}
    </AnalyticsContext.Provider>
  );
};
```

Такой провайдер должен быть внутри `DIProvider`.
