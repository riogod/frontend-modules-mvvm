import { Component, type ReactNode, type ErrorInfo } from 'react';
import { Box, Typography, Button, Alert, AlertTitle } from '@mui/material';
import { log } from '@platform/core';

export interface ErrorBoundaryProps {
  /**
   * Дочерние компоненты, которые будут обернуты ErrorBoundary
   */
  children: ReactNode;
  /**
   * Кастомный fallback UI компонент, который будет показан при ошибке
   */
  fallback?: ReactNode | ((error: Error, errorInfo: ErrorInfo) => ReactNode);
  /**
   * Префикс для логирования ошибок
   */
  logPrefix?: string;
  /**
   * Callback функция, которая будет вызвана при возникновении ошибки
   */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  /**
   * Показывать ли кнопку для перезагрузки страницы
   */
  showReloadButton?: boolean;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * ErrorBoundary компонент для перехвата и обработки ошибок в React компонентах
 *
 * @example
 * ```tsx
 * <ErrorBoundary>
 *   <YourComponent />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    const { logPrefix = 'ErrorBoundary', onError } = this.props;

    // Логируем ошибку в Logger
    log.error(
      `React Error Boundary caught an error: ${error.message}`,
      { prefix: logPrefix },
      {
        error,
        errorInfo,
        componentStack: errorInfo.componentStack,
        errorStack: error.stack,
      },
    );

    // Сохраняем информацию об ошибке в state
    this.setState({
      error,
      errorInfo,
    });

    // Вызываем пользовательский callback, если он предоставлен
    if (onError) {
      onError(error, errorInfo);
    }
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleReload = (): void => {
    window.location.reload();
  };

  render(): ReactNode {
    const { hasError, error, errorInfo } = this.state;
    const { children, fallback, showReloadButton = true } = this.props;

    if (hasError && error) {
      // Если предоставлен кастомный fallback
      if (fallback) {
        if (typeof fallback === 'function') {
          return fallback(error, errorInfo!);
        }
        return fallback;
      }

      // Дефолтный fallback UI
      return (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '400px',
            padding: 3,
          }}
        >
          <Alert severity="error" sx={{ maxWidth: 600, width: '100%', mb: 2 }}>
            <AlertTitle>Произошла ошибка</AlertTitle>
            <Typography variant="body1" sx={{ mb: 1 }}>
              {error.message || 'Неизвестная ошибка'}
            </Typography>
            {typeof process !== 'undefined' &&
              process.env.NODE_ENV === 'development' &&
              errorInfo && (
                <Box sx={{ mt: 2 }}>
                  <Typography
                    variant="caption"
                    component="pre"
                    sx={{ fontSize: '0.75rem', overflow: 'auto' }}
                  >
                    {errorInfo.componentStack}
                  </Typography>
                </Box>
              )}
          </Alert>
          <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
            <Button
              variant="contained"
              color="primary"
              onClick={this.handleReset}
            >
              Попробовать снова
            </Button>
            {showReloadButton && (
              <Button
                variant="outlined"
                color="secondary"
                onClick={this.handleReload}
              >
                Перезагрузить страницу
              </Button>
            )}
          </Box>
        </Box>
      );
    }

    return children;
  }
}
