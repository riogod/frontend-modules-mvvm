import { type IRoutes } from '@platform/core';

export const CORE_ROUTES = {
  HOME: 'home',
  404: '404',
};

export const routes: IRoutes = [
  {
    name: CORE_ROUTES.HOME,
    path: '/',
  },
  {
    name: CORE_ROUTES[404],
    path: '/404',
  },
];
