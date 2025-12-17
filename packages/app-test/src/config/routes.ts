import { type IRoutes } from '@platform/core';
import { API_EXAMPLE_DI_TOKENS } from '@platform/module-api-example/config/di.tokens';
import type { JokeViewModel } from '@platform/module-api-example/viewmodels/joke.vm';
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
