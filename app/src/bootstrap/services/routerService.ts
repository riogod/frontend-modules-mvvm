import {
  IMenuItem,
  IRoutes,
  RouterDependencies,
} from '@todo/core';
import { createRouter, Router } from '@riogz/router';
import browserPlugin from '@riogz/router-plugin-browser';
import { findSegment } from '../utils.ts';

/**
 *  Сервис роутинга приложения.
 */
export class BootstrapRouterService {
  router: Router<RouterDependencies> = createRouter<RouterDependencies>();
  routes: IRoutes = [];
  private isInitialized: boolean = false;

  constructor() {
    return this;
  }

  /**
   * Инициализация роутера
   *
   * @param {IRoutes} routes - The routes to be added to the router.
   * @param {string} appPrefix - The prefix for the application.
   * @return {void} This function does not return anything.
   */
  initRouter(routes: IRoutes, appPrefix: string): void {
    if (this.isInitialized) {
      throw new Error('Router has already been initialized');
    }

    this.addRoutes(routes);

    this.router = createRouter<RouterDependencies>(this.routes, {
      allowNotFound: false,
      autoCleanUp: false,
      defaultRoute: '404',
    });

    this.router.usePlugin(
      browserPlugin({
        base: appPrefix,
        forceDeactivate: false,
      }),
    );

    this.isInitialized = true;
  }

  /**
   *  Постобработчик роутера.
   * @param cb
   */
  routerPostInit(
    cb: (
      router: Router<RouterDependencies>,
    ) => Router<RouterDependencies>,
  ): void {
    this.router = cb(this.router);
  }

  /**
   * Добавление маршрутов в роутер
   * @param nodes
   */
  addRoutes(nodes: IRoutes): void {
    this.routes.push(...nodes);
  }

  /**
   * Строит массив меню для ui из маршрутов роутера
   * @param routesConfig
   */
  buildRoutesMenu(routesConfig: IRoutes, lastid: number = 0): IMenuItem[] {
    const menuConfig: IMenuItem[] = [];

    for (const route of routesConfig) {
      if (!route.menu) {
        continue;
      }

      const routePath = route.name.split('.');
      routePath.pop();

      if (routePath.length > 0) {
        const path = findSegment(menuConfig, routePath);
        let current = menuConfig;

        for (const key of path) {
          if (!current[parseInt(key)].children) {
            current[parseInt(key)].children = [];
          }
          current = current[parseInt(key)].children || [];
        }
        current.push({
          id: lastid.toString(),
          path: route.name,
          text: route.menu.text,
          icon: route.menu.icon,
          sortOrder: route.menu.sortOrder,
          navigate: route.menu.navigate,
          pageComponent: route.pageComponent,
          menuAlwaysExpand: route.menu.menuAlwaysExpand,
        });
      } else {
        menuConfig.push({
          id: lastid.toString(),
          path: route.name,
          text: route.menu.text,
          icon: route.menu.icon,
          sortOrder: route.menu.sortOrder,
          navigate: route.menu.navigate,
          pageComponent: route.pageComponent,
          menuAlwaysExpand: route.menu.menuAlwaysExpand,
          children:
            route.children &&
            this.buildRoutesMenu(route.children, ++lastid * 50),
        });
      }
      lastid++;
    }

    return menuConfig;
  }
}
