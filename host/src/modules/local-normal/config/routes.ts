import { type IRoutes } from '@platform/core';
import { lazy } from 'react';

export const LOCAL_NORMAL_ROUTES = {
  HOME: 'local-normal',
};

export const routes: IRoutes = [
  {
    name: 'local-normal',
    path: '/local-normal',
    menu: {
      text: 'local-normal:menu.local-normal',
    },
    browserTitle: 'Local Normal',
    pageComponent: lazy(() => import('../view/pages/HomePage')),
  },
];

