import { type Module, ModuleLoadType } from '../../../modules/interface';
import { type IRoutes, log } from '@platform/core';

/**
 * Реестр модулей - управление списком модулей
 */
export class ModuleRegistry {
  private modules: Module[] = [];
  private routeToModuleCache: Map<string, Module> = new Map();
  private routesCache: Map<string, IRoutes> = new Map();
  private initModulesLoaded: boolean = false;

  constructor() {
    log.debug('ModuleRegistry: constructor', {
      prefix: 'bootstrap.moduleLoader.registry',
    });
  }

  /**
   * Добавление модуля в реестр
   * Для INIT модулей кеширует маршруты сразу
   * Для модулей с динамическим конфигом (Promise) маршруты будут закешированы при первом обращении
   *
   * @param {Module} module - Модуль для добавления.
   * @return {Promise<void>}
   */
  async addModule(module: Module): Promise<void> {
    if (this.initModulesLoaded) {
      throw new Error('Cannot add module after INIT modules have been loaded');
    }

    // Проверка на дубликаты по имени
    if (this.modules.some((m) => m.name === module.name)) {
      throw new Error(`Module with name "${module.name}" already exists`);
    }

    log.debug(
      `Adding module to registry: ${module.name} (type: ${module.loadType ?? ModuleLoadType.NORMAL})`,
      { prefix: 'bootstrap.moduleLoader.registry' },
    );
    this.modules.push(module);

    // Для INIT модулей кешируем маршруты сразу
    // Для модулей с динамическим конфигом (Promise) маршруты будут закешированы при первом обращении
    const loadType = module.loadType ?? ModuleLoadType.NORMAL;
    if (loadType === ModuleLoadType.INIT) {
      log.debug(`Caching routes for INIT module: ${module.name}`, {
        prefix: 'bootstrap.moduleLoader.registry',
      });
      await this.cacheModuleRoutes(module);
    }
    log.debug(`Module ${module.name} added to registry`, {
      prefix: 'bootstrap.moduleLoader.registry',
    });
  }

  /**
   * Добавление нескольких модулей в реестр
   *
   * @param {Module[]} modules - Массив модулей для добавления.
   * @return {Promise<void>}
   */
  async addModules(modules: Module[]): Promise<void> {
    if (this.initModulesLoaded) {
      throw new Error('Cannot add modules after INIT modules have been loaded');
    }

    for (const module of modules) {
      await this.addModule(module);
    }
  }

  /**
   * Загружает конфигурацию модуля динамически, если config является Promise
   * Ожидает разрешения Promise и заменяет его на загруженную конфигурацию
   *
   * @param {Module} module - Модуль для загрузки конфигурации.
   * @return {Promise<void>}
   */
  async loadModuleConfig(module: Module): Promise<void> {
    // Если config - это Promise, ждем его разрешения
    if (module.config instanceof Promise) {
      log.debug(`Loading dynamic config for module: ${module.name}`, {
        prefix: 'bootstrap.moduleLoader.registry',
      });
      try {
        const config = await module.config;
        // Заменяем Promise на загруженную конфигурацию
        (module as any).config = config;
        log.debug(`Dynamic config loaded for module: ${module.name}`, {
          prefix: 'bootstrap.moduleLoader.registry',
        });
      } catch (error) {
        log.error(
          `Failed to load config for module "${module.name}"`,
          { prefix: 'bootstrap.moduleLoader.registry' },
          error,
        );
        throw new Error(
          `Failed to load config for module "${module.name}": ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }
  }

  /**
   * Получает маршруты модуля с кешированием результата
   * Кеширует результат ROUTES() для избежания повторных вызовов
   * Для модулей с динамическим конфигом автоматически загружает конфигурацию при первом обращении
   *
   * @param {Module} module - Модуль для получения маршрутов.
   * @return {Promise<IRoutes | undefined>} - Массив маршрутов или undefined, если маршруты не определены.
   */
  async getModuleRoutes(module: Module): Promise<IRoutes | undefined> {
    // Для модулей с динамическим конфигом загружаем конфигурацию, если она еще не загружена
    await this.loadModuleConfig(module);

    // После loadModuleConfig config гарантированно не является Promise
    if (!module.config || module.config instanceof Promise) {
      return undefined;
    }

    const config = module.config;
    if (!config.ROUTES) {
      return undefined;
    }

    // Проверяем кеш
    if (this.routesCache.has(module.name)) {
      log.debug(`Using cached routes for module: ${module.name}`, {
        prefix: 'bootstrap.moduleLoader.registry',
      });
      return this.routesCache.get(module.name)!;
    }

    // Вызываем ROUTES() только один раз и кешируем результат
    log.debug(`Getting routes for module: ${module.name}`, {
      prefix: 'bootstrap.moduleLoader.registry',
    });
    const routes = config.ROUTES();
    this.routesCache.set(module.name, routes);
    log.debug(`Cached ${routes.length} routes for module: ${module.name}`, {
      prefix: 'bootstrap.moduleLoader.registry',
    });
    return routes;
  }

  /**
   * Заполняет кеш соответствия маршрутов к модулю
   * Использует кешированный результат ROUTES() для оптимизации
   * Для модулей с динамическим конфигом загружает конфигурацию динамически
   *
   * @param {Module} module - Модуль для кеширования маршрутов.
   * @return {Promise<void>}
   */
  private async cacheModuleRoutes(module: Module): Promise<void> {
    const routes = await this.getModuleRoutes(module);
    if (!routes) {
      log.debug(`Module ${module.name} has no routes to cache`, {
        prefix: 'bootstrap.moduleLoader.registry',
      });
      return;
    }

    log.debug(
      `Caching route-to-module mapping for module: ${module.name} (${routes.length} routes)`,
      { prefix: 'bootstrap.moduleLoader.registry' },
    );
    for (const route of routes) {
      this.routeToModuleCache.set(route.name, module);
      // Также кешируем первый сегмент для обратной совместимости
      const firstSegment = route.name.split('.')[0];
      if (!this.routeToModuleCache.has(firstSegment)) {
        this.routeToModuleCache.set(firstSegment, module);
      }
    }
    log.debug(`Route-to-module mapping cached for module: ${module.name}`, {
      prefix: 'bootstrap.moduleLoader.registry',
    });
  }

  /**
   * Получение модуля по имени
   *
   * @param {string} name - Имя модуля.
   * @return {Module | undefined} - Модуль или undefined, если не найден.
   */
  getModule(name: string): Module | undefined {
    const module = this.modules.find((m) => m.name === name);
    log.debug(`Getting module: ${name} (${module ? 'found' : 'not found'})`, {
      prefix: 'bootstrap.moduleLoader.registry.getModule',
    });
    return module;
  }

  /**
   * Получение всех модулей
   *
   * @return {Module[]} - Массив всех модулей.
   */
  getModules(): Module[] {
    log.debug(`Getting all modules: ${this.modules.length}`, {
      prefix: 'bootstrap.moduleLoader.registry.getModules',
    });
    return [...this.modules];
  }

  /**
   * Проверка наличия модуля по имени
   *
   * @param {string} name - Имя модуля.
   * @return {boolean} - true, если модуль существует.
   */
  hasModule(name: string): boolean {
    const has = this.modules.some((m) => m.name === name);
    log.debug(
      `Checking module existence: ${name} (${has ? 'exists' : 'not found'})`,
      {
        prefix: 'bootstrap.moduleLoader.registry.hasModule',
      },
    );
    return has;
  }

  /**
   * Получение модулей по типу загрузки
   *
   * @param {ModuleLoadType} loadType - Тип загрузки.
   * @return {Module[]} - Массив модулей указанного типа.
   */
  getModulesByType(loadType: ModuleLoadType): Module[] {
    const filtered = this.modules.filter(
      (m) => (m.loadType ?? ModuleLoadType.NORMAL) === loadType,
    );
    log.debug(`Getting modules by type ${loadType}: ${filtered.length}`, {
      prefix: 'bootstrap.moduleLoader.registry.getModulesByType',
    });
    return filtered;
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
    log.debug(`Getting module by route name: ${routeName}`, {
      prefix: 'bootstrap.moduleLoader.registry.getModuleByRouteName',
    });
    // Сначала проверяем кеш по полному имени маршрута
    const cachedModule = this.routeToModuleCache.get(routeName);
    if (cachedModule) {
      log.debug(
        `Module found in cache by full route name: ${cachedModule.name}`,
        {
          prefix: 'bootstrap.moduleLoader.registry.getModuleByRouteName',
        },
      );
      return cachedModule;
    }

    // Затем проверяем по первому сегменту
    const firstSegment = routeName.split('.')[0];
    const segmentModule = this.routeToModuleCache.get(firstSegment);
    if (segmentModule) {
      log.debug(
        `Module found in cache by first segment: ${segmentModule.name}`,
        {
          prefix: 'bootstrap.moduleLoader.registry.getModuleByRouteName',
        },
      );
    } else {
      log.debug(`No module found for route: ${routeName}`, {
        prefix: 'bootstrap.moduleLoader.registry.getModuleByRouteName',
      });
    }
    return segmentModule;
  }

  /**
   * Сортирует модули по приоритету загрузки
   *
   * @param {Module[]} modules - Массив модулей для сортировки.
   * @return {Module[]} - Отсортированный массив модулей.
   */
  sortModulesByPriority(modules: Module[]): Module[] {
    log.debug(`Sorting ${modules.length} modules by priority`, {
      prefix: 'bootstrap.moduleLoader.registry.sortModulesByPriority',
    });
    const sorted = [...modules].sort((a, b) => {
      const priorityA = a.loadPriority ?? 0;
      const priorityB = b.loadPriority ?? 0;
      return priorityA - priorityB;
    });
    log.debug(
      `Modules sorted by priority (range: ${Math.min(...sorted.map((m) => m.loadPriority ?? 0))} - ${Math.max(...sorted.map((m) => m.loadPriority ?? 0))})`,
      {
        prefix: 'bootstrap.moduleLoader.registry.sortModulesByPriority',
      },
    );
    return sorted;
  }

  /**
   * Установка флага загрузки INIT модулей
   *
   * @param {boolean} value - Значение флага.
   * @return {void}
   */
  setInitModulesLoaded(value: boolean): void {
    log.debug(`Setting initModulesLoaded: ${value}`, {
      prefix: 'bootstrap.moduleLoader.registry.setInitModulesLoaded',
    });
    this.initModulesLoaded = value;
  }

  /**
   * Проверка, загружены ли INIT модули
   *
   * @return {boolean} - true, если INIT модули загружены.
   */
  get isInitModulesLoaded(): boolean {
    return this.initModulesLoaded;
  }
}
