import { Bootstrap } from "..";
import { AbstractInitHandler } from "./AbstractInitHandler";

/**
 * Обработчик инициализации локальных модулей приложения.
 * Инициализирует ModuleLoader и загружает INIT модули.
 */
export class ModulesHandler extends AbstractInitHandler {
  async handle(bootstrap: Bootstrap): Promise<Bootstrap> {
    // Инициализируем ModuleLoader с зависимостями
    // Должен быть вызван после инициализации router и DI
    bootstrap.initModuleLoader();

    // Загружаем INIT модули перед preloadRoutes() (который вызывается в RouterPostHandler),
    // чтобы они могли установить feature flags и permissions, которые нужны для проверки
    // условий загрузки других модулей
    await bootstrap.moduleLoader.initInitModules();

    return await super.handle(bootstrap);
  }
}
