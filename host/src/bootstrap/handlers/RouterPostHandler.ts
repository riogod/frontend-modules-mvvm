import { AbstractInitHandler } from './AbstractInitHandler';
import { type Bootstrap } from '..';
import { log } from '@platform/core';

/**
 * Обработчик пост инициализации роутера.
 * Выполняет предварительную загрузку маршрутов из всех модулей и настраивает роутер.
 */
export class RouterPostHandler extends AbstractInitHandler {
  async handle(bootstrap: Bootstrap): Promise<Bootstrap> {
    log.debug('RouterPostHandler: starting', {
      prefix: 'bootstrap.handlers.RouterPostHandler',
    });
    // Предварительная загрузка маршрутов и i18n из всех модулей
    // Вызывается после инициализации i18n (в InitI18nHandler) и загрузки INIT модулей (в ModulesHandler), чтобы:
    // 1. i18n.addResourceBundle был доступен
    // 2. INIT модули могли установить feature flags и permissions для других модулей
    // Это необходимо для регистрации всех маршрутов в роутере и загрузки i18n до старта приложения
    // Для модулей с условиями загрузки - проверяет условия перед загрузкой маршрутов
    // Для модулей с динамическим конфигом (Promise) - конфигурация загружается при первом обращении
    log.debug('RouterPostHandler: preloading routes from all modules', {
      prefix: 'bootstrap.handlers.RouterPostHandler',
    });
    await bootstrap.moduleLoader.preloadRoutes();
    log.debug(
      `RouterPostHandler: routes preloaded, total routes: ${bootstrap.routerService.routes.length}`,
      { prefix: 'bootstrap.handlers.RouterPostHandler' },
    );

    const { routerPostInit } = this.params;
    if (routerPostInit) {
      bootstrap.routerService.routerPostInit(routerPostInit);
      log.debug('RouterPostHandler: routerPostInit callback executed', {
        prefix: 'bootstrap.handlers.RouterPostHandler',
      });
    }
    const appMenu =
      bootstrap.routerService.buildRoutesMenu(bootstrap.routerService.routes) ||
      [];
    log.debug(`RouterPostHandler: menu built with ${appMenu.length} items`, {
      prefix: 'bootstrap.handlers.RouterPostHandler',
    });

    bootstrap.routerService.router.setDependencies({
      di: bootstrap.di,
      menu: appMenu,
    });

    log.debug('RouterPostHandler: completed', {
      prefix: 'bootstrap.handlers.RouterPostHandler',
    });
    return await super.handle(bootstrap);
  }
}
