import type { Meta, StoryObj } from '@storybook/react';
import { ErrorBoundary } from './ErrorBoundary';
import { Box, Typography, Button } from '@mui/material';
import { useState } from 'react';

// Компонент, который выбрасывает ошибку
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Тестовая ошибка для демонстрации ErrorBoundary');
  }
  return <Typography>Компонент работает нормально</Typography>;
};

// Компонент с кнопкой для вызова ошибки
const ErrorTrigger = () => {
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
};

// Кастомный fallback компонент
const CustomFallback = ({ error }: { error: Error }) => (
  <Box
    sx={{
      p: 3,
      border: '2px dashed',
      borderColor: 'error.main',
      borderRadius: 2,
      textAlign: 'center',
    }}
  >
    <Typography variant="h5" color="error" gutterBottom>
      Ой! Что-то пошло не так
    </Typography>
    <Typography variant="body2" color="text.secondary">
      {error.message}
    </Typography>
  </Box>
);

const meta = {
  title: 'Components/ErrorBoundary',
  component: ErrorBoundary,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'ErrorBoundary компонент для перехвата и обработки ошибок в React компонентах. Автоматически логирует ошибки в Logger и отображает fallback UI.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    children: {
      control: false,
      description: 'Дочерние компоненты, которые будут обернуты ErrorBoundary',
    },
    fallback: {
      control: false,
      description: 'Кастомный fallback UI компонент',
    },
    logPrefix: {
      control: 'text',
      description: 'Префикс для логирования ошибок',
    },
    onError: {
      control: false,
      description: 'Callback функция, вызываемая при ошибке',
    },
    showReloadButton: {
      control: 'boolean',
      description: 'Показывать ли кнопку для перезагрузки страницы',
    },
  },
} satisfies Meta<typeof ErrorBoundary>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Базовый пример использования ErrorBoundary с компонентом, который выбрасывает ошибку
 */
export const Default: Story = {
  render: () => <ErrorTrigger />,
};

/**
 * Пример с кастомным fallback компонентом
 */
export const CustomFallbackComponent: Story = {
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
        <ErrorBoundary
          fallback={(error) => <CustomFallback error={error} />}
        >
          <ThrowError shouldThrow={shouldThrow} />
        </ErrorBoundary>
      </Box>
    );
  },
};

/**
 * Пример с кастомным префиксом для логирования
 */
export const CustomLogPrefix: Story = {
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
          Вызвать ошибку (смотрите консоль)
        </Button>
        <ErrorBoundary logPrefix="MyApp.ErrorBoundary">
          <ThrowError shouldThrow={shouldThrow} />
        </ErrorBoundary>
      </Box>
    );
  },
};

/**
 * Пример с callback функцией onError
 */
export const WithOnErrorCallback: Story = {
  render: () => {
    const [shouldThrow, setShouldThrow] = useState(false);
    const [errorLog, setErrorLog] = useState<string[]>([]);

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
        {errorLog.length > 0 && (
          <Box sx={{ mb: 2, p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
            <Typography variant="subtitle2" gutterBottom>
              Ошибки зафиксированы:
            </Typography>
            {errorLog.map((log, index) => (
              <Typography key={index} variant="body2">
                {log}
              </Typography>
            ))}
          </Box>
        )}
        <ErrorBoundary
          onError={(error) => {
            setErrorLog((prev) => [...prev, `Ошибка: ${error.message} в ${new Date().toLocaleTimeString()}`]);
          }}
        >
          <ThrowError shouldThrow={shouldThrow} />
        </ErrorBoundary>
      </Box>
    );
  },
};

/**
 * Пример без кнопки перезагрузки страницы
 */
export const WithoutReloadButton: Story = {
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
        <ErrorBoundary showReloadButton={false}>
          <ThrowError shouldThrow={shouldThrow} />
        </ErrorBoundary>
      </Box>
    );
  },
};

/**
 * Пример с нормально работающим компонентом (без ошибок)
 */
export const WithoutError: Story = {
  render: () => (
    <ErrorBoundary>
      <Box sx={{ p: 3, bgcolor: 'success.light', borderRadius: 1 }}>
        <Typography variant="h6" color="success.dark">
          Компонент работает нормально
        </Typography>
        <Typography variant="body2" sx={{ mt: 1 }}>
          ErrorBoundary не отображается, так как ошибок нет
        </Typography>
      </Box>
    </ErrorBoundary>
  ),
};

