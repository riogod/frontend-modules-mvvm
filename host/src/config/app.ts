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

export const appConfig: IAppConfig = {
  apiUrl: import.meta.env.VITE_API_URL as string,
  appPrefix: (import.meta.env.VITE_APP_PREFIX as string) || '',

  i18nOptions,
  routes: [],
  routerPostInit: (router) => router,
};
