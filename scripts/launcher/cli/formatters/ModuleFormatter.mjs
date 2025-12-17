import chalk from 'chalk';

/**
 * @fileoverview Форматирование модулей для отображения
 */

/**
 * Получить отображаемое имя источника модуля
 * @param {string} source - Источник модуля (local, remote, remote_custom, skip)
 * @param {boolean} isRemoteAvailable - Доступен ли remote сервер
 * @param {string} remoteUrl - URL remote сервера
 * @param {string} customUrl - Кастомный URL
 * @returns {string}
 */
export function getSourceDisplayName(
  source,
  isRemoteAvailable,
  remoteUrl,
  customUrl,
) {
  switch (source) {
    case 'local':
      return '🟢 LOCAL';
    case 'remote':
      return isRemoteAvailable
        ? `🔵 REMOTE (${remoteUrl})`
        : '🔒 REMOTE (недоступно)';
    case 'remote_custom':
      return customUrl
        ? `🟣 REMOTE_CUSTOM (${customUrl})`
        : '🟣 REMOTE_CUSTOM (не настроено)';
    case 'skip':
    default:
      return '⏭️  Пропустить';
  }
}

/**
 * Форматирует информацию о модуле для отображения
 * @param {string} moduleName - Имя модуля
 * @param {Object} moduleConfig - Конфигурация модуля
 * @param {boolean} isRemoteAvailable - Доступен ли remote сервер
 * @param {string} remoteUrl - URL remote сервера
 * @returns {string}
 */
export function formatModuleInfo(
  moduleName,
  moduleConfig,
  isRemoteAvailable,
  remoteUrl,
) {
  const currentSource = moduleConfig.source || 'skip';
  const customUrl = moduleConfig.customUrl || '';
  const useLocalMocks =
    moduleConfig.useLocalMocks !== undefined
      ? moduleConfig.useLocalMocks
      : true;

  const displayName = getSourceDisplayName(
    currentSource,
    isRemoteAvailable,
    remoteUrl,
    customUrl,
  );

  const mocksStatus =
    currentSource === 'skip'
      ? ''
      : useLocalMocks
        ? ' ✅ моки'
        : ' 🔵 удаленный сервис';

  return `${moduleName}: ${displayName}${mocksStatus}`;
}
