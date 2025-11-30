import { type IRoutes } from '@platform/core';
import { lazy } from 'react';
import type { LoadTaskListUsecase } from '../usecases/loadTaskList.usecase.ts';
import type { DisposeTaskListUsecase } from '../usecases/disposeTaskList.usecase.ts';
import { TODO_DI_TOKENS } from './di.tokens.ts';

export const TODO_ROUTES = {
  TODO: 'todo',
};

export const routes: IRoutes = [
  {
    name: TODO_ROUTES.TODO,
    path: '/todo',
    menu: {
      text: 'todo:menu.todo',
    },
    browserTitle: 'TODO example',
    pageComponent: lazy(() => import('../view/TodoPage.tsx')),
    onEnterNode: async (_toState, _fromState, deps): Promise<void> => {
      const container = deps.di;
      container
        .get<LoadTaskListUsecase>(TODO_DI_TOKENS.USECASE_LOAD_TASK_LIST)
        .execute();
      return Promise.resolve();
    },
    onExitNode: async (_toState, _fromState, deps): Promise<void> => {
      const container = deps.di;
      container
        .get<DisposeTaskListUsecase>(TODO_DI_TOKENS.USECASE_DISPOSE_TASK_LIST)
        .execute();
      return Promise.resolve();
    },
  },
];
