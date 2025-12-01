import { remoteModuleLoader } from './RemoteModuleLoader';
import type { ModuleConfig } from '../../interface';
import type { LoadRemoteModuleOptions } from './types';
import { log } from '@platform/core';

/**
 * Упрощенная функция для загрузки remote модуля
 * Использует singleton RemoteModuleLoader
 */
export async function loadRemoteModule(
  name: string,
  remoteEntry: string,
  options?: LoadRemoteModuleOptions,
): Promise<ModuleConfig> {
  log.debug(`loadRemoteModule called: ${name} from ${remoteEntry}`, {
    prefix: 'bootstrap.services.remoteModuleLoader.loadRemoteModule',
  });
  const result = await remoteModuleLoader.loadRemoteModule(
    name,
    remoteEntry,
    options,
  );
  log.debug(`loadRemoteModule completed: ${name}`, {
    prefix: 'bootstrap.services.remoteModuleLoader.loadRemoteModule',
  });
  return result;
}

