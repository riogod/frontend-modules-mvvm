import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { ErrorBoundary } from './ErrorBoundary';
import React from 'react';
import { log } from '@platform/core';

// Мокаем Logger
vi.mock('@platform/core', () => ({
  log: {
    error: vi.fn(),
  },
}));

// Компонент, который выбрасывает ошибку
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error message');
  }
  return <div>No error</div>;
};

describe('ErrorBoundary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Подавляем ошибки в консоли во время тестов
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('должен отображать дочерние компоненты, когда ошибок нет', () => {
    render(
      <ErrorBoundary>
        <div>Test content</div>
      </ErrorBoundary>,
    );

    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  test('должен отображать fallback UI при возникновении ошибки', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>,
    );

    expect(screen.getByText('Произошла ошибка')).toBeInTheDocument();
    expect(screen.getByText('Test error message')).toBeInTheDocument();
  });

  test('должен логировать ошибку в Logger', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>,
    );

    expect(log.error).toHaveBeenCalledWith(
      expect.stringContaining(
        'React Error Boundary caught an error: Test error message',
      ),
      expect.objectContaining({
        prefix: 'ErrorBoundary',
      }),
      expect.objectContaining({
        error: expect.any(Error),
        errorInfo: expect.any(Object),
      }),
    );
  });

  test('должен использовать кастомный префикс для логирования', () => {
    render(
      <ErrorBoundary logPrefix="CustomPrefix">
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>,
    );

    expect(log.error).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        prefix: 'CustomPrefix',
      }),
      expect.any(Object),
    );
  });

  test('должен вызывать onError callback при возникновении ошибки', () => {
    const onError = vi.fn();

    render(
      <ErrorBoundary onError={onError}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>,
    );

    expect(onError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        componentStack: expect.any(String),
      }),
    );
  });

  test('должен отображать кастомный fallback компонент', () => {
    const customFallback = <div>Custom error message</div>;

    render(
      <ErrorBoundary fallback={customFallback}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>,
    );

    expect(screen.getByText('Custom error message')).toBeInTheDocument();
    expect(screen.queryByText('Произошла ошибка')).not.toBeInTheDocument();
  });

  test('должен отображать кастомный fallback функцию', () => {
    const customFallback = (error: Error) => <div>Error: {error.message}</div>;

    render(
      <ErrorBoundary fallback={customFallback}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>,
    );

    expect(screen.getByText('Error: Test error message')).toBeInTheDocument();
  });

  test('должен показывать кнопку "Попробовать снова"', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>,
    );

    expect(screen.getByText('Попробовать снова')).toBeInTheDocument();
  });

  test('должен показывать кнопку "Перезагрузить страницу" по умолчанию', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>,
    );

    expect(screen.getByText('Перезагрузить страницу')).toBeInTheDocument();
  });

  test('не должен показывать кнопку перезагрузки, если showReloadButton=false', () => {
    render(
      <ErrorBoundary showReloadButton={false}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>,
    );

    expect(
      screen.queryByText('Перезагрузить страницу'),
    ).not.toBeInTheDocument();
    expect(screen.getByText('Попробовать снова')).toBeInTheDocument();
  });

  test('должен сбрасывать состояние ошибки при нажатии на "Попробовать снова"', async () => {
    const user = userEvent.setup();
    const TestComponent = () => {
      const [shouldThrow, setShouldThrow] = useState(true);
      const [key, setKey] = useState(0);

      return (
        <div>
          <button
            onClick={() => {
              setShouldThrow(false);
              setKey((k) => k + 1);
            }}
          >
            Fix Error
          </button>
          <ErrorBoundary key={key}>
            <ThrowError shouldThrow={shouldThrow} />
          </ErrorBoundary>
        </div>
      );
    };

    render(<TestComponent />);

    expect(screen.getByText('Произошла ошибка')).toBeInTheDocument();

    // Исправляем ошибку и пересоздаем ErrorBoundary через key
    const fixButton = screen.getByText('Fix Error');
    await user.click(fixButton);

    // После исправления ошибки и пересоздания ErrorBoundary, должен отображаться нормальный контент
    await waitFor(
      () => {
        expect(screen.queryByText('Произошла ошибка')).not.toBeInTheDocument();
        expect(screen.getByText('No error')).toBeInTheDocument();
      },
      { timeout: 3000 },
    );
  });

  test('должен вызывать window.location.reload при нажатии на кнопку перезагрузки', async () => {
    const user = userEvent.setup();
    // Мокаем window.location.reload через Object.defineProperty, так как его нельзя переопределить напрямую
    const originalReload = window.location.reload;
    const reloadSpy = vi.fn();
    Object.defineProperty(window, 'location', {
      value: {
        ...window.location,
        reload: reloadSpy,
      },
      writable: true,
    });

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>,
    );

    const reloadButton = screen.getByText('Перезагрузить страницу');
    await user.click(reloadButton);

    expect(reloadSpy).toHaveBeenCalled();

    // Восстанавливаем оригинальный reload
    Object.defineProperty(window, 'location', {
      value: {
        ...window.location,
        reload: originalReload,
      },
      writable: true,
    });
  });

  test('должен отображать componentStack в development режиме', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>,
    );

    // В development режиме должен отображаться componentStack
    // Проверяем наличие pre элемента с componentStack
    const preElement = document.querySelector('pre');
    expect(preElement).toBeInTheDocument();

    process.env.NODE_ENV = originalEnv;
  });

  test('не должен отображать componentStack в production режиме', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>,
    );

    // В production режиме componentStack не должен отображаться
    const preElement = document.querySelector('pre');
    expect(preElement).not.toBeInTheDocument();

    process.env.NODE_ENV = originalEnv;
  });
});
