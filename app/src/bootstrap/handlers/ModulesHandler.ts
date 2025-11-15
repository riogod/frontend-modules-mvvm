import { Bootstrap } from "..";
import { AbstractInitHandler } from "./AbstractInitHandler";
import { log } from "@todo/core";

/**
 * Обработчик инициализации локальных модулей приложения.
 * Инициализирует ModuleLoader и загружает INIT модули.
 */
export class ModulesHandler extends AbstractInitHandler {
  async handle(bootstrap: Bootstrap): Promise<Bootstrap> {
    log.debug('ModulesHandler: starting', { prefix: 'bootstrap.handlers' });
    // Инициализируем ModuleLoader с зависимостями и ждем добавления всех модулей
    // Должен быть вызван после инициализации router и DI
    await bootstrap.initModuleLoader();

    // Загружаем INIT модули перед preloadRoutes() (который вызывается в RouterPostHandler),
    // чтобы они могли установить feature flags и permissions, которые нужны для проверки
    // условий загрузки других модулей
    log.debug('ModulesHandler: loading INIT modules', { prefix: 'bootstrap.handlers' });
    await bootstrap.moduleLoader.initInitModules();
    log.debug('ModulesHandler: INIT modules loaded', { prefix: 'bootstrap.handlers' });

    log.debug('ModulesHandler: completed', { prefix: 'bootstrap.handlers' });
    return await super.handle(bootstrap);
  }
}
