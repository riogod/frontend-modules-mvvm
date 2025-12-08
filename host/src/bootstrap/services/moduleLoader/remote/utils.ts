import { log } from '@platform/core';

/**
 * Проверяет доступность URL
 */
export async function checkRemoteAvailability(url: string): Promise<boolean> {
  log.debug(`Checking remote availability: ${url}`, {
    prefix: 'bootstrap.services.remoteModuleLoader.utils.checkRemoteAvailability',
  });
  try {
    const response = await fetch(url, { method: 'HEAD', mode: 'cors' });
    const isAvailable = response.ok;
    log.debug(
      `Remote availability check: ${url} = ${isAvailable ? 'available' : 'unavailable'} (status: ${response.status})`,
      {
        prefix:
          'bootstrap.services.remoteModuleLoader.utils.checkRemoteAvailability',
      },
    );
    return isAvailable;
  } catch (error) {
    log.debug(
      `Remote availability check failed: ${url}`,
      {
        prefix:
          'bootstrap.services.remoteModuleLoader.utils.checkRemoteAvailability',
      },
      {
        error: error instanceof Error ? error.message : String(error),
      },
    );
    return false;
  }
}

/**
 * Парсит URL remoteEntry и извлекает базовый путь
 */
export function getRemoteBasePath(remoteEntry: string): string {
  log.debug(`Getting remote base path from: ${remoteEntry}`, {
    prefix: 'bootstrap.services.remoteModuleLoader.utils.getRemoteBasePath',
  });
  const url = new URL(remoteEntry);
  const basePath =
    url.origin + url.pathname.substring(0, url.pathname.lastIndexOf('/') + 1);
  log.debug(`Remote base path: ${basePath}`, {
    prefix: 'bootstrap.services.remoteModuleLoader.utils.getRemoteBasePath',
  });
  return basePath;
}

/**
 * Создает scope имя из имени модуля
 */
export function createScopeName(moduleName: string): string {
  const scopeName = `module_${moduleName.replace(/-/g, '_')}`;
  log.debug(`Created scope name: ${scopeName} from module: ${moduleName}`, {
    prefix: 'bootstrap.services.remoteModuleLoader.utils.createScopeName',
  });
  return scopeName;
}

