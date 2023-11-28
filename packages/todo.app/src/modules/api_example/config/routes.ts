import { IRoutes } from "@todo/core";
import { lazy } from "react";
import { Container } from "inversify";
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
    title: "API example",
    pageComponent: lazy(() => import("../view/ApiPage.tsx")),
    onEnter: async (router) => {
      const container = router.getDependencies().di as Container;

      await container.get<JokeViewModel>(JokeViewModel).getJoke();
    },
    onExit: (_router, container) => {
      container.get<JokeViewModel>(JokeViewModel).dispose();
    },
  },
];
