import { type FC } from 'react';
import { DocSection, DocCodeBlock, DocList, DocNote } from '../../common';

export const UiLibrarySection: FC = () => (
  <DocSection title="UI Library">
    <DocSection title="useVM">
      <p>Хук для получения ViewModel из DI контейнера.</p>
      <DocCodeBlock
        code={`import { useVM } from '@platform/ui';
import { TODO_DI_TOKENS } from '../config/di.tokens';
import type { TodoListViewModel } from '../viewmodels/todo_list.vm';

const TodoPage = observer(() => {
  const viewModel = useVM<TodoListViewModel>(
    TODO_DI_TOKENS.VIEW_MODEL_TODO_LIST,
  );

  return <div>{viewModel.items.map((item) => <div key={item.id}>{item.description}</div>)}</div>;
});`}
        language="typescript"
      />
      <DocList
        items={[
          '✅ Получает ViewModel из DI',
          '✅ Автоматически создает инстанс',
          '✅ Поддерживает TypeScript generics',
        ]}
      />
    </DocSection>
    <DocSection title="useSharedComponent">
      <p>Хук для получения shared компонентов из других модулей.</p>
      <DocCodeBlock
        code={`import { useSharedComponent } from '@platform/ui';

const OrderPage = observer(() => {
  // Получить компонент из другого модуля
  const SharedCard = useSharedComponent('Catalog.SharedCard', {
    fallback: <div>Loading...</div>,
    required: false, // Не выбрасывать ошибку, если модуль не загружен
  });

  if (!SharedCard) {
    return null; // Модуль не загружен или компонент не найден
  }

  return <SharedCard />;
});`}
        language="typescript"
      />
      <DocList
        items={[
          '✅ Получает компоненты из DI',
          '✅ Поддерживает fallback UI',
          '✅ Опциональная загрузка',
        ]}
      />
    </DocSection>
    <DocSection title="Providers">
      <p>React провайдеры для DI и темы.</p>
      <DocCodeBlock
        code={`import { DIProvider, ThemeProvider } from '@platform/ui';

<DIProvider>
  <ThemeProvider>
    <App />
  </ThemeProvider>
</DIProvider>`}
        language="typescript"
      />
      <DocList
        items={[
          'DIProvider - провайдер DI контейнера',
          'ThemeProvider - провайдер темы MUI',
        ]}
      />
    </DocSection>
    <DocSection title="Components">
      <p>MUI компоненты, реэкспортированные из @platform/ui:</p>
      <DocCodeBlock
        code={`import {
  Box,
  Container,
  Grid,
  Stack,
  Paper,
  TextField,
  Button,
  Typography,
  Card,
  Dialog,
  Alert,
  Snackbar,
  IconButton,
} from '@platform/ui';`}
        language="typescript"
      />
    </DocSection>
    <DocSection title="Themes">
      <p>Преднастроенные темы и утилиты для работы с темами.</p>
      <DocCodeBlock
        code={`import {
  themeLight,
  themeDark,
  theme,
  CssVariablesSync,
  createTheme,
} from '@platform/ui';

// Использование тем
const myTheme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
  },
});

// Синхронизация CSS переменных
<CssVariablesSync />
`}
        language="typescript"
      />
    </DocSection>
    <DocSection title="Utils">
      <p>Утилиты для работы с темами и стилями.</p>
      <DocCodeBlock
        code={`import { merge, styled } from '@platform/ui';

// Объединение тем
const mergedTheme = merge(themeLight, customTheme);

// Создание стилизованного компонента
const StyledButton = styled(Button)((theme) => ({
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.primary.contrastText,
  padding: theme.spacing(2),
  '&:hover': {
    backgroundColor: theme.palette.primary.dark,
  },
}));`}
        language="typescript"
      />
    </DocSection>
    <DocSection title="ErrorBoundary">
      <p>Компонент для перехвата ошибок в дереве React.</p>
      <DocCodeBlock
        code={`import { ErrorBoundary } from '@platform/ui';

<ErrorBoundary fallback={<div>Something went wrong</div>}>
  <MyComponent />
</ErrorBoundary>`}
        language="typescript"
      />
    </DocSection>
    <DocNote type="info" title="Рекомендация">
      Используйте компоненты из @platform/ui, а не напрямую из @mui/material.
      Это обеспечивает единый стиль и упрощает миграцию.
    </DocNote>
  </DocSection>
);
