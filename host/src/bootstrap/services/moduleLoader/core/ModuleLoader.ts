/**
 * Главный класс загрузчика модулей (Фасад).
 *
 * Предоставляет единую точку входа для работы с модулями:
 * - Добавление и получение модулей
 * - Загрузка INIT и NORMAL модулей
 * - Предзагрузка маршрутов
 * - Автозагрузка по маршруту
 *
 * Реализует паттерн Facade, скрывая сложность внутренней реализации.
 *
 * @module core/ModuleLoader
 */

import { log } from '@platform/core';
import { type Module, ModuleLoadType } from '../../../../modules/interface';
import type { Bootstrap } from '../../../index';
import type { ModuleConfig } from '../../../interface';

import { ModuleRegistry } from './ModuleRegistry';
import { ModuleStatusTracker } from './ModuleStatusTracker';
import { ConditionValidator } from '../services/ConditionValidator';
import { DependencyResolver } from '../services/DependencyResolver';
import { LifecycleManager } from '../services/LifecycleManager';
import { InitLoadStrategy } from '../strategies/InitLoadStrategy';
import { NormalLoadStrategy } from '../strategies/NormalLoadStrategy';
import { DependencyLevelBuilder } from '../utils/DependencyLevelBuilder';
import type { ModuleLoadStatus } from '../types';

/** Префикс для логирования */
const LOG_PREFIX = 'moduleLoader';

/**
 * Главный класс загрузчика модулей.
 *
 * Координирует работу всех компонентов системы загрузки модулей:
 * - Реестр модулей
 * - Трекер статусов
 * - Валидатор условий
 * - Резолвер зависимостей
 * - Менеджер жизненного цикла
 * - Стратегии загрузки
 */
export class ModuleLoader {
  // ============================================
  // Компоненты системы
  // ============================================

  /** Реестр модулей */
  private readonly registry: ModuleRegistry;

  /** Трекер статусов модулей */
  private readonly statusTracker: ModuleStatusTracker;

  /** Валидатор условий загрузки */
  private readonly conditionValidator: ConditionValidator;

  /** Резолвер зависимостей */
  private readonly dependencyResolver: DependencyResolver;

  /** Менеджер жизненного цикла */
  private readonly lifecycleManager: LifecycleManager;

  // ============================================
  // Состояние
  // ============================================

  /** Инстанс Bootstrap (устанавливается при init) */
  private bootstrap: Bootstrap | null = null;

  /** Флаг инициализации */
  private isInitializedFlag = false;

  /** Публичный доступ к списку модулей (для обратной совместимости) */
  public modules: Module[] = [];

  constructor() {
    log.debug('ModuleLoader: создание экземпляра', { prefix: LOG_PREFIX });

    // Инициализация компонентов
    this.registry = new ModuleRegistry();
    this.statusTracker = new ModuleStatusTracker();
    this.conditionValidator = new ConditionValidator();
    this.dependencyResolver = new DependencyResolver(this.registry);
    this.lifecycleManager = new LifecycleManager(this.registry);

    log.debug('ModuleLoader: компоненты инициализированы', {
      prefix: LOG_PREFIX,
    });
  }

  // ============================================
  // Публичные методы: Инициализация
  // ============================================

  /**
   * Инициализирует загрузчик с Bootstrap.
   *
   * @param bootstrap - Инстанс Bootstrap
   */
  public init(bootstrap: Bootstrap): void {
    log.debug('ModuleLoader: инициализация с bootstrap', {
      prefix: LOG_PREFIX,
    });
    this.bootstrap = bootstrap;
    log.debug('ModuleLoader: инициализирован', { prefix: LOG_PREFIX });
  }

  /**
   * Проверяет, инициализирован ли загрузчик.
   *
   * @returns true, если загрузчик инициализирован
   */
  public get initialized(): boolean {
    return this.isInitializedFlag;
  }

  /**
   * Проверяет, загружены ли INIT модули.
   *
   * @returns true, если INIT модули загружены
   */
  public get isInitModulesLoaded(): boolean {
    return this.registry.isInitModulesLoaded;
  }

  // ============================================
  // Публичные методы: Управление модулями
  // ============================================

  /**
   * Добавляет модуль в загрузчик.
   *
   * @param module - Модуль для добавления
   */
  public async addModule(module: Module): Promise<void> {
    log.debug(`Добавление модуля: ${module.name}`, { prefix: LOG_PREFIX });
    await this.registry.addModule(module);
    this.updateModulesArray();
    log.debug(`Модуль "${module.name}" добавлен`, { prefix: LOG_PREFIX });
  }

  /**
   * Добавляет несколько модулей в загрузчик.
   *
   * @param modules - Массив модулей для добавления
   */
  public async addModules(modules: Module[]): Promise<void> {
    log.debug(`Добавление ${modules.length} модулей`, { prefix: LOG_PREFIX });
    await this.registry.addModules(modules);
    this.updateModulesArray();
    log.debug(`Добавлено ${modules.length} модулей`, { prefix: LOG_PREFIX });
  }

  /**
   * Возвращает модуль по имени.
   *
   * @param name - Имя модуля
   * @returns Модуль или undefined
   */
  public getModule(name: string): Module | undefined {
    return this.registry.getModule(name);
  }

  /**
   * Возвращает все модули.
   *
   * @returns Массив всех модулей
   */
  public getModules(): Module[] {
    return this.registry.getModules();
  }

  /**
   * Проверяет наличие модуля.
   *
   * @param name - Имя модуля
   * @returns true, если модуль существует
   */
  public hasModule(name: string): boolean {
    return this.registry.hasModule(name);
  }

  /**
   * Возвращает конфигурацию модуля.
   *
   * @param name - Имя модуля
   * @returns Конфигурация модуля или undefined
   */
  public getModuleConfig(
    name: string,
  ): ModuleConfig | Promise<ModuleConfig> | undefined {
    const module = this.registry.getModule(name);
    return module?.config;
  }

  /**
   * Возвращает модули по типу загрузки.
   *
   * @param loadType - Тип загрузки
   * @returns Массив модулей указанного типа
   */
  public getModulesByType(loadType: ModuleLoadType): Module[] {
    return this.registry.getModulesByType(loadType);
  }

  /**
   * Возвращает модуль по имени маршрута.
   *
   * @param routeName - Имя маршрута
   * @returns Модуль или undefined
   */
  public getModuleByRouteName(routeName: string): Module | undefined {
    return this.registry.getModuleByRouteName(routeName);
  }

  // ============================================
  // Публичные методы: Статусы модулей
  // ============================================

  /**
   * Возвращает статус загрузки модуля.
   *
   * @param name - Имя модуля
   * @returns Статус загрузки или undefined
   */
  public getModuleStatus(name: string): ModuleLoadStatus | undefined {
    return this.statusTracker.getStatus(name);
  }

  /**
   * Проверяет, загружен ли модуль.
   *
   * @param name - Имя модуля
   * @returns true, если модуль загружен
   */
  public isModuleLoaded(name: string): boolean {
    return this.statusTracker.isLoaded(name);
  }

  /**
   * Проверяет, предзагружен ли модуль.
   *
   * @param name - Имя модуля
   * @returns true, если модуль предзагружен
   */
  public isModulePreloaded(name: string): boolean {
    return this.statusTracker.isPreloaded(name);
  }

  // ============================================
  // Публичные методы: Загрузка модулей
  // ============================================

  /**
   * Загружает INIT модули при старте приложения.
   *
   * INIT модули загружаются последовательно по приоритету.
   */
  public async initInitModules(): Promise<void> {
    log.debug('Начало загрузки INIT модулей', { prefix: LOG_PREFIX });

    const bootstrap = this.getBootstrapOrThrow();
    const initStrategy = new InitLoadStrategy(
      this.registry,
      this.statusTracker,
      this.lifecycleManager,
    );

    const initModules = this.registry.getModulesByType(ModuleLoadType.INIT);
    await initStrategy.loadModules(initModules, bootstrap);

    this.isInitializedFlag = true;
    log.debug('INIT модули загружены', { prefix: LOG_PREFIX });
  }

  /**
   * Загружает NORMAL модули после старта приложения.
   *
   * NORMAL модули загружаются параллельно по уровням зависимостей.
   */
  public async loadNormalModules(): Promise<void> {
    log.debug('Начало загрузки NORMAL модулей', { prefix: LOG_PREFIX });

    const bootstrap = this.getBootstrapOrThrow();
    const normalStrategy = new NormalLoadStrategy(
      this.registry,
      this.statusTracker,
      this.lifecycleManager,
      this.conditionValidator,
      this.dependencyResolver,
      (routeName: string) => this.autoLoadModuleByRoute(routeName),
    );

    const normalModules = this.registry.getModulesByType(ModuleLoadType.NORMAL);
    await normalStrategy.loadModules(normalModules, bootstrap);

    log.debug('NORMAL модули загружены', { prefix: LOG_PREFIX });
  }

  /**
   * Загружает модуль по имени (по требованию).
   *
   * @param moduleName - Имя модуля для загрузки
   */
  public async loadModuleByName(moduleName: string): Promise<void> {
    log.debug(`Загрузка модуля по имени: ${moduleName}`, {
      prefix: LOG_PREFIX,
    });

    const module = this.registry.getModule(moduleName);
    if (!module) {
      throw new Error(`Модуль "${moduleName}" не найден`);
    }

    const loadType = module.loadType ?? ModuleLoadType.NORMAL;
    if (loadType === ModuleLoadType.INIT) {
      throw new Error(
        `Модуль "${moduleName}" является INIT модулем и не может быть загружен по требованию`,
      );
    }

    const bootstrap = this.getBootstrapOrThrow();

    // Загружаем зависимости
    await this.dependencyResolver.loadDependencies(
      module,
      bootstrap,
      (m: Module, b: Bootstrap) => this.loadSingleModule(m, b),
      (name: string) => this.statusTracker.isLoaded(name),
    );

    // Загружаем сам модуль
    await this.loadSingleModule(module, bootstrap);

    log.debug(`Модуль "${moduleName}" загружен`, { prefix: LOG_PREFIX });
  }

  /**
   * Автоматически загружает модуль по имени маршрута.
   *
   * @param routeName - Имя маршрута
   */
  public async autoLoadModuleByRoute(routeName: string): Promise<void> {
    log.debug(`Автозагрузка модуля по маршруту: ${routeName}`, {
      prefix: LOG_PREFIX,
    });

    const module = this.registry.getModuleByRouteName(routeName);
    if (!module) {
      log.debug(`Модуль для маршрута "${routeName}" не найден`, {
        prefix: LOG_PREFIX,
      });
      return;
    }

    const loadType = module.loadType ?? ModuleLoadType.NORMAL;
    if (loadType === ModuleLoadType.INIT) {
      log.debug(`Маршрут "${routeName}" принадлежит INIT модулю, пропускаем`, {
        prefix: LOG_PREFIX,
      });
      return;
    }

    // Если модуль не загружен, загружаем его
    if (!this.statusTracker.isLoaded(module.name)) {
      log.debug(
        `Загрузка модуля "${module.name}" для маршрута "${routeName}"`,
        {
          prefix: LOG_PREFIX,
        },
      );
      await this.loadModuleByName(module.name);
    }
  }

  // ============================================
  // Публичные методы: Предзагрузка
  // ============================================

  /**
   * Предзагружает маршруты и i18n всех модулей.
   *
   * Используется для регистрации маршрутов до старта приложения.
   */
  public async preloadRoutes(): Promise<void> {
    log.debug('Начало предзагрузки маршрутов', { prefix: LOG_PREFIX });

    const bootstrap = this.getBootstrapOrThrow();
    const allModules = this.registry.getModules();

    // Фильтруем модули для предзагрузки
    const modulesToPreload = allModules.filter(
      (m) => !this.shouldSkipModuleInPreload(m),
    );

    log.debug(
      `Предзагрузка маршрутов: ${modulesToPreload.length} из ${allModules.length} модулей`,
      { prefix: LOG_PREFIX },
    );

    // Группируем по уровням зависимостей
    const levelBuilder = new DependencyLevelBuilder(
      this.registry,
      (name: string) => this.statusTracker.isLoaded(name),
      (name: string) => this.statusTracker.isPreloaded(name),
    );

    const { levels } = levelBuilder.buildDependencyLevels(modulesToPreload);

    // Обрабатываем уровни последовательно
    for (let i = 0; i < levels.length; i++) {
      const levelModules = levels[i];
      log.debug(
        `Предзагрузка уровня ${i + 1}/${levels.length} (${levelModules.length} модулей)`,
        { prefix: LOG_PREFIX },
      );

      await Promise.all(
        levelModules.map((module: Module) =>
          this.preloadModule(module, bootstrap),
        ),
      );
    }

    log.debug('Предзагрузка маршрутов завершена', { prefix: LOG_PREFIX });
  }

  // ============================================
  // Приватные методы: Загрузка
  // ============================================

  /**
   * Загружает один модуль.
   *
   * @param module - Модуль для загрузки
   * @param bootstrap - Инстанс Bootstrap
   */
  private async loadSingleModule(
    module: Module,
    bootstrap: Bootstrap,
  ): Promise<void> {
    // Проверяем статус
    if (this.statusTracker.isLoadedOrLoading(module.name)) {
      log.debug(`Модуль "${module.name}" уже загружен или загружается`, {
        prefix: LOG_PREFIX,
      });
      return;
    }

    // Если предзагружен, помечаем как загруженный
    if (this.statusTracker.isPreloaded(module.name)) {
      log.debug(
        `Модуль "${module.name}" предзагружен, помечаем как загруженный`,
        {
          prefix: LOG_PREFIX,
        },
      );
      this.statusTracker.markAsLoaded(module);
      return;
    }

    // Проверяем условия загрузки
    const canLoad = await this.conditionValidator.validateLoadConditions(
      module,
      bootstrap,
      (name: string) => this.statusTracker.isLoaded(name),
    );

    if (!canLoad) {
      log.debug(`Модуль "${module.name}": условия загрузки не выполнены`, {
        prefix: LOG_PREFIX,
      });
      this.statusTracker.markAsFailed(
        module,
        new Error(`Условия загрузки не выполнены для модуля ${module.name}`),
      );
      return;
    }

    log.debug(`Загрузка модуля "${module.name}"`, { prefix: LOG_PREFIX });
    this.statusTracker.markAsLoading(module);

    try {
      // Инициализируем модуль
      await this.lifecycleManager.initializeModule(module, bootstrap, false);

      // Регистрируем ресурсы
      await this.lifecycleManager.registerModuleResources(
        module,
        bootstrap,
        (name: string) => this.statusTracker.isLoaded(name),
        (routeName: string) => this.autoLoadModuleByRoute(routeName),
      );

      this.statusTracker.markAsLoaded(module);
      log.debug(`Модуль "${module.name}" загружен`, { prefix: LOG_PREFIX });
    } catch (error) {
      this.statusTracker.markAsFailed(module, error);
      log.error(`Ошибка загрузки модуля "${module.name}"`, {
        prefix: LOG_PREFIX,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  // ============================================
  // Приватные методы: Предзагрузка
  // ============================================

  /**
   * Предзагружает один модуль.
   *
   * @param module - Модуль для предзагрузки
   * @param bootstrap - Инстанс Bootstrap
   */
  private async preloadModule(
    module: Module,
    bootstrap: Bootstrap,
  ): Promise<void> {
    // Проверяем статус
    if (this.statusTracker.isPreloadedOrLoaded(module.name)) {
      log.debug(`Модуль "${module.name}" уже предзагружен или загружен`, {
        prefix: LOG_PREFIX,
      });
      return;
    }

    // Проверяем наличие активной предзагрузки
    const existingPromise = this.statusTracker.getPreloadingPromise(
      module.name,
    );
    if (existingPromise) {
      log.debug(`Ожидание завершения предзагрузки "${module.name}"`, {
        prefix: LOG_PREFIX,
      });
      await existingPromise;
      return;
    }

    // Проверяем условия (без зависимостей)
    const shouldSkip = await this.conditionValidator.shouldSkipInPreload(
      module,
      bootstrap,
    );
    if (shouldSkip) {
      log.debug(`Модуль "${module.name}" пропущен при предзагрузке`, {
        prefix: LOG_PREFIX,
      });
      return;
    }

    // Помечаем как загружающийся
    this.statusTracker.markAsLoading(module);

    // Создаем Promise предзагрузки
    const preloadPromise = this.executePreload(module, bootstrap);
    this.statusTracker.setPreloadingPromise(module.name, preloadPromise);

    try {
      await preloadPromise;
    } finally {
      this.statusTracker.removePreloadingPromise(module.name);
    }
  }

  /**
   * Выполняет предзагрузку модуля.
   *
   * @param module - Модуль для предзагрузки
   * @param bootstrap - Инстанс Bootstrap
   */
  private async executePreload(
    module: Module,
    bootstrap: Bootstrap,
  ): Promise<void> {
    log.debug(`Выполнение предзагрузки модуля "${module.name}"`, {
      prefix: LOG_PREFIX,
    });

    try {
      const loadType = module.loadType ?? ModuleLoadType.NORMAL;

      // Для NORMAL модулей вызываем onModuleInit перед регистрацией роутов
      if (loadType === ModuleLoadType.NORMAL) {
        await this.lifecycleManager.initializeModule(module, bootstrap, false);
      }

      // Регистрируем маршруты
      await this.lifecycleManager.registerModuleRoutes(
        module,
        bootstrap,
        (routeName: string) => this.autoLoadModuleByRoute(routeName),
      );

      // Регистрируем i18n
      await this.lifecycleManager.registerModuleI18n(
        module,
        bootstrap,
        (name: string) => this.statusTracker.isLoaded(name),
      );

      // Для INIT модулей инициализируем без onModuleInit (уже вызван)
      if (loadType === ModuleLoadType.INIT) {
        await this.lifecycleManager.initializeModule(module, bootstrap, true);
      }

      this.statusTracker.markAsPreloaded(module);
      log.debug(`Модуль "${module.name}" предзагружен`, { prefix: LOG_PREFIX });
    } catch (error) {
      this.statusTracker.markAsFailed(module, error);
      log.error(`Ошибка предзагрузки модуля "${module.name}"`, {
        prefix: LOG_PREFIX,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Проверяет, нужно ли пропустить модуль при предзагрузке.
   *
   * @param module - Модуль для проверки
   * @returns true, если модуль нужно пропустить
   */
  private shouldSkipModuleInPreload(module: Module): boolean {
    const loadType = module.loadType ?? ModuleLoadType.NORMAL;

    // INIT модули загружаются через initInitModules
    if (loadType === ModuleLoadType.INIT) {
      return true;
    }

    // Уже загруженные модули пропускаем
    if (this.statusTracker.isLoaded(module.name)) {
      return true;
    }

    return false;
  }

  // ============================================
  // Приватные методы: Утилиты
  // ============================================

  /**
   * Возвращает Bootstrap или выбрасывает ошибку.
   *
   * @returns Инстанс Bootstrap
   * @throws {Error} Если Bootstrap не инициализирован
   */
  private getBootstrapOrThrow(): Bootstrap {
    if (!this.bootstrap) {
      throw new Error(
        'ModuleLoader не инициализирован. Вызовите init() первым.',
      );
    }
    return this.bootstrap;
  }

  /**
   * Обновляет публичный массив модулей.
   */
  private updateModulesArray(): void {
    this.modules = this.registry.getModules();
  }
}
