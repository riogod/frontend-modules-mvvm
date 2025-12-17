import type { Bootstrap } from '.';
import type {
  ModuleConfig as BaseModuleConfig,
  ModuleManifestEntry,
  IBootstrap,
} from '@platform/core';

// Реэкспорт типов для удобства
export type { ModuleManifestEntry, IBootstrap };

/**
 * Интерфейс конфигурации модуля приложения с типизированным Bootstrap
 * Bootstrap реализует IBootstrap, поэтому можно использовать конкретный тип
 */
export type ModuleConfig = BaseModuleConfig<Bootstrap>;
