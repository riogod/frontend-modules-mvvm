import type { Container } from 'inversify';
import { DOC_PLATFORM_DI_TOKENS } from './di.tokens';

// Re-export for backward compatibility
export { DOC_PLATFORM_DI_TOKENS };

export const DI_CONFIG = (container: Container) => {
  // Регистрация зависимостей модуля
  // Пример:
  // container.bind(DOC_PLATFORM_DI_TOKENS.SomeService).to(SomeService);

  return container;
};

