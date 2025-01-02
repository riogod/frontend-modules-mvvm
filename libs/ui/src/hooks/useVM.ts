import { useContext } from 'react';
import { DIContext } from '../contexts';
import { CommonServiceIdentifier } from 'inversify/lib/cjs/interfaces/interfaces_common_exports';

/**
 * Возвращает API модуль из контекста
 */
function useVM<T>(diInstance: CommonServiceIdentifier<T>): T {
  const container = useContext(DIContext);
  if (!container) {
    throw Error('DI Container context not initialized');
  }

  return container.get<T>(diInstance);
}

export { useVM };
