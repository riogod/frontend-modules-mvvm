import { type IRoutes } from "@todo/core";
import { lazy } from "react";
import { JokeViewModel } from "../viewmodels/joke.vm.ts";

export const API_ROUTES = {
  API: "api-example",
};

export const routes: IRoutes = [
  {
    name: API_ROUTES.API,
    path: "/api-example",
    menu: {
      text: "api:menu.api",
    },
    browserTitle: "API example",
    pageComponent: lazy(() => import("../view/ApiPage.tsx")),
    onEnterNode: async (_toState, _fromState, deps) => {
      const container = deps.di;
      await container.get<JokeViewModel>(JokeViewModel).getJoke();
    },
    onExitNode: async (_toState, _fromState, deps): Promise<void> => {
      const container = deps.di;
      container.get<JokeViewModel>(JokeViewModel).dispose();
      return Promise.resolve();
    },
  },
];
