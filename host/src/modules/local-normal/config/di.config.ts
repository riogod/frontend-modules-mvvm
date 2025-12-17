import type { Container } from 'inversify';
import { LOCAL_NORMAL_DI_TOKENS } from './di.tokens';

// Re-export for backward compatibility
export { LOCAL_NORMAL_DI_TOKENS };

export const DI_CONFIG = (container: Container) => {
  // Регистрация зависимостей модуля
  // Пример:
  // container.bind(LOCAL_NORMAL_DI_TOKENS.SomeService).to(SomeService);

  return container;
};

