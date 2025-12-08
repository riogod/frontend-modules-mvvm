/**
 * Утилиты для работы с удаленными модулями.
 * @module utils/remoteUtils
 */

import { log } from '@platform/core';

/** Префикс для логирования */
const LOG_PREFIX = 'moduleLoader.remoteUtils';

/**
 * Проверяет доступность URL удаленного ресурса.
 * 
 * @param url - URL для проверки
 * @returns true, если ресурс доступен (HTTP 2xx)
 */
export async function checkRemoteAvailability(url: string): Promise<boolean> {
  log.debug(`Проверка доступности: ${url}`, { prefix: LOG_PREFIX });

  try {
    const response = await fetch(url, { method: 'HEAD', mode: 'cors' });
    const isAvailable = response.ok;

    log.debug(
      `Доступность ${url}: ${isAvailable ? 'доступен' : 'недоступен'} (статус: ${response.status})`,
      { prefix: LOG_PREFIX },
    );

    return isAvailable;
  } catch (error) {
    log.debug(`Ошибка проверки доступности ${url}`, {
      prefix: LOG_PREFIX,
      error: error instanceof Error ? error.message : String(error),
    });
    return false;
  }
}

/**
 * Извлекает базовый путь из URL remoteEntry.
 * 
 * @param remoteEntry - Полный URL к remoteEntry.js
 * @returns Базовый путь (origin + директория)
 * 
 * @example
 * getRemoteBasePath('https://example.com/modules/app/remoteEntry.js')
 * // => 'https://example.com/modules/app/'
 */
export function getRemoteBasePath(remoteEntry: string): string {
  log.debug(`Извлечение базового пути из: ${remoteEntry}`, {
    prefix: LOG_PREFIX,
  });

  const url = new URL(remoteEntry);
  const basePath =
    url.origin + url.pathname.substring(0, url.pathname.lastIndexOf('/') + 1);

  log.debug(`Базовый путь: ${basePath}`, { prefix: LOG_PREFIX });
  return basePath;
}

/**
 * Создает scope имя для Module Federation из имени модуля.
 * 
 * Преобразует имя модуля в валидный идентификатор JavaScript,
 * заменяя дефисы на подчеркивания и добавляя префикс 'module_'.
 * 
 * @param moduleName - Имя модуля
 * @returns Scope имя для Module Federation
 * 
 * @example
 * createScopeName('my-awesome-module')
 * // => 'module_my_awesome_module'
 */
export function createScopeName(moduleName: string): string {
  const scopeName = `module_${moduleName.replace(/-/g, '_')}`;

  log.debug(`Создано scope имя: ${scopeName} для модуля: ${moduleName}`, {
    prefix: LOG_PREFIX,
  });

  return scopeName;
}

/**
 * Создает задержку на указанное время.
 * 
 * @param ms - Время задержки в миллисекундах
 * @returns Promise, который резолвится после задержки
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

