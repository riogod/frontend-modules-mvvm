import { type IRoutes } from '@platform/core';
import { lazy } from 'react';

export const APP_TEST_ROUTES = {
  HOME: 'app-test',
};

export const routes: IRoutes = [
  {
    name: 'app-test',
    path: '/app-test',
    menu: {
      text: 'app-test:menu.app-test',
    },
    browserTitle: 'App Test',
    pageComponent: lazy(() => import('../view/pages/HomePage')),
  },
];

