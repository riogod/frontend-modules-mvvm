import { AbstractInitHandler } from './AbstractInitHandler';
import type { Bootstrap } from '..';
import type { AppStartDTO } from '../services/appStart/data/app.dto';
import { HttpMethod, log } from '@platform/core';
// Типы манифеста из единого источника
import type { ModuleManifestEntry } from '@platform/vite-config/plugins/types';
import type { Module, NormalModule, InitModule } from '../../modules/interface';
import { ModuleLoadType } from '../../modules/interface';
import type { ModuleConfig } from '../interface';
import { loadRemoteModule } from '../services/moduleLoader';

/**
 * Handler для загрузки и обработки манифеста модулей
 *
 * Выполняет:
 * 1. Загрузку манифеста с /app/start
 * 2. Определение способа загрузки для каждого модуля (LOCAL/REMOTE)
 * 3. Создание объектов Module с конфигами
 * 4. Сохранение user данных в Bootstrap для AccessControl
 */
export class ModulesDiscoveryHandler extends AbstractInitHandler {
  private readonly apiEndpoint = '/app/start';

  // Предзагружаем все модули из packages/ для динамической загрузки
  // Используем import.meta.glob для статического анализа всех модулей
  // Путь относительно host/src/bootstrap/handlers/ModulesDiscoveryHandler.ts
  // От host/src/bootstrap/handlers/ до packages/ это ../../../../packages/
  // Указываем расширение .ts явно для надежности
  private readonly moduleConfigs = import.meta.glob<{ default: ModuleConfig }>(
    '../../../../packages/*/src/config/module_config.ts',
    { eager: false },
  );

  async handle(bootstrap: Bootstrap): Promise<Bootstrap> {
    try {
      // 1. Загружаем манифест (он автоматически сохраняется в loadManifest)
      const manifest = await this.loadManifest(bootstrap);

      // AppStartDTO: { status, data: { modules, features, permissions, params } }
      const modulesList = manifest.data?.modules || [];

      log.debug(
        `ModulesDiscoveryHandler: manifest loaded, modules=${modulesList.length}`,
        { prefix: 'bootstrap.handlers.ModulesDiscoveryHandler' },
      );

      // 2. Обрабатываем модули из манифеста
      const modules = await this.processModules(modulesList);
      log.debug(
        `ModulesDiscoveryHandler: processed modules = ${modules.length}`,
        { prefix: 'bootstrap.handlers.ModulesDiscoveryHandler' },
      );

      // 3. Сохраняем модули в Bootstrap
      bootstrap.setDiscoveredModules(modules);
    } catch (error) {
      log.error(
        'ModulesDiscoveryHandler: failed to load manifest',
        {
          prefix: 'bootstrap.handlers.ModulesDiscoveryHandler',
        },
        {
          error,
        },
      );
      // В случае ошибки используем fallback (пустой список)
      // INIT модули загрузятся из локальных sources
      bootstrap.setDiscoveredModules([]);
    }

    log.debug('ModulesDiscoveryHandler: completed', {
      prefix: 'bootstrap.handlers.ModulesDiscoveryHandler',
    });
    return super.handle(bootstrap);
  }

  private async loadManifest(bootstrap: Bootstrap): Promise<AppStartDTO> {
    log.debug('ModulesDiscoveryHandler: loading manifest', {
      prefix: 'bootstrap.handlers.ModulesDiscoveryHandler.loadManifest',
    });
    const apiClient = bootstrap.getAPIClient;

    const response = await apiClient.request<never, AppStartDTO>({
      method: HttpMethod.GET,
      route: this.apiEndpoint,
    });

    // Сохраняем манифест для повторного использования
    bootstrap.setAppStartManifest(response);

    return response;
  }

  private async processModules(
    manifestEntries: ModuleManifestEntry[],
  ): Promise<Module[]> {
    log.debug('ModulesDiscoveryHandler: processing modules', {
      prefix: 'bootstrap.handlers.ModulesDiscoveryHandler.processModules',
    });
    const modules: Module[] = [];

    for (const entry of manifestEntries) {
      const module = await this.createModule(entry);
      log.debug(
        'ModulesDiscoveryHandler: creating module',
        {
          prefix:
            'bootstrap.handlers.ModulesDiscoveryHandler.processModules.createModule',
        },
        {
          moduleName: entry.name,
        },
      );
      if (module) {
        modules.push(module);
      }
    }

    return modules;
  }

  private async createModule(
    entry: ModuleManifestEntry,
  ): Promise<Module | null> {
    const isLocal = entry.remoteEntry === '';

    const moduleName = String(entry.name);

    // INIT модули - могут быть как локальными, так и remote
    // Приводим к строке для сравнения, так как данные из API могут быть строками
    const loadType = String(entry.loadType);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
    if (loadType === ModuleLoadType.INIT) {
      let config: ModuleConfig | Promise<ModuleConfig>;

      if (isLocal) {
        try {
          config = await this.loadLocalConfig(moduleName);
        } catch (error) {
          log.warn(
            `ModulesDiscoveryHandler: skipping INIT module ${moduleName}: module not found. ` +
              `Make sure the module exists in packages/${moduleName}/src/config/module_config.ts`,
            {
              prefix: 'bootstrap.handlers.ModulesDiscoveryHandler.createModule',
            },
            {
              error,
              moduleName: entry.name,
            },
          );
          return null;
        }
      } else {
        // добавляем cache-buster для избежания кеширования remoteEntry.js
        const remoteEntry = String(entry.remoteEntry) + '?v=' + Date.now();
        config = this.createRemoteConfigLoader(moduleName, remoteEntry);
        log.debug(
          'ModulesDiscoveryHandler: remote INIT config loader created',
          {
            prefix: 'bootstrap.handlers.ModulesDiscoveryHandler.createModule',
          },
          {
            moduleName: entry.name,
            remoteEntry,
          },
        );
      }

      const initModule: InitModule = {
        name: moduleName,
        loadType: ModuleLoadType.INIT,
        loadPriority: entry.loadPriority || 1,
        config,
      };

      // Добавляем remote info для REMOTE INIT модулей
      if (!isLocal) {
        initModule.remote = {
          entry: entry.remoteEntry,
          scope: `module-${moduleName}`,
        };
      }

      log.debug('ModulesDiscoveryHandler: INIT module created', {
        prefix: 'bootstrap.handlers.ModulesDiscoveryHandler.createModule',
        moduleName: entry.name,
        initModule,
      });

      return initModule;
    }

    // NORMAL модули
    const baseModule = {
      name: moduleName,
      loadPriority: entry.loadPriority || 1,
      loadCondition: {
        dependencies: entry.dependencies || [],
        featureFlags: entry.featureFlags || [],
        accessPermissions: entry.accessPermissions || [],
      },
    };

    log.debug('ModulesDiscoveryHandler: base module created', {
      prefix: 'bootstrap.handlers.ModulesDiscoveryHandler.createModule',
      moduleName: entry.name,
      baseModule,
    });

    let config: ModuleConfig | Promise<ModuleConfig>;

    if (isLocal) {
      try {
        config = await this.loadLocalConfig(moduleName);
      } catch (error) {
        // Если модуль не найден, пропускаем его с предупреждением
        log.warn(
          `ModulesDiscoveryHandler: skipping module ${moduleName}: module not found. ` +
            `Make sure the module exists in packages/${moduleName}/src/config/module_config.ts`,
          {
            prefix: 'bootstrap.handlers.ModulesDiscoveryHandler.createModule',
          },
          {
            error,
            moduleName: entry.name,
          },
        );
        return null;
      }
    } else {
      const remoteEntry = String(entry.remoteEntry);
      config = this.createRemoteConfigLoader(moduleName, remoteEntry);
      log.debug(
        'ModulesDiscoveryHandler: remote config loader created',
        {
          prefix: 'bootstrap.handlers.ModulesDiscoveryHandler.createModule',
        },
        {
          moduleName: entry.name,
          remoteEntry,
        },
      );
    }

    const normalModule: NormalModule = {
      ...baseModule,
      loadType: ModuleLoadType.NORMAL,
      config,
    };

    // Добавляем remote info для REMOTE модулей
    if (!isLocal) {
      normalModule.remote = {
        entry: entry.remoteEntry,
        scope: `module-${entry.name}`,
      };
      log.debug(
        'ModulesDiscoveryHandler: remote module created',
        {
          prefix: 'bootstrap.handlers.ModulesDiscoveryHandler.createModule',
        },
        {
          moduleName: entry.name,
          normalModule,
        },
      );
    }

    return normalModule;
  }

  /**
   * Загружает конфиг LOCAL модуля через import.meta.glob
   * Используем предзагруженные модули для надежной работы в runtime
   *
   * Примечание: import.meta.glob() возвращает абсолютные пути файловой системы
   * в качестве ключей объекта, а не относительные пути. Поэтому мы ищем
   * по частичному совпадению пути, который содержит имя модуля.
   *
   * @throws Error если модуль не найден
   */
  private async loadLocalConfig(moduleName: string): Promise<ModuleConfig> {
    log.debug('ModulesDiscoveryHandler: loading local config', {
      prefix: 'bootstrap.handlers.ModulesDiscoveryHandler.loadLocalConfig',
      moduleName: moduleName,
    });

    // import.meta.glob() возвращает абсолютные пути файловой системы в качестве ключей
    // Ищем по частичному совпадению, которое содержит имя модуля и путь к конфигу
    const availablePaths = Object.keys(this.moduleConfigs);
    const matchingPath = availablePaths.find((path) =>
      path.includes(`packages/${moduleName}/src/config/module_config`),
    );

    if (!matchingPath) {
      // Выводим доступные модули для отладки
      const availableModules =
        availablePaths.length > 0
          ? availablePaths
              .map((p) => {
                const match = p.match(/packages\/([^/]+)\//);
                return match ? match[1] : null;
              })
              .filter((m): m is string => m !== null)
              .join(', ')
          : 'none';

      throw new Error(
        `Module config not found for ${moduleName}. Available modules: ${availableModules}. Available paths: ${availablePaths.join(', ')}`,
      );
    }

    log.debug(
      'ModulesDiscoveryHandler: found module config path',
      {
        prefix: 'bootstrap.handlers.ModulesDiscoveryHandler.loadLocalConfig',
      },
      {
        moduleName,
        matchingPath,
      },
    );

    const moduleLoader = this.moduleConfigs[matchingPath];
    const module = await moduleLoader();
    log.debug('ModulesDiscoveryHandler: local config module loaded', {
      prefix: 'bootstrap.handlers.ModulesDiscoveryHandler.loadLocalConfig',
      moduleName,
    });
    return module.default;
  }

  /**
   * Создает lazy loader для REMOTE модуля
   * Фактическая загрузка происходит при первом обращении
   */
  private createRemoteConfigLoader(
    moduleName: string,
    remoteEntry: string,
  ): Promise<ModuleConfig> {
    log.debug('ModulesDiscoveryHandler: creating remote config loader', {
      prefix:
        'bootstrap.handlers.ModulesDiscoveryHandler.createRemoteConfigLoader',
      moduleName,
      remoteEntry,
    });

    return loadRemoteModule(moduleName, remoteEntry, {
      retries: 3,
      timeout: 15000,
      retryDelay: 2000,
    });
  }
}
