import { useContext } from 'react';
import { DIContext } from '../contexts';
import type { ServiceIdentifier } from 'inversify';

/**
 * Возвращает API модуль из контекста
 */
function useVM<T>(diInstance: ServiceIdentifier<T>): T {
  const container = useContext(DIContext);
  if (!container) {
    throw Error('DI Container context not initialized');
  }

  return container.get<T>(diInstance);
}

export { useVM };
