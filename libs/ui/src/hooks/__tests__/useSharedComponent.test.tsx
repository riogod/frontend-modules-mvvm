import { describe, test, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { lazy, type ComponentType } from 'react';
import { useSharedComponent } from '../useSharedComponent';
import { DIProvider } from '../../providers/DIProvider';

// Мок компонента для тестов
const MockComponent: ComponentType = () => <div>Test Component</div>;

// Lazy компонент для тестов
const LazyMockComponent = lazy(() =>
  Promise.resolve({ default: MockComponent }),
);

describe('useSharedComponent', () => {
  test('should throw an error if DIContext is not available', () => {
    const containerKey = 'component.key';

    expect(() => {
      renderHook(() => useSharedComponent(containerKey));
    }).toThrow('DI Container context not initialized');
  });

  test('should return component from DI container', () => {
    const containerKey = 'component.key';
    const container: any = {
      get: vi.fn((key: string) => {
        if (key === containerKey) {
          return MockComponent;
        }
        throw new Error('No matching bindings found');
      }),
    };

    const wrapper = ({ children }: any) => (
      <DIProvider container={container}>{children}</DIProvider>
    );

    const { result } = renderHook(() => useSharedComponent(containerKey), {
      wrapper,
    });

    expect(result.current).toBe(MockComponent);
    expect(container.get).toHaveBeenCalledWith(containerKey);
  });

  test('should return lazy component from DI container', () => {
    const containerKey = 'lazy.component.key';
    const container: any = {
      get: vi.fn((key: string) => {
        if (key === containerKey) {
          return LazyMockComponent;
        }
        throw new Error('No matching bindings found');
      }),
    };

    const wrapper = ({ children }: any) => (
      <DIProvider container={container}>{children}</DIProvider>
    );

    const { result } = renderHook(() => useSharedComponent(containerKey), {
      wrapper,
    });

    expect(result.current).toBe(LazyMockComponent);
  });

  test('should include module name in error message when component not found', () => {
    const containerKey = 'nonexistent.key';
    const moduleName = 'test-module';
    const container: any = {
      get: vi.fn(() => {
        throw new Error('No matching bindings found');
      }),
    };

    const wrapper = ({ children }: any) => (
      <DIProvider container={container}>{children}</DIProvider>
    );

    expect(() => {
      renderHook(() => useSharedComponent(containerKey, { moduleName }), {
        wrapper,
      });
    }).toThrow(/Module: test-module/);
  });

  test('should include module name in error message when container not initialized', () => {
    const containerKey = 'component.key';
    const moduleName = 'test-module';

    expect(() => {
      renderHook(() => useSharedComponent(containerKey, { moduleName }));
    }).toThrow(/Trying to get component from module: test-module/);
  });

  test('should validate component type in development mode', () => {
    const containerKey = 'invalid.component';
    const invalidValue = { notAComponent: true };
    const container: any = {
      get: vi.fn((key: string) => {
        if (key === containerKey) {
          return invalidValue;
        }
        throw new Error('No matching bindings found');
      }),
    };

    const wrapper = ({ children }: any) => (
      <DIProvider container={container}>{children}</DIProvider>
    );

    // В dev режиме должна быть валидация
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    expect(() => {
      renderHook(
        () => useSharedComponent(containerKey, { validateComponent: true }),
        { wrapper },
      );
    }).toThrow(/Invalid React component/);

    process.env.NODE_ENV = originalEnv;
  });

  test('should skip validation when validateComponent is false', () => {
    const containerKey = 'invalid.component';
    const invalidValue = { notAComponent: true };
    const container: any = {
      get: vi.fn((key: string) => {
        if (key === containerKey) {
          return invalidValue;
        }
        throw new Error('No matching bindings found');
      }),
    };

    const wrapper = ({ children }: any) => (
      <DIProvider container={container}>{children}</DIProvider>
    );

    const { result } = renderHook(
      () => useSharedComponent(containerKey, { validateComponent: false }),
      { wrapper },
    );

    // Должен вернуть значение без валидации
    expect(result.current).toBe(invalidValue);
  });

  test('should memoize component to prevent unnecessary re-renders', () => {
    const containerKey = 'component.key';
    const getSpy = vi.fn(() => MockComponent);
    const container: any = {
      get: getSpy,
    };

    const wrapper = ({ children }: any) => (
      <DIProvider container={container}>{children}</DIProvider>
    );

    const { result, rerender } = renderHook(
      () => useSharedComponent(containerKey),
      { wrapper },
    );

    const firstResult = result.current;

    // Перерендер не должен вызывать повторный get
    rerender();
    rerender();

    expect(result.current).toBe(firstResult);
    // get должен быть вызван только один раз благодаря useMemo
    expect(getSpy).toHaveBeenCalledTimes(1);
  });

  test('should return fallback component when component not found', () => {
    const containerKey = 'nonexistent.key';
    const FallbackComponent: ComponentType = () => <div>Fallback</div>;
    const container: any = {
      get: vi.fn(() => {
        throw new Error('No matching bindings found');
      }),
    };

    const wrapper = ({ children }: any) => (
      <DIProvider container={container}>{children}</DIProvider>
    );

    const { result } = renderHook(
      () => useSharedComponent(containerKey, { fallback: FallbackComponent }),
      { wrapper },
    );

    expect(result.current).toBe(FallbackComponent);
  });

  test('should return fallback lazy component when component not found', () => {
    const containerKey = 'nonexistent.key';
    const FallbackLazyComponent = lazy(() =>
      Promise.resolve({ default: MockComponent }),
    );
    const container: any = {
      get: vi.fn(() => {
        throw new Error('No matching bindings found');
      }),
    };

    const wrapper = ({ children }: any) => (
      <DIProvider container={container}>{children}</DIProvider>
    );

    const { result } = renderHook(
      () =>
        useSharedComponent(containerKey, {
          fallback: FallbackLazyComponent,
        }),
      { wrapper },
    );

    expect(result.current).toBe(FallbackLazyComponent);
  });

  test('should log warning when using fallback', () => {
    const containerKey = 'nonexistent.key';
    const moduleName = 'test-module';
    const FallbackComponent: ComponentType = () => <div>Fallback</div>;
    const container: any = {
      get: vi.fn(() => {
        throw new Error('No matching bindings found');
      }),
    };

    const wrapper = ({ children }: any) => (
      <DIProvider container={container}>{children}</DIProvider>
    );

    // log.warn в итоге вызывает console.warn, поэтому проверяем через spy
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    renderHook(
      () =>
        useSharedComponent(containerKey, {
          fallback: FallbackComponent,
          moduleName,
        }),
      { wrapper },
    );

    // Проверяем, что log.warn был вызван (через console.warn)
    expect(consoleSpy).toHaveBeenCalled();
    const warnCall = consoleSpy.mock.calls[0];
    expect(warnCall[0]).toContain('Component not found');
    expect(warnCall[0]).toContain('test-module');
    expect(warnCall[0]).toContain('Using fallback component');

    consoleSpy.mockRestore();
  });
});
