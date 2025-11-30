import { type IRoutes } from '@platform/core';
import { TODO_ROUTES } from '@platform/module-todo/config/routes.ts';

export const CORE_ROUTES = {
  HOME: 'home',
  404: '404',
};

export const routes: IRoutes = [
  {
    name: CORE_ROUTES.HOME,
    path: '/',
    forwardTo: TODO_ROUTES.TODO,
  },
  {
    name: CORE_ROUTES[404],
    path: '/404',
  },
];
