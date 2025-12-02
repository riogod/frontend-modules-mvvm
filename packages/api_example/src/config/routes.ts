import { type IRoutes } from '@platform/core';
import { lazy } from 'react';
import type { JokeViewModel } from '../viewmodels/joke.vm';
import { API_EXAMPLE_DI_TOKENS } from './di.tokens';

export const API_ROUTES = {
  API: 'api-example',
};

export const routes: IRoutes = [
  {
    name: API_ROUTES.API,
    path: '/api-example',
    menu: {
      text: 'api:menu.api',
      sortOrder: 2000,
    },
    browserTitle: 'API example',
    pageComponent: lazy(() => import('../view/ApiPage')),
    onEnterNode: async (_toState, _fromState, deps) => {
      const container = deps.di;
      await container
        .get<JokeViewModel>(API_EXAMPLE_DI_TOKENS.VIEW_MODEL_JOKE)
        .getJoke();
    },
    onExitNode: async (_toState, _fromState, deps): Promise<void> => {
      const container = deps.di;
      container
        .get<JokeViewModel>(API_EXAMPLE_DI_TOKENS.VIEW_MODEL_JOKE)
        .dispose();
      return Promise.resolve();
    },
  },
];
