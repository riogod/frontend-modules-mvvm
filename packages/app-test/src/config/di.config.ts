import type { Container } from 'inversify';
import { APP_TEST_DI_TOKENS } from './di.tokens';

// Re-export for backward compatibility
export { APP_TEST_DI_TOKENS };

export const DI_CONFIG = (container: Container) => {
  // Регистрация зависимостей модуля
  // Пример:
  // container.bind(APP_TEST_DI_TOKENS.SomeService).to(SomeService);

  return container;
};

