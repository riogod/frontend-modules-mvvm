import { Router } from 'router5';
import { i18nOptions } from './i18n.ts';
import { InitOptions } from 'i18next';
import { IRoutes } from '@todo/core';

export interface IAppConfig {
  apiUrl?: string;
  appPrefix?: string;
  i18nOptions?: InitOptions<object>;
  routes?: IRoutes;

  routerPostInit?: (
    router: Router<Record<string, unknown>>,
  ) => Router<Record<string, unknown>>;
}

export const appConfig: IAppConfig = {
  apiUrl: import.meta.env.VITE_API_URL as string,
  appPrefix: (import.meta.env.VITE_APP_PREFIX as string) || '',

  i18nOptions,
  routes: [],
  routerPostInit: (router) => router,
};
