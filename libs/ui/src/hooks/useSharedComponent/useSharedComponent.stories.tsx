import type { Meta, StoryObj } from '@storybook/react';
import { lazy, Suspense, type ComponentType } from 'react';
import { Container } from 'inversify';
import { Box, Typography, Paper, Divider, Alert } from '@mui/material';
import { useSharedComponent } from './useSharedComponent';
import { DIProvider } from '../../providers/DIProvider';
import { ErrorBoundary } from '../../components/utils/ErrorBoundary/ErrorBoundary';

// Мок компоненты для демонстрации
const MockSharedComponent: ComponentType = () => (
  <Paper sx={{ p: 2, bgcolor: 'success.light' }}>
    <Typography variant="h6" color="success.dark">
      ✅ Компонент успешно загружен из DI контейнера
    </Typography>
    <Typography variant="body2" sx={{ mt: 1 }}>
      Это компонент, который был получен через useSharedComponent
    </Typography>
  </Paper>
);

const LazyMockComponent = lazy(() =>
  Promise.resolve({ default: MockSharedComponent }),
);

// Fallback компонент
const FallbackComponent: ComponentType = () => (
  <Alert severity="warning" sx={{ mt: 2 }}>
    Компонент недоступен. Используется fallback компонент.
  </Alert>
);

// Создаем DI контейнер с привязанным компонентом
const createContainerWithComponent = (hasComponent: boolean = true) => {
  const container = new Container();
  if (hasComponent) {
    container.bind('TestComponent').toConstantValue(MockSharedComponent);
    container.bind('LazyTestComponent').toConstantValue(LazyMockComponent);
  }
  return container;
};

// Компонент-обертка для демонстрации хука
const HookDemo = ({
  containerKey,
  hasComponent = true,
  fallback,
  moduleName,
  suppressErrors = true,
}: {
  containerKey: string;
  hasComponent?: boolean;
  fallback?: ComponentType;
  moduleName?: string;
  suppressErrors?: boolean;
}) => {
  const SharedComponent = useSharedComponent(containerKey, {
    fallback,
    moduleName,
    suppressErrors,
  });

  return (
    <Box sx={{ p: 3 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Демонстрация useSharedComponent
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Container Key: <code>{containerKey}</code>
        </Typography>
        {moduleName && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Module: <code>{moduleName}</code>
          </Typography>
        )}
        <Divider sx={{ my: 2 }} />
        <Suspense fallback={<Typography>Загрузка компонента...</Typography>}>
          {SharedComponent ? (
            <SharedComponent />
          ) : (
            <Alert severity="info">
              Компонент не найден. Хук вернул <code>null</code>.
            </Alert>
          )}
        </Suspense>
      </Paper>
    </Box>
  );
};

// Компонент без DI контейнера
const HookDemoWithoutContainer = ({
  containerKey,
  fallback,
}: {
  containerKey: string;
  fallback?: ComponentType;
}) => {
  const SharedComponent = useSharedComponent(containerKey, { fallback });

  return (
    <Box sx={{ p: 3 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Демонстрация без DI контейнера
        </Typography>
        <Alert severity="warning" sx={{ mb: 2 }}>
          DI контейнер не инициализирован
        </Alert>
        <Suspense fallback={<Typography>Загрузка...</Typography>}>
          {SharedComponent ? (
            <SharedComponent />
          ) : (
            <Alert severity="info">
              Хук вернул <code>null</code> (контейнер недоступен)
            </Alert>
          )}
        </Suspense>
      </Paper>
    </Box>
  );
};

const meta = {
  title: 'Hooks/useSharedComponent',
  component: HookDemo,
  parameters: {
    layout: 'padded',
  },
} satisfies Meta<typeof HookDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Базовый пример использования хука с компонентом, который найден в контейнере
 */
export const WithComponent: Story = {
  render: () => {
    const container = createContainerWithComponent(true);
    return (
      <DIProvider container={container}>
        <HookDemo containerKey="TestComponent" hasComponent={true} />
      </DIProvider>
    );
  },
};

/**
 * Пример с lazy компонентом
 */
export const WithLazyComponent: Story = {
  render: () => {
    const container = createContainerWithComponent(true);
    return (
      <DIProvider container={container}>
        <HookDemo containerKey="LazyTestComponent" hasComponent={true} />
      </DIProvider>
    );
  },
};

/**
 * Пример с fallback компонентом, когда компонент не найден
 */
export const WithFallback: Story = {
  render: () => {
    const container = createContainerWithComponent(false);
    return (
      <DIProvider container={container}>
        <HookDemo
          containerKey="NonExistentComponent"
          hasComponent={false}
          fallback={FallbackComponent}
          suppressErrors={true}
        />
      </DIProvider>
    );
  },
};

/**
 * Пример без fallback - хук вернет null
 */
export const WithoutFallback: Story = {
  render: () => {
    const container = createContainerWithComponent(false);
    return (
      <DIProvider container={container}>
        <HookDemo
          containerKey="NonExistentComponent"
          hasComponent={false}
          suppressErrors={true}
        />
      </DIProvider>
    );
  },
};

/**
 * Пример с указанием moduleName для диагностики
 */
export const WithModuleName: Story = {
  render: () => {
    const container = createContainerWithComponent(false);
    return (
      <DIProvider container={container}>
        <HookDemo
          containerKey="NonExistentComponent"
          hasComponent={false}
          moduleName="example-module"
          fallback={FallbackComponent}
          suppressErrors={true}
        />
      </DIProvider>
    );
  },
};

/**
 * Пример без DI контейнера (контейнер не инициализирован)
 */
export const WithoutContainer: Story = {
  render: () => {
    return (
      <HookDemoWithoutContainer
        containerKey="TestComponent"
        fallback={FallbackComponent}
      />
    );
  },
};

/**
 * Пример с suppressErrors: false (строгая проверка)
 * ⚠️ Внимание: этот пример выбросит ошибку, которая будет перехвачена ErrorBoundary
 */
export const StrictMode: Story = {
  render: () => {
    const container = createContainerWithComponent(false);
    return (
      <DIProvider container={container}>
        <Box sx={{ p: 3 }}>
          <Alert severity="warning" sx={{ mb: 2 }}>
            В этом примере suppressErrors: false, поэтому при отсутствии
            компонента будет выброшена ошибка, которая будет перехвачена
            ErrorBoundary.
          </Alert>
          <ErrorBoundary
            logPrefix="useSharedComponent.story"
            fallback={(error) => (
              <Alert severity="error" sx={{ mt: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Ошибка (ожидаемо для демонстрации)
                </Typography>
                <Typography variant="body2">{error.message}</Typography>
              </Alert>
            )}
          >
            <HookDemo
              containerKey="NonExistentComponent"
              hasComponent={false}
              suppressErrors={false}
            />
          </ErrorBoundary>
        </Box>
      </DIProvider>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          '⚠️ Этот пример демонстрирует поведение хука с suppressErrors: false. ' +
          'При отсутствии компонента будет выброшена ошибка, которая перехватывается ErrorBoundary. ' +
          'Используйте этот режим только для строгой проверки в тестах.',
      },
    },
  },
};
