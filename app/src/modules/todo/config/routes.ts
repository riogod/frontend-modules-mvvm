import { IRoutes } from "@todo/core";
import { lazy } from "react";
import { LoadTaskListUsecase } from "../usecases/loadTaskList.usecase.ts";
import { DisposeTaskListUsecase } from "../usecases/disposeTaskList.usecase.ts";

export const TODO_ROUTES = {
  TODO: "todo",
};

export const routes: IRoutes = [
  {
    name: TODO_ROUTES.TODO,
    path: "/todo",
    menu: {
      text: "todo:menu.todo",
    },
    browserTitle: "TODO example",
    pageComponent: lazy(() => import("../view/TodoPage.tsx")),
    onEnterNode: async (_toState, _fromState, deps): Promise<void> => {
      const container = deps.di;
      container.get<LoadTaskListUsecase>(LoadTaskListUsecase).execute();
      return Promise.resolve();
    },
    onExitNode: async (_toState, _fromState, deps): Promise<void> => {
      const container = deps.di;
      container.get<DisposeTaskListUsecase>(DisposeTaskListUsecase).execute();
      return Promise.resolve();
    },
  },
];
