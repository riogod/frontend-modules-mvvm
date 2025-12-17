import {
  type IMenuItem,
  type IRoutes,
  type RouterDependencies,
  log,
} from '@platform/core';
import { createRouter, type Router } from '@riogz/router';
import browserPlugin from '@riogz/router-plugin-browser';
import { findSegment } from '../../utils';

/**
 *  Сервис роутинга приложения.
 */
export class BootstrapRouterService {
  router: Router<RouterDependencies> = createRouter<RouterDependencies>();
  routes: IRoutes = [];
  private isInitialized: boolean = false;

  constructor() {
    log.debug('BootstrapRouterService: constructor', {
      prefix: 'bootstrap.routerService',
    });
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
    log.debug(
      `Initializing router with ${routes.length} routes, prefix: ${appPrefix}`,
      { prefix: 'bootstrap.routerService.initRouter' },
    );
    if (this.isInitialized) {
      log.error('Router has already been initialized', {
        prefix: 'bootstrap.routerService.initRouter',
      });
      throw new Error('Router has already been initialized');
    }

    this.addRoutes(routes);

    log.debug('Creating router instance', {
      prefix: 'bootstrap.routerService.initRouter',
    });
    this.router = createRouter<RouterDependencies>(this.routes, {
      allowNotFound: false,
      autoCleanUp: false,
      defaultRoute: '404',
    });
    log.debug('Router instance created', {
      prefix: 'bootstrap.routerService.initRouter',
    });

    log.debug(`Using browser plugin with base: "${appPrefix}"`, {
      prefix: 'bootstrap.routerService.initRouter',
    });
    this.router.usePlugin(
      browserPlugin({
        base: appPrefix,
        forceDeactivate: false,
      }),
    );
    log.debug('Browser plugin attached', {
      prefix: 'bootstrap.routerService.initRouter',
    });

    this.isInitialized = true;
    log.debug(`Router initialized with ${this.routes.length} total routes`, {
      prefix: 'bootstrap.routerService',
    });
  }

  /**
   *  Постобработчик роутера.
   * @param cb
   */
  routerPostInit(
    cb: (router: Router<RouterDependencies>) => Router<RouterDependencies>,
  ): void {
    log.debug('Running router post-init callback', {
      prefix: 'bootstrap.routerService',
    });
    this.router = cb(this.router);
    log.debug('Router post-init completed', {
      prefix: 'bootstrap.routerService',
    });
  }

  /**
   * Регистрирует маршруты в роутере и в массиве routes
   * Единая точка входа для регистрации маршрутов
   * Защищена от дублирования маршрутов
   *
   * @param {IRoutes} routes - Маршруты для регистрации.
   * @return {void}
   */
  registerRoutes(routes: IRoutes): void {
    log.debug(
      `Registering ${routes.length} routes (current total: ${this.routes.length})`,
      {
        prefix: 'bootstrap.routerService.registerRoutes',
      },
    );
    // Фильтруем только новые маршруты (которых еще нет в routes)
    log.debug('Filtering new routes', {
      prefix: 'bootstrap.routerService.registerRoutes',
    });
    const newRoutes = routes.filter((route) => {
      return !this.routes.some((r) => r.name === route.name);
    });

    if (newRoutes.length === 0) {
      log.debug('All routes already registered, skipping', {
        prefix: 'bootstrap.routerService',
      });
      return;
    }

    log.debug(
      `Adding ${newRoutes.length} new routes (${routes.length - newRoutes.length} duplicates skipped)`,
      { prefix: 'bootstrap.routerService' },
    );
    // Добавляем в массив routes
    this.addRoutes(newRoutes);

    // Добавляем в роутер
    log.debug('Adding routes to router instance', {
      prefix: 'bootstrap.routerService.registerRoutes',
    });
    this.router.add(newRoutes);
    log.debug(`Routes registered, total routes: ${this.routes.length}`, {
      prefix: 'bootstrap.routerService.registerRoutes',
    });
  }

  /**
   * Добавление маршрутов в массив routes
   * Проверяет на дубликаты по имени маршрута перед добавлением
   * @param nodes
   */
  addRoutes(nodes: IRoutes): void {
    log.debug(
      `Adding ${nodes.length} routes to routes array (current: ${this.routes.length})`,
      {
        prefix: 'bootstrap.routerService.addRoutes',
      },
    );
    let addedCount = 0;
    let skippedCount = 0;
    for (const route of nodes) {
      // Проверяем, не добавлен ли уже маршрут с таким именем
      const existingRoute = this.routes.find((r) => r.name === route.name);
      if (!existingRoute) {
        this.routes.push(route);
        addedCount++;
        log.debug(`Route "${route.name}" added`, {
          prefix: 'bootstrap.routerService.addRoutes',
        });
      } else {
        skippedCount++;
        log.debug(`Route "${route.name}" already exists, skipping`, {
          prefix: 'bootstrap.routerService.addRoutes',
        });
      }
    }
    log.debug(
      `Routes added: ${addedCount}, skipped (duplicates): ${skippedCount}`,
      { prefix: 'bootstrap.routerService' },
    );
  }

  /**
   * Строит массив меню для ui из маршрутов роутера
   * @param routesConfig
   */
  buildRoutesMenu(routesConfig: IRoutes, lastid: number = 0): IMenuItem[] {
    log.debug(
      `Building menu from ${routesConfig.length} routes (lastid: ${lastid})`,
      {
        prefix: 'bootstrap.routerService.buildRoutesMenu',
      },
    );
    const menuConfig: IMenuItem[] = [];
    let menuItemsCount = 0;
    let skippedCount = 0;

    for (const route of routesConfig) {
      if (!route.menu) {
        skippedCount++;
        log.debug(`Route "${route.name}" has no menu config, skipping`, {
          prefix: 'bootstrap.routerService.buildRoutesMenu',
        });
        continue;
      }
      menuItemsCount++;

      const routePath = route.name.split('.');
      routePath.pop();

      if (routePath.length > 0) {
        log.debug(
          `Processing nested route "${route.name}" with path: ${routePath.join('.')}`,
          {
            prefix: 'bootstrap.routerService.buildRoutesMenu',
          },
        );
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
        log.debug(`Nested menu item "${route.menu.text}" added`, {
          prefix: 'bootstrap.routerService.buildRoutesMenu',
        });
      } else {
        log.debug(`Processing root route "${route.name}"`, {
          prefix: 'bootstrap.routerService.buildRoutesMenu',
        });
        const hasChildren = !!route.children;
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
        if (hasChildren) {
          log.debug(`Root menu item "${route.menu.text}" added with children`, {
            prefix: 'bootstrap.routerService.buildRoutesMenu',
          });
        } else {
          log.debug(`Root menu item "${route.menu.text}" added`, {
            prefix: 'bootstrap.routerService.buildRoutesMenu',
          });
        }
      }
      lastid++;
    }

    log.debug(
      `Menu built: ${menuItemsCount} items from ${routesConfig.length} routes (${skippedCount} skipped, lastid: ${lastid})`,
      { prefix: 'bootstrap.routerService.buildRoutesMenu' },
    );
    return menuConfig;
  }
}
