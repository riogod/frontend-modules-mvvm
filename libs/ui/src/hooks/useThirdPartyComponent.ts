import {
  useContext,
  useDebugValue,
  useMemo,
  type ComponentType,
  type LazyExoticComponent,
} from 'react';
import { log } from '@platform/core';
import { DIContext, getGlobalDIContainer } from '../contexts';
import type { ServiceIdentifier } from 'inversify';

/**
 * Тип для React компонента, который может быть получен из DI контейнера
 * Поддерживает как обычные компоненты, так и lazy компоненты
 */
type ReactComponentType<P = unknown> =
  | ComponentType<P>
  | LazyExoticComponent<ComponentType<P>>;

/**
 * Опции для хука useSharedComponent
 */
interface UseSharedComponentOptions {
  /**
   * Название модуля, который предоставляет компонент
   * Используется для улучшения диагностики ошибок
   */
  moduleName?: string;
  /**
   * Валидировать ли, что полученный объект является React компонентом
   * По умолчанию: true
   */
  validateComponent?: boolean;
  /**
   * Fallback компонент, который будет возвращен, если компонент не найден в контейнере
   * Если не указан, будет выброшена ошибка
   */
  fallback?: ReactComponentType;
  /**
   * Подавлять ли ошибки и возвращать fallback или null вместо выброса исключения
   * По умолчанию: false (ошибки выбрасываются)
   * Если true и fallback не указан, вернется null
   */
  suppressErrors?: boolean;
}

/**
 * Хук для получения shared UI-компонентов из DI контейнера
 * Предназначен для работы с компонентами, которые shared между микрофронтовыми модулями
 *
 * @template T - Тип React компонента (ComponentType или LazyExoticComponent)
 * @param containerKey - Ключ контейнера, по которому производится поиск компонента
 * @param options - Опциональные параметры для настройки поведения хука
 * @returns React компонент из DI контейнера
 *
 * @example
 * ```tsx
 * // Базовое использование
 * const MyComponent = useSharedComponent<typeof MyComponentType>('component.key');
 *
 * // С указанием модуля для диагностики
 * const MyComponent = useSharedComponent<typeof MyComponentType>(
 *   'component.key',
 *   { moduleName: 'my-module' }
 * );
 *
 * // С fallback компонентом
 * const MyComponent = useSharedComponent<typeof MyComponentType>(
 *   'component.key',
 *   { fallback: DefaultComponent }
 * );
 *
 * // С подавлением ошибок (вернет null или fallback вместо выброса ошибки)
 * const MyComponent = useSharedComponent<typeof MyComponentType>(
 *   'component.key',
 *   { suppressErrors: true, fallback: DefaultComponent }
 * );
 * ```
 *
 * @returns React компонент из DI контейнера, fallback компонент, или null (если suppressErrors: true)
 *
 * @throws {Error} Если DI контейнер не инициализирован (если suppressErrors: false)
 * @throws {Error} Если компонент не найден в контейнере и не указан fallback/suppressErrors (если suppressErrors: false)
 * @throws {Error} Если полученный объект не является React компонентом (если validateComponent: true и suppressErrors: false)
 *
 * @remarks
 * **Важно:** ErrorBoundary не перехватывает ошибки, выброшенные в хуках.
 * Рекомендуется обернуть компонент, использующий результат этого хука, в ErrorBoundary:
 *
 * ```tsx
 * import { ErrorBoundary } from '@platform/ui';
 *
 * const MyComponent = useSharedComponent('component.key');
 *
 * return (
 *   <ErrorBoundary>
 *     {MyComponent && <MyComponent />}
 *   </ErrorBoundary>
 * );
 * ```
 */
function useSharedComponent<T extends ReactComponentType>(
  containerKey: ServiceIdentifier<T>,
  options: UseSharedComponentOptions = {},
): T | null {
  const {
    moduleName,
    validateComponent = true,
    fallback,
    suppressErrors = false,
  } = options;

  // Получаем DI контейнер (аналогично useVM)
  const contextContainer = useContext(DIContext);
  const container = contextContainer || getGlobalDIContainer();

  // Debug информация для разработки
  useDebugValue(
    process.env.NODE_ENV !== 'production'
      ? container
        ? `Component: ${String(containerKey)}${moduleName ? ` (from ${moduleName})` : ''}`
        : 'DI Container not available'
      : undefined,
  );

  // Мемоизация компонента для предотвращения лишних перерендеров
  // ВАЖНО: useMemo вызывается безусловно, все условные возвраты внутри него
  const component = useMemo(() => {
    // Валидация наличия контейнера
    if (!container) {
      const errorMessage =
        'DI Container context not initialized. ' +
        'Make sure the component is rendered inside DIProvider. ' +
        (moduleName
          ? `Trying to get component from module: ${moduleName}. `
          : '') +
        'If this is a remote module, ensure @platform/ui is properly shared in Module Federation config.';

      if (suppressErrors) {
        if (moduleName) {
          log.warn(
            `${errorMessage} Returning ${fallback ? 'fallback' : 'null'}.`,
            { prefix: 'useThirdPartyComponent' },
          );
        }
        return (fallback || null) as T | null;
      }

      throw new Error(errorMessage);
    }
    try {
      const resolvedComponent = container.get<T>(containerKey);

      // Валидация компонента в dev режиме
      if (
        process.env.NODE_ENV !== 'production' &&
        validateComponent &&
        resolvedComponent
      ) {
        const isValidComponent =
          typeof resolvedComponent === 'function' ||
          (typeof resolvedComponent === 'object' &&
            resolvedComponent !== null &&
            '$$typeof' in resolvedComponent);

        if (!isValidComponent) {
          const errorMessage =
            `Invalid React component retrieved from DI container. ` +
            `Key: ${String(containerKey)}. ` +
            (moduleName ? `Module: ${moduleName}. ` : '') +
            `Expected ComponentType or LazyExoticComponent, got: ${typeof resolvedComponent}. ` +
            `Make sure the component is properly registered in DI container.`;

          if (suppressErrors) {
            if (moduleName) {
              log.warn(
                `${errorMessage} Returning ${fallback ? 'fallback' : 'null'}.`,
                { prefix: 'useSharedComponent' },
              );
            }
            return (fallback || null) as T | null;
          }

          throw new Error(errorMessage);
        }
      }

      return resolvedComponent;
    } catch (error) {
      // Улучшенная обработка ошибок с информацией о модуле
      if (error instanceof Error) {
        // Если это ошибка от inversify (компонент не найден)
        if (error.message.includes('No matching bindings found')) {
          // Если указан fallback, возвращаем его вместо ошибки
          if (fallback !== undefined) {
            if (moduleName) {
              log.warn(
                `Component not found in DI container. ` +
                  `Key: ${String(containerKey)}. ` +
                  `Module: ${moduleName}. ` +
                  `Using fallback component.`,
                { prefix: 'useSharedComponent' },
              );
            }
            return fallback as T;
          }
          // Если fallback не указан, проверяем suppressErrors
          if (suppressErrors) {
            if (moduleName) {
              log.warn(
                `Component not found in DI container. ` +
                  `Key: ${String(containerKey)}. ` +
                  `Module: ${moduleName}. ` +
                  `Returning null.`,
                { prefix: 'useSharedComponent' },
              );
            }
            return null;
          }

          // Если suppressErrors = false, выбрасываем ошибку
          const errorMessage =
            `Component not found in DI container. ` +
            `Key: ${String(containerKey)}. ` +
            (moduleName ? `Module: ${moduleName}. ` : '') +
            `Make sure the component is registered in DI container with this key. ` +
            `Check that the module's DI_CONFIG properly binds the component. ` +
            `You can provide a fallback component via options.fallback or set suppressErrors: true to handle this case gracefully.`;
          throw new Error(errorMessage);
        }
        // Если suppressErrors, возвращаем fallback или null
        if (suppressErrors) {
          if (moduleName) {
            log.warn(
              `Error getting component from DI container. ` +
                `Key: ${String(containerKey)}. ` +
                `Module: ${moduleName}. ` +
                `Error: ${error.message}. ` +
                `Returning ${fallback ? 'fallback' : 'null'}.`,
              { prefix: 'useSharedComponent' },
            );
          }
          return (fallback || null) as T | null;
        }

        // Пробрасываем оригинальную ошибку, если она уже информативна
        throw error;
      }
      // Для неизвестных ошибок
      if (suppressErrors) {
        if (moduleName) {
          log.warn(
            `Unknown error getting component from DI container. ` +
              `Key: ${String(containerKey)}. ` +
              `Module: ${moduleName}. ` +
              `Error: ${String(error)}. ` +
              `Returning ${fallback ? 'fallback' : 'null'}.`,
            { prefix: 'useSharedComponent' },
          );
        }
        return (fallback || null) as T | null;
      }

      throw new Error(
        `Failed to get component from DI container. ` +
          `Key: ${String(containerKey)}. ` +
          (moduleName ? `Module: ${moduleName}. ` : '') +
          `Error: ${String(error)}`,
      );
    }
  }, [
    container,
    containerKey,
    validateComponent,
    moduleName,
    fallback,
    suppressErrors,
  ]);

  return component;
}

export { useSharedComponent };
export type { UseSharedComponentOptions, ReactComponentType };

// Обратная совместимость: экспортируем старое имя как алиас
/** @deprecated Используйте useSharedComponent вместо useThirdPartyComponent */
export const useThirdPartyComponent = useSharedComponent;
/** @deprecated Используйте UseSharedComponentOptions вместо UseThirdPartyComponentOptions */
export type UseThirdPartyComponentOptions = UseSharedComponentOptions;
