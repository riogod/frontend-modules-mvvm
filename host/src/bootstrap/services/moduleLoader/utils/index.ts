/**
 * Экспорт утилит загрузчика модулей.
 * @module utils
 */

export {
  checkRemoteAvailability,
  getRemoteBasePath,
  createScopeName,
  delay,
} from './remoteUtils';
export { getModuleDependencies, hasDependencies } from './moduleUtils';

