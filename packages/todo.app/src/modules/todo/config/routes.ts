import { IRoutes } from "@todo/core";
import { lazy } from "react";

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
    title: "TODO example",
    pageComponent: lazy(() => import("../view/TodoPage.tsx")),
  },
];
