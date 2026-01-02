/**
 * Сервис для загрузки и обработки манифеста приложения.
 *
 * Загружает манифест с сервера и обрабатывает модули из манифеста.
 * Используется после bootstrap для загрузки MFE модулей.
 *
 * @module services/manifestLoader
 */

import { HttpMethod, log, IOC_CORE_TOKENS } from '@platform/core';
import type { APIClient } from '@platform/core';
import type { AppStartDTO } from '../appStart/data/app.dto';
import type { ModuleManifestEntry } from '@platform/vite-config/plugins/types';
import type { Module, NormalModule } from '../../../modules/interface';
import { ModuleLoadType } from '../../../modules/interface';
import type { ModuleConfig } from '../../interface';
import type { Bootstrap } from '../../index';
import type { ModuleLoader } from '../moduleLoader/core/ModuleLoader';
import { loadRemoteModule } from '../moduleLoader';
import type { AccessControlModel, AppParamsModel } from '@platform/common';
import { app_modules } from '../../../modules/modules';

/** Префикс для логирования */
const LOG_PREFIX = 'manifestLoader';

/**
 * Сервис для загрузки и обработки манифеста приложения.
 */
export class ManifestLoader {
  private readonly apiEndpoint = '/app/start';

  // Предзагружаем все модули из packages/ для динамической загрузки
  // Используем import.meta.glob для статического анализа всех модулей
  // Путь относительно host/src/bootstrap/services/manifestLoader/ManifestLoader.ts
  // От host/src/bootstrap/services/manifestLoader/ до packages/ это ../../../../../packages/
  private readonly moduleConfigs = import.meta.glob<{ default: ModuleConfig }>(
    '../../../../../packages/*/src/config/module_config.ts',
    { eager: false },
  );

  constructor(
    private apiClient: APIClient,
    private moduleLoader: ModuleLoader,
    private bootstrap: Bootstrap,
  ) {
    log.debug('ManifestLoader: инициализация', { prefix: LOG_PREFIX });
  }

  /**
   * Загружает манифест с сервера.
   *
   * @returns Манифест или null при ошибке
   */
  async loadManifest(): Promise<AppStartDTO | null> {
    try {
      log.debug('ManifestLoader: загрузка манифеста', { prefix: LOG_PREFIX });

      const manifest = await this.loadManifestFromAPI();

      // Сохраняем манифест
      this.bootstrap.setAppStartManifest(manifest);

      // Обновляем данные пользователя
      this.updateUserData(manifest);

      log.debug('ManifestLoader: манифест загружен', { prefix: LOG_PREFIX });
      return manifest;
    } catch (error) {
      log.warn(
        'ManifestLoader: не удалось загрузить манифест',
        { prefix: LOG_PREFIX },
        error,
      );
      return null; // Graceful degradation
    }
  }

  /**
   * Обрабатывает модули из манифеста и добавляет их в ModuleLoader.
   *
   * @param manifest - Манифест приложения
   */
  async processManifestModules(manifest: AppStartDTO): Promise<void> {
    const modulesList = manifest.data?.modules || [];

    log.debug(
      `ManifestLoader: обработка ${modulesList.length} модулей из манифеста`,
      { prefix: LOG_PREFIX },
    );

    // Создаем объекты Module из манифеста
    const modules = await this.createModulesFromManifest(modulesList);

    // Фильтруем только NORMAL модули (INIT модулей в манифесте нет)
    const normalModules = modules.filter(
      (m) => m.loadType !== ModuleLoadType.INIT,
    );

    // Получаем локальные NORMAL модули
    const localNormalModules = app_modules.filter(
      (m) => m.loadType !== ModuleLoadType.INIT,
    );

    // Объединяем NORMAL модули: локальные + из манифеста
    // Убираем дубликаты по имени (приоритет у локальных)
    const allNormalModules = [
      ...localNormalModules,
      ...normalModules.filter(
        (discovered) =>
          !localNormalModules.some((local) => local.name === discovered.name),
      ),
    ];

    log.debug(
      `ManifestLoader: всего NORMAL модулей для регистрации: ${allNormalModules.length} (локальных: ${localNormalModules.length}, из манифеста: ${normalModules.length})`,
      { prefix: LOG_PREFIX },
    );

    // Сохраняем discovered modules
    this.bootstrap.setDiscoveredModules(modules);

    // Регистрируем NORMAL модули (локальные + из манифеста)
    // Теперь у нас есть permissions и feature flags из манифеста
    this.moduleLoader.addNormalModulesFromManifest(allNormalModules);

    // Предзагружаем маршруты новых модулей
    log.debug('ManifestLoader: предзагрузка маршрутов новых модулей', {
      prefix: LOG_PREFIX,
    });
    await this.moduleLoader.preloadRoutes();

    // Пересчитываем меню с учетом новых маршрутов
    log.debug('ManifestLoader: пересчет меню', { prefix: LOG_PREFIX });
    const appMenu =
      this.bootstrap.routerService.buildRoutesMenu(
        this.bootstrap.routerService.routes,
      ) || [];

    log.debug(
      `ManifestLoader: меню пересчитано, элементов: ${appMenu.length}`,
      { prefix: LOG_PREFIX },
    );

    // Обновляем меню в роутере
    this.bootstrap.routerService.router.setDependencies({
      di: this.bootstrap.di,
      menu: appMenu,
    });

    log.debug('ManifestLoader: меню обновлено в роутере', {
      prefix: LOG_PREFIX,
    });
  }

  /**
   * Загружает манифест с API.
   */
  private async loadManifestFromAPI(): Promise<AppStartDTO> {
    const response = await this.apiClient.request<never, AppStartDTO>({
      method: HttpMethod.GET,
      route: this.apiEndpoint,
    });
    return response;
  }

  /**
   * Обновляет данные пользователя из манифеста.
   */
  private updateUserData(manifest: AppStartDTO): void {
    const accessControlModel = this.bootstrap.di.get<AccessControlModel>(
      IOC_CORE_TOKENS.MODEL_ACCESS_CONTROL,
    );
    const appParamsModel = this.bootstrap.di.get<AppParamsModel>(
      IOC_CORE_TOKENS.MODEL_APP_PARAMS,
    );

    if (manifest.data) {
      accessControlModel.setFeatureFlags(manifest.data.features || {});
      accessControlModel.setPermissions(manifest.data.permissions || {});
      appParamsModel.setParams(manifest.data.params || {});
    }
  }

  /**
   * Создает объекты Module из записей манифеста.
   */
  private async createModulesFromManifest(
    manifestEntries: ModuleManifestEntry[],
  ): Promise<Module[]> {
    log.debug('ManifestLoader: создание модулей из манифеста', {
      prefix: LOG_PREFIX,
    });

    // Параллельная обработка всех модулей
    const modulePromises = manifestEntries.map((entry) =>
      this.createModule(entry)
        .then((module) => {
          if (module) {
            log.debug(
              'ManifestLoader: модуль создан',
              { prefix: LOG_PREFIX },
              { moduleName: entry.name },
            );
          }
          return module;
        })
        .catch((error) => {
          log.warn(
            `ManifestLoader: не удалось создать модуль ${entry.name}`,
            { prefix: LOG_PREFIX },
            { error, moduleName: entry.name },
          );
          return null;
        }),
    );

    const results = await Promise.allSettled(modulePromises);

    const modules = results
      .map((result) => {
        if (result.status === 'fulfilled') {
          return result.value;
        }
        return null;
      })
      .filter((m): m is Module => m !== null);

    return modules;
  }

  /**
   * Создает объект Module из записи манифеста.
   */
  private async createModule(
    entry: ModuleManifestEntry,
  ): Promise<Module | null> {
    const isLocal = entry.remoteEntry === '';
    const moduleName = String(entry.name);
    const loadType = String(entry.loadType);

    // Пропускаем INIT модули (их не должно быть в манифесте)
    // eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
    if (loadType === ModuleLoadType.INIT) {
      log.warn(
        `ManifestLoader: пропущен INIT модуль ${moduleName} из манифеста (INIT модули должны быть только локальными)`,
        { prefix: LOG_PREFIX },
      );
      return null;
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

    let config: ModuleConfig | Promise<ModuleConfig>;

    if (isLocal) {
      try {
        config = await this.loadLocalConfig(moduleName);
      } catch (error) {
        log.warn(
          `ManifestLoader: пропущен модуль ${moduleName}: модуль не найден. ` +
            `Убедитесь, что модуль существует в packages/${moduleName}/src/config/module_config.ts`,
          { prefix: LOG_PREFIX },
          { error, moduleName: entry.name },
        );
        return null;
      }
    } else {
      // Добавляем cache-buster для избежания кеширования remoteEntry.js
      const remoteEntry = String(entry.remoteEntry) + '?v=' + Date.now();
      config = this.createRemoteConfigLoader(moduleName, remoteEntry);
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
    }

    return normalModule;
  }

  /**
   * Загружает конфиг LOCAL модуля через import.meta.glob.
   */
  private async loadLocalConfig(moduleName: string): Promise<ModuleConfig> {
    const availablePaths = Object.keys(this.moduleConfigs);
    const matchingPath = availablePaths.find((path) =>
      path.includes(`packages/${moduleName}/src/config/module_config`),
    );

    if (!matchingPath) {
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

    const moduleLoader = this.moduleConfigs[matchingPath];
    const module = await moduleLoader();
    return module.default;
  }

  /**
   * Создает lazy loader для REMOTE модуля.
   */
  private createRemoteConfigLoader(
    moduleName: string,
    remoteEntry: string,
  ): Promise<ModuleConfig> {
    return loadRemoteModule(moduleName, remoteEntry, {
      retries: 2,
      timeout: 1500,
      retryDelay: 1000,
    });
  }
}
