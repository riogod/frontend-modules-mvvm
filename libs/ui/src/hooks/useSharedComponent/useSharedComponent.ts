import {
  useContext,
  useDebugValue,
  useMemo,
  type ComponentType,
  type LazyExoticComponent,
} from 'react';
import { log } from '@platform/core';
import { DIContext, getGlobalDIContainer } from '../../contexts';
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
   * Используется для предотвращения прорыва ошибок биндинга наружу
   */
  fallback?: ReactComponentType;
  /**
   * Подавлять ли ошибки и возвращать fallback или null вместо выброса исключения
   * По умолчанию: true (ошибки не выбрасываются, возвращается fallback или null)
   * Если false, ошибки будут выброшены (полезно для строгой проверки в тестах)
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
 * // Базовое использование (по умолчанию suppressErrors: true, вернет null если компонент не найден)
 * const MyComponent = useSharedComponent('component.key');
 *
 * return (
 *   <Suspense fallback={<div>Загрузка...</div>}>
 *     {MyComponent ? (
 *       <MyComponent />
 *     ) : (
 *       <div>Компонент не найден</div>
 *     )}
 *   </Suspense>
 * );
 *
 * // С fallback компонентом (предотвращает прорыв ошибок биндинга)
 * const MyComponent = useSharedComponent('component.key', {
 *   fallback: () => <div>Компонент недоступен</div>
 * });
 *
 * return (
 *   <Suspense fallback={<div>Загрузка...</div>}>
 *     <MyComponent />
 *   </Suspense>
 * );
 *
 * // С указанием модуля для диагностики
 * const MyComponent = useSharedComponent('component.key', {
 *   moduleName: 'my-module'
 * });
 *
 * // Строгая проверка (выбросит ошибку если компонент не найден)
 * const MyComponent = useSharedComponent('component.key', {
 *   suppressErrors: false
 * });
 * ```
 *
 * @returns React компонент из DI контейнера, fallback компонент, или null (если компонент не найден и suppressErrors: true)
 *
 * @throws {Error} Если DI контейнер не инициализирован (только если suppressErrors: false)
 * @throws {Error} Если компонент не найден в контейнере (только если suppressErrors: false)
 * @throws {Error} Если полученный объект не является React компонентом (только если validateComponent: true и suppressErrors: false)
 *
 * @remarks
 * По умолчанию хук не выбрасывает ошибки, а возвращает `fallback` компонент или `null` если компонент не найден.
 * **Важно:** Используйте опцию `fallback` для предотвращения прорыва ошибок биндинга наружу и поломки модуля.
 * Для lazy компонентов используйте `<Suspense>` для обработки состояния загрузки.
 *
 * ```tsx
 * // Рекомендуемый подход: использовать fallback для предотвращения прорыва ошибок
 * const MyComponent = useSharedComponent('component.key', {
 *   fallback: () => <div>Компонент недоступен</div>
 * });
 *
 * return (
 *   <Suspense fallback={<div>Загрузка...</div>}>
 *     <MyComponent />
 *   </Suspense>
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
    suppressErrors = true, // По умолчанию не выбрасываем ошибки для удобства использования
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

      // Всегда логируем предупреждение в dev режиме
      if (process.env.NODE_ENV !== 'production') {
        log.warn(
          `${errorMessage} Returning ${fallback ? 'fallback' : 'null'}.`,
          { prefix: 'useSharedComponent' },
        );
      }

      if (suppressErrors) {
        return (fallback || null) as T | null;
      }

      throw new Error(errorMessage);
    }
    // Проверяем существование биндинга перед обращением к контейнеру
    // Это предотвращает выбрасывание ошибки и прорыв ее наружу
    if (!container.isBound(containerKey)) {
      const errorMessage =
        `Component not found in DI container. ` +
        `Key: ${String(containerKey)}. ` +
        (moduleName ? `Module: ${moduleName}. ` : '') +
        `Make sure the component is registered in DI container with this key. ` +
        `Check that the module's DI_CONFIG properly binds the component.`;

      // Всегда логируем предупреждение в dev режиме
      if (process.env.NODE_ENV !== 'production') {
        if (fallback !== undefined) {
          log.warn(`${errorMessage} Using fallback component.`, {
            prefix: 'useSharedComponent',
          });
        } else {
          log.warn(`${errorMessage} Returning null.`, {
            prefix: 'useSharedComponent',
          });
        }
      }

      // Если указан fallback, возвращаем его (предотвращает прорыв ошибок)
      if (fallback !== undefined) {
        return fallback as T;
      }

      // Если suppressErrors = true, возвращаем null
      if (suppressErrors) {
        return null;
      }

      // Если suppressErrors = false, выбрасываем ошибку
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

          // Всегда логируем предупреждение в dev режиме
          if (process.env.NODE_ENV !== 'production') {
            log.warn(
              `${errorMessage} Returning ${fallback ? 'fallback' : 'null'}.`,
              { prefix: 'useSharedComponent' },
            );
          }

          if (suppressErrors) {
            return (fallback || null) as T | null;
          }

          throw new Error(errorMessage);
        }
      }

      return resolvedComponent;
    } catch (error) {
      // Обработка других ошибок (не связанных с отсутствием биндинга)
      const errorMessage =
        `Error getting component from DI container. ` +
        `Key: ${String(containerKey)}. ` +
        (moduleName ? `Module: ${moduleName}. ` : '') +
        `Error: ${error instanceof Error ? error.message : String(error)}.`;

      // Всегда логируем предупреждение в dev режиме
      if (process.env.NODE_ENV !== 'production') {
        log.warn(
          `${errorMessage} Returning ${fallback ? 'fallback' : 'null'}.`,
          { prefix: 'useSharedComponent' },
        );
      }

      // Если указан fallback, возвращаем его (предотвращает прорыв ошибок)
      if (fallback !== undefined) {
        return fallback as T;
      }

      // Если suppressErrors = true, возвращаем null
      if (suppressErrors) {
        return null;
      }

      // Если suppressErrors = false, выбрасываем ошибку
      throw new Error(errorMessage);
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
