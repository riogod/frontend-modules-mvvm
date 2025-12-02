import { type Bootstrap } from '..';
import { AbstractInitHandler } from './AbstractInitHandler';
import { log } from '@platform/core';
import { type Module, ModuleLoadType } from '../../modules/interface';
import { app_modules } from '../../modules/modules';

/**
 * Обработчик инициализации модулей приложения.
 * Инициализирует ModuleLoader и загружает INIT модули.
 * Использует discovered modules из манифеста (INIT и NORMAL модули) и локальные INIT модули из modules.ts.
 */
export class ModulesHandler extends AbstractInitHandler {
  async handle(bootstrap: Bootstrap): Promise<Bootstrap> {
    log.debug('ModulesHandler: starting', {
      prefix: 'bootstrap.handlers.ModulesHandler',
    });

    // Получаем discovered modules из манифеста (могут быть как INIT, так и NORMAL)
    const discoveredModules = bootstrap.getDiscoveredModules();
    
    // Разделяем discovered modules на INIT и NORMAL
    const discoveredInitModules = discoveredModules.filter(
      (m) => m.loadType === ModuleLoadType.INIT,
    );
    const discoveredNormalModules = discoveredModules.filter(
      (m) => m.loadType !== ModuleLoadType.INIT,
    );
    
    log.debug(
      `ModulesHandler: discovered modules = ${discoveredModules.length} (INIT=${discoveredInitModules.length}, NORMAL=${discoveredNormalModules.length})`,
      { prefix: 'bootstrap.handlers.ModulesHandler' },
    );

    // Загружаем INIT модули (из локальных modules.ts + из манифеста)
    const localInitModules = app_modules.filter(
      (m) => m.loadType === ModuleLoadType.INIT,
    );
    
    // Объединяем INIT модули: локальные + из манифеста
    // Убираем дубликаты по имени (приоритет у локальных)
    const allInitModules: Module[] = [
      ...localInitModules,
      ...discoveredInitModules.filter(
        (discovered) =>
          !localInitModules.some((local) => local.name === discovered.name),
      ),
    ];

    // Объединяем: INIT модули + discovered NORMAL модули
    const allModules: Module[] = [...allInitModules, ...discoveredNormalModules];
    log.debug(
      `ModulesHandler: total modules to register = ${allModules.length} (INIT=${allInitModules.length}, NORMAL=${discoveredNormalModules.length})`,
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
