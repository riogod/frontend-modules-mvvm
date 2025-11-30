import { remoteModuleLoader } from './RemoteModuleLoader';
import type { ModuleConfig } from '../../interface';
import type { LoadRemoteModuleOptions } from './types';

/**
 * Упрощенная функция для загрузки remote модуля
 * Использует singleton RemoteModuleLoader
 */
export async function loadRemoteModule(
  name: string,
  remoteEntry: string,
  options?: LoadRemoteModuleOptions,
): Promise<ModuleConfig> {
  return remoteModuleLoader.loadRemoteModule(name, remoteEntry, options);
}

