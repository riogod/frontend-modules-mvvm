import { type Bootstrap } from '..';
import { AbstractInitHandler } from './AbstractInitHandler';
import { log } from '@platform/core';
import { type Module, ModuleLoadType } from '../../modules/interface';
import { app_modules } from '../../modules/modules';

/**
 * Обработчик инициализации локальных модулей приложения.
 * Инициализирует ModuleLoader и загружает INIT модули.
 * Использует discovered modules из манифеста (NORMAL модули) и локальные INIT модули.
 */
export class ModulesHandler extends AbstractInitHandler {
  async handle(bootstrap: Bootstrap): Promise<Bootstrap> {
    log.debug('ModulesHandler: starting', {
      prefix: 'bootstrap.handlers.ModulesHandler',
    });

    // Получаем discovered modules (NORMAL модули из манифеста)
    const discoveredModules = bootstrap.getDiscoveredModules();
    log.debug(
      `ModulesHandler: discovered NORMAL modules = ${discoveredModules.length}`,
      { prefix: 'bootstrap.handlers.ModulesHandler' },
    );

    // Загружаем INIT модули (они определены локально в modules.ts)
    const initModules = app_modules.filter(
      (m) => m.loadType === ModuleLoadType.INIT,
    );

    // Объединяем: INIT модули + discovered NORMAL модули
    const allModules: Module[] = [...initModules, ...discoveredModules];
    log.debug(
      `ModulesHandler: total modules to register = ${allModules.length} (INIT=${initModules.length}, NORMAL=${discoveredModules.length})`,
      { prefix: 'bootstrap.handlers.ModulesHandler' },
    );

    // Инициализируем ModuleLoader с зависимостями
    // Должен быть вызван после инициализации router и DI
    bootstrap.initModuleLoader();

    // Регистрируем все модули (INIT + discovered NORMAL)
    await bootstrap.moduleLoader.addModules(allModules);

    // Загружаем INIT модули перед preloadRoutes() (который вызывается в RouterPostHandler),
    // чтобы они могли установить feature flags и permissions, которые нужны для проверки
    // условий загрузки других модулей
    log.debug('ModulesHandler: loading INIT modules', {
      prefix: 'bootstrap.handlers.ModulesHandler',
    });
    await bootstrap.moduleLoader.initInitModules();
    log.debug('ModulesHandler: INIT modules loaded', {
      prefix: 'bootstrap.handlers.ModulesHandler',
    });

    log.debug('ModulesHandler: completed', {
      prefix: 'bootstrap.handlers.ModulesHandler',
    });
    return await super.handle(bootstrap);
  }
}
