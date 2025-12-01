import { type Module, ModuleLoadType } from '../../../modules/interface';
import { type ModuleConfig } from '../../interface';
import { type Bootstrap } from '../../index';
import { ModuleRegistry } from './ModuleRegistry';
import { ModuleDependencyResolver } from './ModuleDependencyResolver';
import { ModuleConditionValidator } from './ModuleConditionValidator';
import { ModuleLifecycleManager } from './ModuleLifecycleManager';
import { type ModuleLoadStatus, type LoadedModule } from './types';
import { log } from '@platform/core';

/**
 * Сервис загрузки и управления модулями приложения.
 */
export class BootstrapModuleLoader {
  modules: Module[] = [];
  private loadedModules: Map<string, LoadedModule> = new Map();
  private preloadingModules: Map<string, Promise<void>> = new Map();
  private isInitialized: boolean = false;
  private bootstrap: Bootstrap | null = null;

  private registry: ModuleRegistry;
  private dependencyResolver: ModuleDependencyResolver;
  private conditionValidator: ModuleConditionValidator;
  private lifecycleManager: ModuleLifecycleManager;

  constructor() {
    log.debug('BootstrapModuleLoader: constructor', {
      prefix: 'bootstrap.moduleLoader',
    });
    this.registry = new ModuleRegistry();
    this.dependencyResolver = new ModuleDependencyResolver(this.registry);
    this.conditionValidator = new ModuleConditionValidator();
    this.lifecycleManager = new ModuleLifecycleManager(this.registry);
    log.debug('BootstrapModuleLoader: components initialized', {
      prefix: 'bootstrap.moduleLoader',
    });
    return this;
  }

  /**
   * Инициализация Bootstrap для загрузки модулей
   *
   * @param {Bootstrap} bootstrap - Инстанс Bootstrap.
   * @return {void}
   */
  init(bootstrap: Bootstrap): void {
    log.debug('BootstrapModuleLoader: initializing with bootstrap', {
      prefix: 'bootstrap.moduleLoader.init',
    });
    this.bootstrap = bootstrap;
    log.debug('BootstrapModuleLoader: initialized', {
      prefix: 'bootstrap.moduleLoader.init',
    });
  }

  /**
   * Получение Bootstrap instance (с проверкой инициализации)
   *
   * @return {Bootstrap}
   * @throws {Error} Если Bootstrap не инициализирован
   */
  private getBootstrap(): Bootstrap {
    if (!this.bootstrap) {
      log.error('BootstrapModuleLoader: bootstrap not initialized', {
        prefix: 'bootstrap.moduleLoader.getBootstrap',
      });
      throw new Error(
        'ModuleLoader bootstrap not initialized. Call init() first.',
      );
    }
    return this.bootstrap;
  }

  /**
   * Добавление модуля в загрузчик
   *
   * @param {Module} module - Модуль для добавления.
   * @return {Promise<void>}
   */
  async addModule(module: Module): Promise<void> {
    log.debug(`Adding module: ${module.name}`, {
      prefix: 'bootstrap.moduleLoader',
    });
    await this.registry.addModule(module);
    this.modules = this.registry.getModules();
    log.debug(`Module ${module.name} added successfully`, {
      prefix: 'bootstrap.moduleLoader',
    });
  }

  /**
   * Добавление нескольких модулей в загрузчик
   *
   * @param {Module[]} modules - Массив модулей для добавления.
   * @return {Promise<void>}
   */
  async addModules(modules: Module[]): Promise<void> {
    log.debug(`Adding ${modules.length} modules to loader`, {
      prefix: 'bootstrap.moduleLoader',
    });
    for (const module of modules) {
      await this.registry.addModule(module);
    }
    this.modules = this.registry.getModules();
    log.debug(`All ${modules.length} modules added successfully`, {
      prefix: 'bootstrap.moduleLoader',
    });
  }

  /**
   * Получение модуля по имени
   *
   * @param {string} name - Имя модуля.
   * @return {Module | undefined} - Модуль или undefined, если не найден.
   */
  getModule(name: string): Module | undefined {
    return this.registry.getModule(name);
  }

  /**
   * Получение всех модулей
   *
   * @return {Module[]} - Массив всех модулей.
   */
  getModules(): Module[] {
    return this.registry.getModules();
  }

  /**
   * Проверка наличия модуля по имени
   *
   * @param {string} name - Имя модуля.
   * @return {boolean} - true, если модуль существует.
   */
  hasModule(name: string): boolean {
    return this.registry.hasModule(name);
  }

  /**
   * Получение конфигурации модуля по имени
   *
   * @param {string} name - Имя модуля.
   * @return {ModuleConfig | Promise<ModuleConfig> | undefined} - Конфигурация модуля или undefined, если не найден.
   */
  getModuleConfig(
    name: string,
  ): ModuleConfig | Promise<ModuleConfig> | undefined {
    const module = this.registry.getModule(name);
    return module?.config;
  }

  /**
   * Получение статуса загрузки модуля
   *
   * @param {string} name - Имя модуля.
   * @return {ModuleLoadStatus | undefined} - Статус загрузки модуля.
   */
  getModuleStatus(name: string): ModuleLoadStatus | undefined {
    return this.loadedModules.get(name)?.status;
  }

  /**
   * Проверка, загружен ли модуль
   *
   * @param {string} name - Имя модуля.
   * @return {boolean} - true, если модуль загружен.
   */
  isModuleLoaded(name: string): boolean {
    return this.loadedModules.get(name)?.status === 'loaded';
  }

  /**
   * Проверка, предзагружен ли модуль
   *
   * @param {string} name - Имя модуля.
   * @return {boolean} - true, если модуль предзагружен.
   */
  isModulePreloaded(name: string): boolean {
    return this.loadedModules.get(name)?.status === 'preloaded';
  }

  /**
   * Получение модулей по типу загрузки
   *
   * @param {ModuleLoadType} loadType - Тип загрузки.
   * @return {Module[]} - Массив модулей указанного типа.
   */
  getModulesByType(loadType: ModuleLoadType): Module[] {
    return this.registry.getModulesByType(loadType);
  }

  /**
   * Предварительная загрузка маршрутов и i18n из всех модулей
   * Используется для регистрации всех маршрутов в роутере и загрузки i18n до старта приложения
   * Оптимизировано для параллельной загрузки независимых модулей
   * Для модулей с динамическим конфигом (Promise) конфигурация загружается при первом обращении
   *
   * @return {Promise<void>}
   */
  async preloadRoutes(): Promise<void> {
    log.debug('Starting preloadRoutes', {
      prefix: 'bootstrap.moduleLoader.preloadRoutes',
    });
    const bootstrap = this.getBootstrap();

    // Фильтруем модули, которые нужно обработать
    const allModules = this.registry.getModules();
    log.debug(`Total modules in registry: ${allModules.length}`, {
      prefix: 'bootstrap.moduleLoader.preloadRoutes',
    });
    const modulesToProcess = allModules.filter(
      (module) => !this.shouldSkipModuleInPreload(module),
    );

    log.debug(
      `Preloading routes from ${modulesToProcess.length} modules (${allModules.length - modulesToProcess.length} skipped)`,
      {
        prefix: 'bootstrap.moduleLoader.preloadRoutes',
      },
    );
    // Группируем модули по уровням зависимостей для параллельной обработки
    const dependencyLevels =
      this.groupModulesByDependencyLevels(modulesToProcess);
    log.debug(
      `Grouped modules into ${dependencyLevels.length} dependency levels`,
      { prefix: 'bootstrap.moduleLoader.preloadRoutes' },
    );

    // Обрабатываем каждый уровень последовательно, модули внутри уровня - параллельно
    for (let i = 0; i < dependencyLevels.length; i++) {
      const levelModules = dependencyLevels[i];
      log.debug(
        `Processing dependency level ${i + 1}/${dependencyLevels.length} with ${levelModules.length} modules`,
        { prefix: 'bootstrap.moduleLoader.preloadRoutes' },
      );
      await Promise.all(
        levelModules.map((module) =>
          this.preloadModuleRoutes(module, bootstrap),
        ),
      );
      log.debug(
        `Dependency level ${i + 1}/${dependencyLevels.length} completed`,
        {
          prefix: 'bootstrap.moduleLoader.preloadRoutes',
        },
      );
    }
    log.debug('Routes preloaded successfully', {
      prefix: 'bootstrap.moduleLoader.preloadRoutes',
    });
  }

  /**
   * Предзагружает маршруты и i18n для одного модуля
   * Использует общий метод preloadModule для единообразия
   *
   * @param {Module} module - Модуль для предзагрузки.
   * @param {Bootstrap} bootstrap - Инстанс Bootstrap.
   * @return {Promise<void>}
   */
  private async preloadModuleRoutes(
    module: Module,
    bootstrap: Bootstrap,
  ): Promise<void> {
    log.debug(`Preloading routes for module: ${module.name}`, {
      prefix: 'bootstrap.moduleLoader.preloadModuleRoutes',
    });

    // Загружаем зависимости для модулей с условиями (использует предзагрузку)
    await this.preloadModuleDependencies(module, bootstrap);

    // Используем общий метод предзагрузки модуля
    await this.preloadModule(module, bootstrap);

    log.debug(`Routes preloaded for module: ${module.name}`, {
      prefix: 'bootstrap.moduleLoader.preloadModuleRoutes',
    });
  }

  /**
   * Группирует модули по уровням зависимостей для параллельной обработки
   * Модули без зависимостей попадают в первый уровень
   * Модули с зависимостями попадают в уровень после всех их зависимостей
   *
   * @param {Module[]} modules - Массив модулей для группировки.
   * @return {Module[][]} - Массив уровней, каждый уровень содержит модули, которые можно обрабатывать параллельно.
   */
  private groupModulesByDependencyLevels(modules: Module[]): Module[][] {
    log.debug(`Grouping ${modules.length} modules by dependency levels`, {
      prefix: 'bootstrap.moduleLoader.groupModulesByDependencyLevels',
    });
    const levels: Module[][] = [];
    const processed = new Set<string>();
    const moduleMap = new Map<string, Module>();

    // Создаем карту модулей для быстрого доступа
    for (const module of modules) {
      moduleMap.set(module.name, module);
    }
    log.debug(`Created module map with ${moduleMap.size} modules`, {
      prefix: 'bootstrap.moduleLoader.groupModulesByDependencyLevels',
    });

    // Функция для получения зависимостей модуля
    const getDependencies = (module: Module): string[] => {
      return module.loadCondition?.dependencies ?? [];
    };

    // Функция для проверки, все ли зависимости готовы (загружены или обработаны)
    const areDependenciesReady = (module: Module): boolean => {
      const dependencies = getDependencies(module);
      if (dependencies.length === 0) {
        return true;
      }
      // Зависимость готова, если:
      // 1. Модуль уже загружен (isModuleLoaded)
      // 2. Модуль обработан в текущем цикле preloadRoutes (processed)
      // 3. Модуль не входит в список для обработки, но существует (уже загружен ранее)
      return dependencies.every((depName) => {
        // Если зависимость уже обработана в текущем цикле
        if (processed.has(depName)) {
          return true;
        }
        // Если зависимость уже загружена
        if (this.isModuleLoaded(depName)) {
          return true;
        }
        // Если зависимость не в списке для обработки, но существует в реестре
        // (значит она уже была обработана ранее или будет обработана отдельно)
        const depModule = this.registry.getModule(depName);
        if (depModule && !moduleMap.has(depName)) {
          // Модуль существует, но не в списке для обработки - считаем готовым
          return true;
        }
        // Зависимость должна быть обработана в текущем цикле
        return false;
      });
    };

    // Пока есть необработанные модули
    while (processed.size < modules.length) {
      const currentLevel: Module[] = [];

      // Находим модули, все зависимости которых готовы
      for (const module of modules) {
        if (processed.has(module.name)) {
          continue;
        }

        // Проверяем, что все зависимости модуля готовы
        if (areDependenciesReady(module)) {
          currentLevel.push(module);
          processed.add(module.name);
        }
      }

      // Если не нашли модулей для текущего уровня, значит есть циклические зависимости
      if (currentLevel.length === 0) {
        const unprocessed = modules
          .filter((m) => !processed.has(m.name))
          .map((m) => m.name);
        log.error(
          `Circular dependency detected or missing dependencies. Unprocessed modules: ${unprocessed.join(', ')}`,
          {
            prefix: 'bootstrap.moduleLoader.groupModulesByDependencyLevels',
          },
        );
        throw new Error(
          `Circular dependency detected or missing dependencies. Unprocessed modules: ${unprocessed.join(', ')}`,
        );
      }

      log.debug(
        `Dependency level ${levels.length + 1} created with ${currentLevel.length} modules: ${currentLevel.map(m => m.name).join(', ')}`,
        {
          prefix: 'bootstrap.moduleLoader.groupModulesByDependencyLevels',
        },
      );
      levels.push(currentLevel);
    }

    log.debug(
      `Grouped modules into ${levels.length} dependency levels (total modules: ${modules.length})`,
      {
        prefix: 'bootstrap.moduleLoader.groupModulesByDependencyLevels',
      },
    );
    return levels;
  }

  /**
   * Проверяет, нужно ли пропустить модуль в preloadRoutes
   *
   * @param {Module} module - Модуль для проверки.
   * @return {boolean} - true, если модуль нужно пропустить.
   */
  private shouldSkipModuleInPreload(module: Module): boolean {
    const loadType = module.loadType ?? ModuleLoadType.NORMAL;

    // INIT модули загружаются через loadModule(), пропускаем их
    if (loadType === ModuleLoadType.INIT) {
      log.debug(
        `Skipping INIT module in preload: ${module.name} (will be loaded via loadModule)`,
        {
          prefix: 'bootstrap.moduleLoader.shouldSkipModuleInPreload',
        },
      );
      return true;
    }

    // Пропускаем уже загруженные модули (загружены как зависимости)
    if (this.isModuleLoaded(module.name)) {
      log.debug(
        `Skipping already loaded module in preload: ${module.name}`,
        {
          prefix: 'bootstrap.moduleLoader.shouldSkipModuleInPreload',
        },
      );
      return true;
    }

    return false;
  }

  /**
   * Проверяет, нужно ли пропустить модуль из-за невыполненных условий
   *
   * @param {Module} module - Модуль для проверки.
   * @param {Bootstrap} bootstrap - Инстанс Bootstrap.
   * @return {Promise<boolean>} - true, если модуль нужно пропустить.
   */
  private async shouldSkipModuleByConditions(
    module: Module,
    bootstrap: Bootstrap,
  ): Promise<boolean> {
    log.debug(`Checking skip conditions for module: ${module.name}`, {
      prefix: 'bootstrap.moduleLoader.shouldSkipModuleByConditions',
    });
    if (!module.loadCondition) {
      log.debug(`Module ${module.name} has no load conditions, not skipping`, {
        prefix: 'bootstrap.moduleLoader.shouldSkipModuleByConditions',
      });
      return false;
    }

    const { featureFlags, accessPermissions } = module.loadCondition;

    // Проверяем featureFlags
    if (featureFlags && featureFlags.length > 0) {
      const hasFeatureFlags = await this.conditionValidator.checkFeatureFlags(
        featureFlags,
        bootstrap,
      );
      if (!hasFeatureFlags) {
        log.debug(
          `Module ${module.name} skipped: feature flags not met`,
          {
            prefix: 'bootstrap.moduleLoader.shouldSkipModuleByConditions',
          },
        );
        return true;
      }
    }

    // Проверяем accessPermissions
    if (accessPermissions && accessPermissions.length > 0) {
      const hasPermissions =
        await this.conditionValidator.checkAccessPermissions(
          accessPermissions,
          bootstrap,
        );
      if (!hasPermissions) {
        log.debug(
          `Module ${module.name} skipped: access permissions not met`,
          {
            prefix: 'bootstrap.moduleLoader.shouldSkipModuleByConditions',
          },
        );
        return true;
      }
    }

    log.debug(`Module ${module.name} conditions met, not skipping`, {
      prefix: 'bootstrap.moduleLoader.shouldSkipModuleByConditions',
    });
    return false;
  }

  /**
   * Предзагружает зависимости для модуля
   * Использует предзагрузку вместо полной загрузки, чтобы избежать вызова onModuleInit
   *
   * @param {Module} module - Модуль для предзагрузки зависимостей.
   * @param {Bootstrap} bootstrap - Инстанс Bootstrap.
   * @return {Promise<void>}
   */
  private async preloadModuleDependencies(
    module: Module,
    bootstrap: Bootstrap,
  ): Promise<void> {
    if (!module.loadCondition?.dependencies) {
      log.debug(`Module ${module.name} has no dependencies to preload`, {
        prefix: 'bootstrap.moduleLoader.preloadModuleDependencies',
      });
      return;
    }

    const { dependencies } = module.loadCondition;
    if (dependencies.length === 0) {
      log.debug(`Module ${module.name} has empty dependencies array`, {
        prefix: 'bootstrap.moduleLoader.preloadModuleDependencies',
      });
      return;
    }

    log.debug(
      `Preloading ${dependencies.length} dependencies for module: ${module.name} (${dependencies.join(', ')})`,
      {
        prefix: 'bootstrap.moduleLoader.preloadModuleDependencies',
      },
    );
    // Используем предзагрузку вместо полной загрузки для зависимостей
    await this.dependencyResolver.loadDependencies(
      module,
      bootstrap,
      new Set(),
      (m, b) => this.preloadModule(m, b),
      (name) => this.isModulePreloaded(name) || this.isModuleLoaded(name),
    );
    log.debug(`Dependencies preloaded for module: ${module.name}`, {
      prefix: 'bootstrap.moduleLoader.preloadModuleDependencies',
    });
  }

  /**
   * Предзагружает один модуль (регистрирует ресурсы без вызова onModuleInit)
   * Используется для предзагрузки зависимостей и маршрутов
   * Защищен от параллельной предзагрузки через Promise-синхронизацию
   *
   * @param {Module} module - Модуль для предзагрузки.
   * @param {Bootstrap} bootstrap - Инстанс Bootstrap.
   * @return {Promise<void>}
   */
  private async preloadModule(
    module: Module,
    bootstrap: Bootstrap,
  ): Promise<void> {
    // Пропускаем, если модуль уже предзагружен или загружен
    if (
      this.isModulePreloaded(module.name) ||
      this.isModuleLoaded(module.name)
    ) {
      log.debug(`Module ${module.name} already preloaded or loaded, skipping`, {
        prefix: 'bootstrap.moduleLoader',
      });
      return;
    }

    // Проверяем, не предзагружается ли модуль уже (защита от гонки при параллельной обработке)
    // Используем атомарную проверку: если Promise уже существует, ждем его
    let existingPreload = this.preloadingModules.get(module.name);
    if (existingPreload) {
      log.debug(
        `Module ${module.name} is already being preloaded, waiting for completion...`,
        { prefix: 'bootstrap.moduleLoader' },
      );
      try {
        await existingPreload;
        // После ожидания проверяем результат
        if (
          this.isModulePreloaded(module.name) ||
          this.isModuleLoaded(module.name)
        ) {
          log.debug(`Module ${module.name} was preloaded by another process`, {
            prefix: 'bootstrap.moduleLoader',
          });
          return;
        }
      } catch {
        // Если предзагрузка завершилась с ошибкой, продолжаем попытку
        log.debug(
          `Previous preload attempt for ${module.name} failed, retrying...`,
          { prefix: 'bootstrap.moduleLoader' },
        );
        this.preloadingModules.delete(module.name);
      }
    }

    // Проверяем статус loading как дополнительную защиту
    const currentStatus = this.getModuleStatus(module.name);
    if (currentStatus === 'loading') {
      // Модуль уже загружается, ждем завершения через Promise если он есть
      existingPreload = this.preloadingModules.get(module.name);
      if (existingPreload) {
        log.debug(
          `Module ${module.name} is loading, waiting for existing preload...`,
          { prefix: 'bootstrap.moduleLoader' },
        );
        await existingPreload;
        if (
          this.isModulePreloaded(module.name) ||
          this.isModuleLoaded(module.name)
        ) {
          log.debug(`Module ${module.name} was preloaded/loaded, skipping`, {
            prefix: 'bootstrap.moduleLoader',
          });
          return;
        }
      }
    }

    // Проверяем условия загрузки
    if (await this.shouldSkipModuleByConditions(module, bootstrap)) {
      log.debug(`Module ${module.name} skipped (conditions not met)`, {
        prefix: 'bootstrap.moduleLoader',
      });
      return;
    }

    // Финальная проверка перед началом предзагрузки
    if (
      this.isModulePreloaded(module.name) ||
      this.isModuleLoaded(module.name)
    ) {
      log.debug(
        `Module ${module.name} was preloaded/loaded during checks, skipping`,
        { prefix: 'bootstrap.moduleLoader' },
      );
      return;
    }

    // Атомарная проверка и установка Promise (защита от гонки)
    existingPreload = this.preloadingModules.get(module.name);
    if (existingPreload) {
      log.debug(
        `Module ${module.name} started preloading during checks, waiting...`,
        { prefix: 'bootstrap.moduleLoader' },
      );
      await existingPreload;
      if (
        this.isModulePreloaded(module.name) ||
        this.isModuleLoaded(module.name)
      ) {
        log.debug(`Module ${module.name} was preloaded by another process`, {
          prefix: 'bootstrap.moduleLoader',
        });
        return;
      }
    }

    // Устанавливаем статус loading синхронно как блокировку (перед созданием Promise)
    // Это предотвращает параллельную предзагрузку на уровне статуса
    const wasLoading = this.getModuleStatus(module.name) === 'loading';
    if (wasLoading) {
      // Если модуль уже в статусе loading, ждем существующий Promise
      existingPreload = this.preloadingModules.get(module.name);
      if (existingPreload) {
        log.debug(
          `Module ${module.name} is already loading, waiting for existing preload...`,
          { prefix: 'bootstrap.moduleLoader' },
        );
        await existingPreload;
        if (
          this.isModulePreloaded(module.name) ||
          this.isModuleLoaded(module.name)
        ) {
          log.debug(`Module ${module.name} was preloaded/loaded, skipping`, {
            prefix: 'bootstrap.moduleLoader',
          });
          return;
        }
      }
    }

    // Помечаем модуль как загружающийся СИНХРОННО (блокировка)
    this.markModuleAsLoading(module);

    log.debug(`Preloading module: ${module.name}`, {
      prefix: 'bootstrap.moduleLoader',
    });

    // Создаем Promise для синхронизации параллельных попыток предзагрузки
    const preloadPromise = (async () => {
      try {
        await this.executePreload(module, bootstrap);
      } catch (error) {
        // Удаляем Promise при ошибке, чтобы можно было повторить попытку
        this.preloadingModules.delete(module.name);
        throw error;
      } finally {
        // Удаляем Promise после завершения (успешного или с ошибкой)
        this.preloadingModules.delete(module.name);
      }
    })();

    // Устанавливаем Promise в Map синхронно
    // Если другая попытка уже установила Promise между проверками, используем его
    if (this.preloadingModules.has(module.name)) {
      const otherPreload = this.preloadingModules.get(module.name);
      if (otherPreload && otherPreload !== preloadPromise) {
        log.debug(
          `Module ${module.name} preload Promise was set by another process, using it`,
          { prefix: 'bootstrap.moduleLoader' },
        );
        // Откатываем статус loading, так как используем другой Promise
        this.loadedModules.delete(module.name);
        await otherPreload;
        return;
      }
    }

    this.preloadingModules.set(module.name, preloadPromise);
    await preloadPromise;
  }

  /**
   * Выполняет фактическую предзагрузку модуля
   *
   * @param {Module} module - Модуль для предзагрузки.
   * @param {Bootstrap} bootstrap - Инстанс Bootstrap.
   * @return {Promise<void>}
   */
  private async executePreload(
    module: Module,
    bootstrap: Bootstrap,
  ): Promise<void> {
    log.debug(`Executing preload for module: ${module.name}`, {
      prefix: 'bootstrap.moduleLoader.executePreload',
    });
    // Статус loading уже установлен в preloadModule для синхронизации

    try {
      const loadType = module.loadType ?? ModuleLoadType.NORMAL;

      // ВАЖНО: Для модулей типа NORMAL вызываем onModuleInit ПЕРЕД регистрацией роутов
      // Это гарантирует, что DI зависимости зарегистрированы до того, как роуты будут использованы
      if (loadType === ModuleLoadType.NORMAL) {
        log.debug(
          `Calling onModuleInit for NORMAL module: ${module.name} during preload`,
          { prefix: 'bootstrap.moduleLoader.executePreload' },
        );
        await this.lifecycleManager.initializeModule(module, bootstrap, false);
      }

      // Регистрируем маршруты и i18n
      log.debug(`Registering routes for module: ${module.name}`, {
        prefix: 'bootstrap.moduleLoader.executePreload',
      });
      await this.lifecycleManager.registerModuleRoutes(
        module,
        bootstrap,
        (routeName) => this.autoLoadModuleByRoute(routeName),
      );
      log.debug(`Registering i18n for module: ${module.name}`, {
        prefix: 'bootstrap.moduleLoader.executePreload',
      });
      await this.lifecycleManager.registerModuleI18n(
        module,
        bootstrap,
        (name) => this.isModuleLoaded(name),
      );

      // Для INIT модулей инициализируем только для добавления мок-обработчиков (без onModuleInit)
      // так как onModuleInit уже был вызван при загрузке INIT модулей
      if (loadType === ModuleLoadType.INIT) {
        log.debug(
          `Initializing INIT module (mock handlers only): ${module.name}`,
          {
            prefix: 'bootstrap.moduleLoader.executePreload',
          },
        );
        await this.lifecycleManager.initializeModule(module, bootstrap, true);
      }

      // Помечаем модуль как предзагруженный
      this.markModuleAsPreloaded(module);
      log.debug(`Module ${module.name} preloaded successfully`, {
        prefix: 'bootstrap.moduleLoader.executePreload',
      });
    } catch (error) {
      this.markModuleAsFailed(module, error);
      log.error(
        `Failed to preload module ${module.name}`,
        { prefix: 'bootstrap.moduleLoader.executePreload' },
        error,
      );
      throw error;
    }
  }

  /**
   * Загрузка одного модуля
   *
   * @param {Module} module - Модуль для загрузки.
   * @param {Bootstrap} bootstrap - Инстанс Bootstrap.
   * @return {Promise<void>}
   */
  private async loadModule(
    module: Module,
    bootstrap: Bootstrap,
  ): Promise<void> {
    log.debug(
      `loadModule called for: ${module.name} (status: ${this.getModuleStatus(module.name)})`,
      { prefix: 'bootstrap.moduleLoader' },
    );

    if (this.isModuleAlreadyLoadedOrLoading(module.name)) {
      log.debug(`Module ${module.name} already loaded or loading, skipping`, {
        prefix: 'bootstrap.moduleLoader',
      });
      return;
    }

    // Если модуль уже предзагружен, пропускаем повторную инициализацию
    const isPreloaded = this.isModulePreloaded(module.name);
    if (isPreloaded) {
      log.debug(
        `Module ${module.name} already preloaded, onModuleInit was already called during preload`,
        { prefix: 'bootstrap.moduleLoader' },
      );
      this.markModuleAsLoading(module);
      // Для предзагруженных модулей onModuleInit уже был вызван при предзагрузке
      // Просто помечаем модуль как загруженный
      this.markModuleAsLoaded(module);
      log.debug(`Module ${module.name} loaded successfully (was preloaded)`, {
        prefix: 'bootstrap.moduleLoader',
      });
      return;
    }

    if (!(await this.validateLoadConditions(module, bootstrap))) {
      log.debug(`Module ${module.name} load conditions not met, skipping`, {
        prefix: 'bootstrap.moduleLoader',
      });
      return;
    }

    log.debug(`Loading module: ${module.name}`, {
      prefix: 'bootstrap.moduleLoader',
    });
    this.markModuleAsLoading(module);

    try {
      // ВАЖНО: Вызываем onModuleInit ПЕРЕД регистрацией роутов
      // Это гарантирует, что DI зависимости зарегистрированы до того, как роуты будут использованы
      log.debug(
        `Calling initializeModule for: ${module.name} (skipOnModuleInit: false)`,
        { prefix: 'bootstrap.moduleLoader' },
      );
      await this.lifecycleManager.initializeModule(module, bootstrap, false);

      // Регистрируем ресурсы (роуты и i18n) ПОСЛЕ вызова onModuleInit
      // Это важно, чтобы DI зависимости были зарегистрированы до регистрации роутов
      log.debug(
        `Registering resources for module: ${module.name} after onModuleInit`,
        { prefix: 'bootstrap.moduleLoader' },
      );
      await this.lifecycleManager.registerModuleResources(
        module,
        bootstrap,
        (name) => this.isModuleLoaded(name),
        (routeName) => this.autoLoadModuleByRoute(routeName),
      );

      this.markModuleAsLoaded(module);
      log.debug(`Module ${module.name} loaded successfully`, {
        prefix: 'bootstrap.moduleLoader',
      });
    } catch (error) {
      this.markModuleAsFailed(module, error);
      log.error(
        `Failed to load module ${module.name}`,
        { prefix: 'bootstrap.moduleLoader' },
        error,
      );
      throw error;
    }
  }

  /**
   * Проверяет, загружен ли модуль или загружается
   *
   * @param {string} moduleName - Имя модуля.
   * @return {boolean} - true, если модуль уже загружен или загружается.
   */
  private isModuleAlreadyLoadedOrLoading(moduleName: string): boolean {
    const isLoaded = this.isModuleLoaded(moduleName);
    const status = this.getModuleStatus(moduleName);
    const isLoading = status === 'loading';

    if (isLoaded || isLoading) {
      log.debug(
        `Module ${moduleName} already ${isLoaded ? 'loaded' : 'loading'} (status: ${status})`,
        {
          prefix: 'bootstrap.moduleLoader.isModuleAlreadyLoadedOrLoading',
        },
      );
      return true;
    }

    return false;
  }

  /**
   * Проверяет условия загрузки модуля
   *
   * @param {Module} module - Модуль для проверки.
   * @param {Bootstrap} bootstrap - Инстанс Bootstrap.
   * @return {Promise<boolean>} - true, если условия выполнены.
   */
  private async validateLoadConditions(
    module: Module,
    bootstrap: Bootstrap,
  ): Promise<boolean> {
    log.debug(`Validating load conditions for module: ${module.name}`, {
      prefix: 'bootstrap.moduleLoader.validateLoadConditions',
    });
    const canLoad = await this.conditionValidator.checkLoadConditions(
      module,
      bootstrap,
      (name) => this.isModuleLoaded(name),
    );

    if (!canLoad) {
      log.debug(`Load conditions not met for module: ${module.name}`, {
        prefix: 'bootstrap.moduleLoader.validateLoadConditions',
      });
      this.loadedModules.set(module.name, {
        module,
        status: 'failed',
        error: new Error(`Load conditions not met for module ${module.name}`),
      });
      return false;
    }

    log.debug(`Load conditions validated for module: ${module.name}`, {
      prefix: 'bootstrap.moduleLoader.validateLoadConditions',
    });
    return true;
  }

  /**
   * Помечает модуль как загружающийся
   *
   * @param {Module} module - Модуль для пометки.
   * @return {void}
   */
  private markModuleAsLoading(module: Module): void {
    log.debug(`Marking module as loading: ${module.name}`, {
      prefix: 'bootstrap.moduleLoader.markModuleAsLoading',
    });
    this.loadedModules.set(module.name, {
      module,
      status: 'loading',
    });
  }

  /**
   * Помечает модуль как предзагруженный
   *
   * @param {Module} module - Модуль для пометки.
   * @return {void}
   */
  private markModuleAsPreloaded(module: Module): void {
    log.debug(`Marking module as preloaded: ${module.name}`, {
      prefix: 'bootstrap.moduleLoader.markModuleAsPreloaded',
    });
    this.loadedModules.set(module.name, {
      module,
      status: 'preloaded',
    });
  }

  /**
   * Помечает модуль как загруженный
   *
   * @param {Module} module - Модуль для пометки.
   * @return {void}
   */
  private markModuleAsLoaded(module: Module): void {
    log.debug(`Marking module as loaded: ${module.name}`, {
      prefix: 'bootstrap.moduleLoader.markModuleAsLoaded',
    });
    this.loadedModules.set(module.name, {
      module,
      status: 'loaded',
    });
  }

  /**
   * Помечает модуль как не загруженный с ошибкой
   *
   * @param {Module} module - Модуль для пометки.
   * @param {unknown} error - Ошибка загрузки.
   * @return {void}
   */
  private markModuleAsFailed(module: Module, error: unknown): void {
    const err = error instanceof Error ? error : new Error(String(error));
    log.error(
      `Marking module as failed: ${module.name}`,
      {
        prefix: 'bootstrap.moduleLoader.markModuleAsFailed',
      },
      {
        error: err,
      },
    );
    this.loadedModules.set(module.name, {
      module,
      status: 'failed',
      error: err,
    });
  }

  /**
   * Инициализация INIT модулей при старте приложения
   *
   * @return {Promise<void>}
   */
  async initInitModules(): Promise<void> {
    log.debug('Starting INIT modules initialization', {
      prefix: 'bootstrap.moduleLoader.initInitModules',
    });
    if (this.registry.isInitModulesLoaded) {
      log.error('Init modules have already been loaded', {
        prefix: 'bootstrap.moduleLoader.initInitModules',
      });
      throw new Error('Init modules have already been loaded');
    }

    const bootstrap = this.getBootstrap();
    const initModules = this.registry.sortModulesByPriority(
      this.registry.getModulesByType(ModuleLoadType.INIT),
    );

    log.debug(`Loading ${initModules.length} INIT modules`, {
      prefix: 'bootstrap.moduleLoader.initInitModules',
    });
    for (const module of initModules) {
      log.debug(
        `Loading INIT module: ${module.name} (priority: ${module.loadPriority ?? 0})`,
        { prefix: 'bootstrap.moduleLoader.initInitModules' },
      );
      await this.loadModule(module, bootstrap);
      log.debug(`INIT module ${module.name} loaded successfully`, {
        prefix: 'bootstrap.moduleLoader.initInitModules',
      });
    }

    this.registry.setInitModulesLoaded(true);
    this.isInitialized = true;
    log.debug('All INIT modules loaded', {
      prefix: 'bootstrap.moduleLoader.initInitModules',
    });
  }

  /**
   * Загрузка модулей типа NORMAL после старта приложения
   * Оптимизировано для параллельной загрузки независимых модулей
   * Модули группируются по уровням зависимостей для параллельной обработки
   *
   * @return {Promise<void>}
   */
  async loadNormalModules(): Promise<void> {
    log.debug('Starting NORMAL modules loading', {
      prefix: 'bootstrap.moduleLoader.loadNormalModules',
    });
    if (!this.registry.isInitModulesLoaded) {
      log.error('Init modules must be loaded first', {
        prefix: 'bootstrap.moduleLoader.loadNormalModules',
      });
      throw new Error('Init modules must be loaded first');
    }

    const bootstrap = this.getBootstrap();
    const normalModules = this.registry.sortModulesByPriority(
      this.registry.getModulesByType(ModuleLoadType.NORMAL),
    );

    log.debug(`Loading ${normalModules.length} NORMAL modules`, {
      prefix: 'bootstrap.moduleLoader.loadNormalModules',
    });

    // Группируем модули по уровням зависимостей для параллельной обработки
    const dependencyLevels = this.groupModulesByDependencyLevels(normalModules);
    log.debug(
      `Grouped NORMAL modules into ${dependencyLevels.length} dependency levels`,
      { prefix: 'bootstrap.moduleLoader' },
    );

    // Обрабатываем каждый уровень последовательно, модули внутри уровня - параллельно
    for (let i = 0; i < dependencyLevels.length; i++) {
      const levelModules = dependencyLevels[i];
      log.debug(
        `Processing NORMAL dependency level ${i + 1}/${dependencyLevels.length} with ${levelModules.length} modules`,
        { prefix: 'bootstrap.moduleLoader' },
      );

      await Promise.all(
        levelModules.map(async (module) => {
          log.debug(`Processing NORMAL module: ${module.name}`, {
            prefix: 'bootstrap.moduleLoader',
          });
          await this.dependencyResolver.loadDependencies(
            module,
            bootstrap,
            new Set(),
            (m, b) => this.loadModule(m, b),
            (name) => this.isModuleLoaded(name),
          );

          // Проверка условий выполняется внутри loadModule() через validateLoadConditions(),
          // поэтому здесь просто вызываем loadModule() без дублирования проверки
          await this.loadModule(module, bootstrap);
        }),
      );
    }
    log.debug('All NORMAL modules processed', {
      prefix: 'bootstrap.moduleLoader.loadNormalModules',
    });
  }

  /**
   * Загрузка модуля по требованию (для модулей с динамическим конфигом)
   *
   * @param {string} moduleName - Имя модуля для загрузки.
   * @return {Promise<void>}
   */
  async loadModuleByName(moduleName: string): Promise<void> {
    log.debug(`Loading module by name: ${moduleName}`, {
      prefix: 'bootstrap.moduleLoader.loadModuleByName',
    });
    const module = this.registry.getModule(moduleName);
    if (!module) {
      log.error(`Module not found: ${moduleName}`, {
        prefix: 'bootstrap.moduleLoader.loadModuleByName',
      });
      throw new Error(`Module "${moduleName}" not found`);
    }

    const loadType = module.loadType ?? ModuleLoadType.NORMAL;
    if (loadType === ModuleLoadType.INIT) {
      log.error(
        `Cannot load INIT module on demand: ${moduleName}`,
        {
          prefix: 'bootstrap.moduleLoader.loadModuleByName',
        },
      );
      throw new Error(
        `Module "${moduleName}" is an INIT module and cannot be loaded on demand`,
      );
    }

    const bootstrap = this.getBootstrap();

    log.debug(`Loading dependencies for module: ${moduleName}`, {
      prefix: 'bootstrap.moduleLoader.loadModuleByName',
    });
    await this.dependencyResolver.loadDependencies(
      module,
      bootstrap,
      new Set(),
      (m, b) => this.loadModule(m, b),
      (name) => this.isModuleLoaded(name),
    );
    log.debug(`Dependencies loaded, loading module: ${moduleName}`, {
      prefix: 'bootstrap.moduleLoader.loadModuleByName',
    });
    await this.loadModule(module, bootstrap);
    log.debug(`Module loaded by name: ${moduleName}`, {
      prefix: 'bootstrap.moduleLoader.loadModuleByName',
    });
  }

  /**
   * Проверка, инициализированы ли модули
   *
   * @return {boolean} - true, если модули инициализированы.
   */
  get initialized(): boolean {
    return this.isInitialized;
  }

  /**
   * Проверка, загружены ли INIT модули
   *
   * @return {boolean} - true, если INIT модули загружены.
   */
  get isInitModulesLoaded(): boolean {
    return this.registry.isInitModulesLoaded;
  }

  /**
   * Получение модуля по имени маршрута
   * Определяет модуль по первому сегменту имени маршрута
   * Использует кеш для оптимизации производительности
   *
   * @param {string} routeName - Имя маршрута (например, "todo" или "api-example").
   * @return {Module | undefined} - Модуль или undefined, если не найден.
   */
  getModuleByRouteName(routeName: string): Module | undefined {
    return this.registry.getModuleByRouteName(routeName);
  }

  /**
   * Автоматическая загрузка модуля по имени маршрута (для модулей с динамическим конфигом)
   *
   * @param {string} routeName - Имя маршрута.
   * @return {Promise<void>}
   */
  async autoLoadModuleByRoute(routeName: string): Promise<void> {
    log.debug(`Auto-loading module by route: ${routeName}`, {
      prefix: 'bootstrap.moduleLoader.autoLoadModuleByRoute',
    });
    const module = this.registry.getModuleByRouteName(routeName);
    if (!module) {
      log.debug(`No module found for route: ${routeName}`, {
        prefix: 'bootstrap.moduleLoader.autoLoadModuleByRoute',
      });
      return;
    }

    const loadType = module.loadType ?? ModuleLoadType.NORMAL;
    if (loadType === ModuleLoadType.INIT) {
      log.debug(
        `Route ${routeName} belongs to INIT module ${module.name}, skipping auto-load`,
        {
          prefix: 'bootstrap.moduleLoader.autoLoadModuleByRoute',
        },
      );
      return;
    }

    // Проверяем, был ли вызван onModuleInit
    // Если модуль не загружен полностью (onModuleInit не вызван), загружаем его
    // Это особенно важно для модулей с динамическим конфигом (Promise)
    if (!this.isModuleLoaded(module.name)) {
      log.debug(
        `Module ${module.name} not loaded, loading by route: ${routeName}`,
        {
          prefix: 'bootstrap.moduleLoader.autoLoadModuleByRoute',
        },
      );
      await this.loadModuleByName(module.name);
      log.debug(
        `Module ${module.name} auto-loaded by route: ${routeName}`,
        {
          prefix: 'bootstrap.moduleLoader.autoLoadModuleByRoute',
        },
      );
    } else {
      log.debug(
        `Module ${module.name} already loaded for route: ${routeName}`,
        {
          prefix: 'bootstrap.moduleLoader.autoLoadModuleByRoute',
        },
      );
    }
  }
}
