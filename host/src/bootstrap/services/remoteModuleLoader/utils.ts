/**
 * Проверяет доступность URL
 */
export async function checkRemoteAvailability(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: 'HEAD', mode: 'cors' });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Парсит URL remoteEntry и извлекает базовый путь
 */
export function getRemoteBasePath(remoteEntry: string): string {
  const url = new URL(remoteEntry);
  return (
    url.origin + url.pathname.substring(0, url.pathname.lastIndexOf('/') + 1)
  );
}

/**
 * Создает scope имя из имени модуля
 */
export function createScopeName(moduleName: string): string {
  return `module_${moduleName.replace(/-/g, '_')}`;
}

