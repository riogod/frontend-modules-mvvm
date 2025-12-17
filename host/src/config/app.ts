import { type Router } from '@riogz/router';
import { i18nOptions } from './i18n';
import { type InitOptions } from 'i18next';
import { type IRoutes, type RouterDependencies } from '@platform/core';

export interface IAppConfig {
  apiUrl?: string;
  appPrefix?: string;
  i18nOptions?: InitOptions<object>;
  routes?: IRoutes;

  routerPostInit?: (
    router: Router<RouterDependencies>,
  ) => Router<RouterDependencies>;
}

/**
 * Нормализует префикс пути приложения для роутера
 * browserPlugin ожидает префикс в формате "/prefix" (с начальным /, но БЕЗ конечного /)
 * Примеры:
 * - "aaa/" -> "/aaa"
 * - "/aaa" -> "/aaa"
 * - "/aaa/" -> "/aaa"
 * - "aaa" -> "/aaa"
 * - "" -> ""
 */
function normalizeAppPrefix(prefix: string): string {
  if (!prefix || prefix === '/') {
    return '';
  }

  // Убираем пробелы
  let normalized = prefix.trim();

  // Добавляем начальный / если его нет
  if (!normalized.startsWith('/')) {
    normalized = '/' + normalized;
  }

  // Убираем конечный / если он есть (browserPlugin не ожидает конечный /)
  if (normalized.endsWith('/') && normalized.length > 1) {
    normalized = normalized.slice(0, -1);
  }

  return normalized;
}

export const appConfig: IAppConfig = {
  apiUrl: import.meta.env.VITE_API_URL as string,
  // Нормализуем appPrefix для правильной работы с роутером
  // browserPlugin ожидает префикс в формате "/prefix" (с начальным /, но БЕЗ конечного /)
  // Это отличается от Vite base, который ожидает "/prefix/" (с конечным /)
  appPrefix: normalizeAppPrefix(
    (import.meta.env.VITE_APP_PREFIX as string) || '',
  ),

  i18nOptions,
  routes: [],
  routerPostInit: (router) => router,
};
