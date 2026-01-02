import { type Bootstrap } from '..';
import { AbstractInitHandler } from './AbstractInitHandler';
import { log } from '@platform/core';
import { ModuleLoadType } from '../../modules/interface';
import { app_modules } from '../../modules/modules';

/**
 * Обработчик инициализации модулей приложения.
 * Инициализирует ModuleLoader и загружает только локальные INIT модули.
 * NORMAL модули регистрируются после загрузки манифеста через ManifestLoader.
 */
export class ModulesHandler extends AbstractInitHandler {
  async handle(bootstrap: Bootstrap): Promise<Bootstrap> {
    log.debug('ModulesHandler: starting', {
      prefix: 'bootstrap.handlers.ModulesHandler',
    });

    // Только локальные INIT модули
    const localInitModules = app_modules.filter(
      (m) => m.loadType === ModuleLoadType.INIT,
    );

    log.debug(
      `ModulesHandler: local INIT modules = ${localInitModules.length}`,
      { prefix: 'bootstrap.handlers.ModulesHandler' },
    );

    // Инициализируем ModuleLoader
    bootstrap.initModuleLoader();

    // Регистрируем только локальные INIT модули
    // NORMAL модули не регистрируем, так как они могут зависеть от
    // permissions и feature flags, которые загружаются из манифеста
    await bootstrap.moduleLoader.addModules(localInitModules);

    // Загружаем только локальные INIT модули
    log.debug('ModulesHandler: loading local INIT modules', {
      prefix: 'bootstrap.handlers.ModulesHandler',
    });
    await bootstrap.moduleLoader.initInitModules();
    log.debug('ModulesHandler: local INIT modules loaded', {
      prefix: 'bootstrap.handlers.ModulesHandler',
    });

    log.debug('ModulesHandler: completed', {
      prefix: 'bootstrap.handlers.ModulesHandler',
    });
    return await super.handle(bootstrap);
  }
}
