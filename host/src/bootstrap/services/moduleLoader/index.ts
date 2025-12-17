/**
 * Модуль загрузки и управления модулями приложения.
 *
 * Предоставляет:
 * - `BootstrapModuleLoader` - главный класс для загрузки модулей (алиас для ModuleLoader)
 * - `RemoteModuleLoader` - сервис загрузки удаленных модулей
 * - Типы и интерфейсы для работы с модулями
 * - Утилиты для работы с модулями
 *
 * @example
 * ```typescript
 * import { BootstrapModuleLoader, loadRemoteModule } from './moduleLoader';
 *
 * const loader = new BootstrapModuleLoader();
 * loader.init(bootstrap);
 *
 * // Загрузка локальных модулей
 * await loader.addModule(myModule);
 * await loader.initInitModules();
 * await loader.preloadRoutes();
 * await loader.loadNormalModules();
 *
 * // Загрузка удаленных модулей
 * const config = await loadRemoteModule('myRemoteModule', 'https://example.com/remoteEntry.js');
 * ```
 *
 * @module moduleLoader
 */

// ============================================
// Главный класс (алиас для обратной совместимости)
// ============================================

import { ModuleLoader } from './core/ModuleLoader';
import type { ModuleConfig } from '../../interface';
import type { LoadRemoteModuleOptions } from './types';
import { remoteModuleLoader } from './services/RemoteModuleLoader';

/**
 * Главный класс загрузчика модулей.
 *
 * Алиас для ModuleLoader, сохраненный для обратной совместимости.
 */
export { ModuleLoader as BootstrapModuleLoader };

// ============================================
// Ядро системы
// ============================================

export {
  ModuleLoader,
  ModuleRegistry,
  ModuleRegistryError,
  ModuleStatusTracker,
} from './core';

// ============================================
// Сервисы
// ============================================

export {
  LifecycleManager,
  RemoteModuleLoader,
  remoteModuleLoader,
} from './services';

// ============================================
// Стратегии загрузки
// ============================================

export {
  type ILoadStrategy,
  type LoadContext,
  InitLoadStrategy,
  NormalLoadStrategy,
} from './strategies';

// ============================================
// Prod-only исполняющие компоненты
// ============================================

export {
  loadInitModulesProd,
  loadNormalModulesProd,
  type ProdExecutorContext,
} from './prod';

// ============================================
// Утилиты
// ============================================

export {
  checkRemoteAvailability,
  getRemoteBasePath,
  createScopeName,
  delay,
} from './utils';

// ============================================
// Ошибки
// ============================================

export {
  RemoteModuleLoadError,
  RemoteModuleTimeoutError,
  RemoteContainerNotFoundError,
} from './errors';

// ============================================
// Типы
// ============================================

// Статусы модулей (enum - реэкспортируем напрямую из файла)
export { ModuleLoadStatus } from './types/status.types';

// Типы модулей
export type {
  Module,
  LoadedModuleInfo,
  RouteState,
  RouteFromState,
  RouteDependencies,
  DependencyLevelResult,
  SkippedModuleInfo,
  RouteCacheEntry,

  // Типы статусов
  LoadedModule,
  ModuleStatusChangeEvent,
  StatusChangeHandler,
  ModuleStatusSummary,

  // Типы callback-функций
  LoadModuleFunction,
  IsModuleLoadedFunction,
  IsModulePreloadedFunction,
  AutoLoadByRouteFunction,
  ModuleFilterFunction,
  ModuleLoaderInitOptions,
  LoadModuleOptions,

  // Типы для remote модулей
  RemoteModuleConfig,
  LoadRemoteModuleOptions,
  RemoteContainer,
} from './types';

// ============================================
// Функция загрузки удаленного модуля
// ============================================

/**
 * Загружает конфигурацию удаленного модуля.
 *
 * Использует singleton RemoteModuleLoader для оптимизации кеширования.
 *
 * @param name - Имя модуля
 * @param remoteEntry - URL к remoteEntry.js
 * @param options - Опции загрузки
 * @returns Конфигурация модуля
 *
 * @example
 * ```typescript
 * const config = await loadRemoteModule(
 *   'myModule',
 *   'https://example.com/remoteEntry.js',
 *   { timeout: 5000, retries: 2 }
 * );
 * ```
 */
export async function loadRemoteModule(
  name: string,
  remoteEntry: string,
  options?: LoadRemoteModuleOptions,
): Promise<ModuleConfig> {
  return remoteModuleLoader.loadRemoteModule(name, remoteEntry, options);
}

// ============================================
// Обратная совместимость
// ============================================

/** @deprecated Используйте ModuleLoadStatus enum */
export type ModuleLoadStatusLegacy =
  | 'pending'
  | 'loading'
  | 'preloaded'
  | 'loaded'
  | 'failed';
