import { Router } from "router5";

import { i18nOptions } from "./i18n.ts";

export const appConfig = {
  apiUrl: import.meta.env.VITE_API_URL,
  appPrefix: import.meta.env.VITE_APP_PREFIX || "",

  i18nOptions,
  routes: [],
  routerPostInit: (
    router: Router<Record<string, any>>,
  ): Router<Record<string, any>> => router,
};
