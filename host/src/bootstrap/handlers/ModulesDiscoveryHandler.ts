import { AbstractInitHandler } from './AbstractInitHandler';
import type { Bootstrap } from '..';
import type { AppStartResponse } from '../interface';
import { HttpMethod } from '@platform/core';
// Типы манифеста из единого источника
import type { ModuleManifestEntry } from '@platform/vite-config/plugins/types';
import type {
  Module,
  NormalModule,
  ModuleLoadType,
} from '../../modules/interface';
import type { ModuleConfig } from '../interface';

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
  private readonly moduleConfigs = import.meta.glob<{ default: ModuleConfig }>(
    '../../../../packages/*/src/config/module_config.ts',
    { eager: false },
  );

  async handle(bootstrap: Bootstrap): Promise<Bootstrap> {
    try {
      // 1. Загружаем манифест
      const manifest = await this.loadManifest(bootstrap);

      // 2. Сохраняем user данные для AccessControl
      if (manifest.user) {
        bootstrap.setUserData(manifest.user);
      }

      // 3. Обрабатываем модули из манифеста
      const manifestModules: ModuleManifestEntry[] = manifest.modules || [];
      const modules = await this.processModules(manifestModules);

      // 4. Сохраняем модули в Bootstrap
      bootstrap.setDiscoveredModules(modules);

      console.log(
        `[ModulesDiscoveryHandler] Discovered ${modules.length} modules`,
      );
    } catch (error) {
      console.error(
        '[ModulesDiscoveryHandler] Failed to load manifest:',
        error,
      );
      // В случае ошибки используем fallback (пустой список)
      // INIT модули загрузятся из локальных sources
      bootstrap.setDiscoveredModules([]);
    }

    return super.handle(bootstrap);
  }

  private async loadManifest(bootstrap: Bootstrap): Promise<AppStartResponse> {
    const apiClient = bootstrap.getAPIClient;
    return apiClient.request<never, AppStartResponse>({
      method: HttpMethod.GET,
      route: this.apiEndpoint,
    });
  }

  private async processModules(
    manifestEntries: ModuleManifestEntry[],
  ): Promise<Module[]> {
    const modules: Module[] = [];

    for (const entry of manifestEntries) {
      const module = await this.createModule(entry);
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
      } catch {
        // Если модуль не найден, пропускаем его с предупреждением
        console.warn(
          `[ModulesDiscoveryHandler] Skipping module ${moduleName}: module not found. ` +
            `Make sure the module exists in packages/${moduleName}/src/config/module_config.ts`,
        );
        return null;
      }
    } else {
      const remoteEntry = String(entry.remoteEntry);
      config = this.createRemoteConfigLoader(moduleName, remoteEntry);
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
    }

    return normalModule;
  }

  /**
   * Загружает конфиг LOCAL модуля через import.meta.glob
   * Используем предзагруженные модули для надежной работы в runtime
   * @throws Error если модуль не найден
   */
  private async loadLocalConfig(moduleName: string): Promise<ModuleConfig> {
    // Ищем модуль в предзагруженных конфигах
    // Путь должен соответствовать паттерну в import.meta.glob
    // От host/src/bootstrap/handlers/ до packages/{name}/src/config/module_config.ts
    const modulePath = `../../../../packages/${moduleName}/src/config/module_config.ts`;
    const moduleLoader = this.moduleConfigs[modulePath];

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
        `Module config not found for ${moduleName}. Available modules: ${availableModules}`,
      );
    }

    const module = await moduleLoader();
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
    // Возвращаем Promise который резолвится при загрузке через Federation
    // TODO: Реализовать в задаче 008 (RemoteModuleLoader)
    return Promise.reject(
      new Error(
        `Remote module loading not implemented yet. Module: ${moduleName}, Entry: ${remoteEntry}`,
      ),
    );
  }
}
