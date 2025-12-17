import { useContext, useDebugValue } from 'react';
import { DIContext, getGlobalDIContainer } from '../contexts';
import type { ServiceIdentifier } from 'inversify';

/**
 * Возвращает API модуль из контекста
 * Использует React Context если доступен, иначе fallback на глобальный контейнер
 */
function useVM<T>(diInstance: ServiceIdentifier<T>): T {
  // Сначала пытаемся получить из React Context
  const contextContainer = useContext(DIContext);

  // Если контекст недоступен (например, в remote модулях),
  // используем глобальный fallback
  const container = contextContainer || getGlobalDIContainer();

  // Debug информация для разработки
  useDebugValue(
    process.env.NODE_ENV !== 'production'
      ? container
        ? `DI Container available (${contextContainer ? 'context' : 'global'})`
        : 'DI Container not available'
      : undefined,
  );

  if (!container) {
    // Проверяем, что мы действительно внутри DIProvider
    // Это может произойти, если компонент рендерится вне DIProvider
    // или если @platform/ui не правильно shared между хостом и remote модулями
    const errorMessage =
      'DI Container context not initialized. ' +
      'Make sure the component is rendered inside DIProvider. ' +
      'If this is a remote module, ensure @platform/ui is properly shared in Module Federation config. ' +
      'Check that @platform/ui has eager: true in host.config.js federationShared.';
    throw new Error(errorMessage);
  }

  return container.get<T>(diInstance);
}

export { useVM };
