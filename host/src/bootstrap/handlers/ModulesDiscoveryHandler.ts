import { AbstractInitHandler } from './AbstractInitHandler';
import type { Bootstrap } from '..';
import type { AppStartResponse } from '../interface';
import type { AppStartDTO } from '../services/appStart/data/app.dto';
import { HttpMethod, log } from '@platform/core';
// Типы манифеста из единого источника
import type { ModuleManifestEntry } from '@platform/vite-config/plugins/types';
import type {
  Module,
  NormalModule,
  ModuleLoadType,
} from '../../modules/interface';
import type { ModuleConfig } from '../interface';
import { loadRemoteModule } from '../services/remoteModuleLoader';

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
      log.debug(
        `ModulesDiscoveryHandler: manifest loaded, modules=${(manifest.modules || []).length}, hasUser=${!!manifest.user}`,
        { prefix: 'bootstrap.handlers.ModulesDiscoveryHandler' },
      );

      // 2. Сохраняем user данные для AccessControl
      if (manifest.user) {
        bootstrap.setUserData(manifest.user);
      }

      // 4. Обрабатываем модули из манифеста
      const manifestModules: ModuleManifestEntry[] = manifest.modules || [];
      const modules = await this.processModules(manifestModules);
      log.debug(
        `ModulesDiscoveryHandler: processed modules = ${modules.length}`,
        { prefix: 'bootstrap.handlers.ModulesDiscoveryHandler' },
      );

      // 5. Сохраняем модули в Bootstrap
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

  private async loadManifest(bootstrap: Bootstrap): Promise<AppStartResponse> {
    log.debug('ModulesDiscoveryHandler: loading manifest', {
      prefix: 'bootstrap.handlers.ModulesDiscoveryHandler.loadManifest',
    });
    const apiClient = bootstrap.getAPIClient;
    const response = await apiClient.request<never, AppStartResponse>({
      method: HttpMethod.GET,
      route: this.apiEndpoint,
    });

    // Преобразуем AppStartResponse в AppStartDTO для сохранения
    // Если ответ уже имеет структуру AppStartDTO (с data), используем его
    // Иначе преобразуем AppStartResponse в AppStartDTO
    const manifestDTO = this.responseToDTO(response);

    // Сохраняем манифест для повторного использования
    bootstrap.setAppStartManifest(manifestDTO);

    return response;
  }

  /**
   * Преобразует AppStartResponse в AppStartDTO
   */
  private responseToDTO(response: AppStartResponse): AppStartDTO {
    // Если ответ уже имеет структуру AppStartDTO (с data), возвращаем как есть
    if (
      'data' in response &&
      response.data &&
      typeof response.data === 'object'
    ) {
      return response as unknown as AppStartDTO;
    }

    // Иначе преобразуем AppStartResponse в AppStartDTO
    // Извлекаем features и permissions из user данных, если они есть
    const features: Record<string, boolean> = {};
    const permissions: Record<string, boolean> = {};

    if (response.user) {
      // Преобразуем массивы строк в объекты Record<string, boolean>
      for (const flag of response.user.featureFlags || []) {
        features[flag] = true;
      }
      for (const perm of response.user.permissions || []) {
        permissions[perm] = true;
      }
    }

    return {
      status: 'success',
      data: {
        features,
        permissions,
        params: {},
        modules: response.modules || [],
      },
    };
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

    // Базовые поля модуля
    const baseModule = {
      name: String(entry.name),
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

    if (entry.loadType === 'init') {
      // INIT модули всегда локальные, их конфиги уже загружены
      // Они обрабатываются отдельно в ModulesHandler
      return null;
    }

    // NORMAL модули
    let config: ModuleConfig | Promise<ModuleConfig>;
    const moduleName = String(entry.name);

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
      loadType: 'normal' as ModuleLoadType.NORMAL,
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
   * @throws Error если модуль не найден
   */
  private async loadLocalConfig(moduleName: string): Promise<ModuleConfig> {
    log.debug('ModulesDiscoveryHandler: loading local config', {
      prefix: 'bootstrap.handlers.ModulesDiscoveryHandler.loadLocalConfig',
      moduleName: moduleName,
    });
    // Ищем модуль в предзагруженных конфигах
    // Путь должен соответствовать паттерну в import.meta.glob
    // От host/src/bootstrap/handlers/ до packages/{name}/src/config/module_config.ts
    // Теперь glob паттерн включает .ts, поэтому ключи будут с расширением
    const modulePath = `../../../../packages/${moduleName}/src/config/module_config.ts`;

    // Сначала ищем по точному пути
    let moduleLoader = this.moduleConfigs[modulePath];

    // Если не нашли, ищем по частичному совпадению (на случай разных форматов пути)
    if (!moduleLoader) {
      const availablePaths = Object.keys(this.moduleConfigs);
      const matchingPath = availablePaths.find((path) =>
        path.includes(`packages/${moduleName}/src/config/module_config`),
      );
      if (matchingPath) {
        log.debug(
          'ModulesDiscoveryHandler: using fallback path for local config',
          {
            prefix:
              'bootstrap.handlers.ModulesDiscoveryHandler.loadLocalConfig',
          },
          {
            moduleName,
            matchingPath,
          },
        );
        moduleLoader = this.moduleConfigs[matchingPath];
      }
    }

    if (!moduleLoader) {
      // Выводим доступные модули для отладки
      const availablePaths = Object.keys(this.moduleConfigs);
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
