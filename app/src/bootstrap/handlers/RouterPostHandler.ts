import { AbstractInitHandler } from './AbstractInitHandler';
import { Bootstrap } from '..';

/**
 * Обработчик пост инициализации роутера.
 * Выполняет предварительную загрузку маршрутов из всех модулей и настраивает роутер.
 */
export class RouterPostHandler extends AbstractInitHandler {
  async handle(bootstrap: Bootstrap): Promise<Bootstrap> {
    // Предварительная загрузка маршрутов и i18n из всех модулей
    // Вызывается после инициализации i18n (в InitI18nHandler) и загрузки INIT модулей (в ModulesHandler), чтобы:
    // 1. i18n.addResourceBundle был доступен
    // 2. INIT модули могли установить feature flags и permissions для других модулей
    // Это необходимо для регистрации всех маршрутов в роутере и загрузки i18n до старта приложения
    // Для модулей с условиями загрузки - проверяет условия перед загрузкой маршрутов
    // Для модулей с динамическим конфигом (Promise) - конфигурация загружается при первом обращении
    await bootstrap.moduleLoader.preloadRoutes();

    const { routerPostInit } = this.params;
    if (routerPostInit) {
      bootstrap.routerService.routerPostInit(routerPostInit);
    }
    const appMenu = bootstrap.routerService.buildRoutesMenu(
      bootstrap.routerService.routes,
    );

    bootstrap.routerService.router.setDependencies({
      di: bootstrap.di,
      menu: appMenu,
    });

    return await super.handle(bootstrap);
  }
}
