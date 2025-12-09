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
import { LifecycleManager } from '../services/LifecycleManager';
import { InitLoadStrategy } from '../strategies/InitLoadStrategy';
import { NormalLoadStrategy } from '../strategies/NormalLoadStrategy';
import { hasDependencies } from '../utils/moduleUtils';
import type { ModuleLoadStatus, LoadModuleOptions } from '../types';
import type { ConditionValidator } from '../dev/ConditionValidator';
import type { DependencyResolver } from '../dev/DependencyResolver';
import type { DependencyLevelBuilder } from '../dev/DependencyLevelBuilder';

type DevToolsModule = {
  ConditionValidator: new () => ConditionValidator;
  DependencyResolver: new (registry: ModuleRegistry) => DependencyResolver;
  DependencyLevelBuilder: new (
    registry: ModuleRegistry,
    isLoaded: (name: string) => boolean,
    isPreloaded?: (name: string) => boolean,
  ) => DependencyLevelBuilder;
};

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

  /** Менеджер жизненного цикла */
  private readonly lifecycleManager: LifecycleManager;

  /** Dev-валидатор условий (инициализируется лениво и только в DEV) */
  private conditionValidator: ConditionValidator | null = null;

  /** Dev-резолвер зависимостей (инициализируется лениво и только в DEV) */
  private dependencyResolver: DependencyResolver | null = null;

  /** Кеш промиса загрузки dev-утилит */
  private devToolsPromise: Promise<DevToolsModule> | null = null;

  // ============================================
  // Состояние
  // ============================================

  /** Инстанс Bootstrap (устанавливается при init) */
  private bootstrap: Bootstrap | null = null;

  /** Флаг загрузки INIT модулей */
  private initModulesLoadedFlag = false;

  /** Таймаут загрузки модуля по умолчанию (мс) */
  private defaultLoadTimeout: number | undefined = undefined;

  /** Кешированная стратегия загрузки INIT модулей */
  private initStrategy: InitLoadStrategy | null = null;

  /** Кешированная стратегия загрузки NORMAL модулей */
  private normalStrategy: NormalLoadStrategy | null = null;

  constructor() {
    log.debug('ModuleLoader: создание экземпляра', { prefix: LOG_PREFIX });

    // Инициализация компонентов
    this.registry = new ModuleRegistry();
    this.statusTracker = new ModuleStatusTracker();
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
   * Проверяет, загружены ли INIT модули.
   *
   * @returns true, если INIT модули загружены
   * @deprecated Используйте isInitModulesLoaded для большей ясности
   */
  public get initialized(): boolean {
    return this.initModulesLoadedFlag;
  }

  /**
   * Проверяет, загружены ли INIT модули.
   *
   * @returns true, если INIT модули загружены
   */
  public get isInitModulesLoaded(): boolean {
    return this.initModulesLoadedFlag;
  }

  // ============================================
  // Публичные методы: Управление модулями
  // ============================================

  /**
   * Возвращает список всех модулей (readonly).
   *
   * Для обратной совместимости с кодом, использующим `loader.modules`.
   *
   * @returns Копия массива модулей (нельзя мутировать напрямую)
   */
  public get modules(): Module[] {
    return this.registry.getModules();
  }

  /**
   * Добавляет модуль в загрузчик.
   *
   * @param module - Модуль для добавления
   */
  public async addModule(module: Module): Promise<void> {
    log.debug(`Добавление модуля: ${module.name}`, { prefix: LOG_PREFIX });
    await this.registry.addModule(module);
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

    // Создаем стратегию один раз и кешируем для переиспользования
    if (!this.initStrategy) {
      this.initStrategy = new InitLoadStrategy(
        this.registry,
        this.statusTracker,
        this.lifecycleManager,
      );
    }

    const initModules = this.registry.getModulesByType(ModuleLoadType.INIT);
    await this.initStrategy.loadModules(initModules, bootstrap);

    this.initModulesLoadedFlag = true;
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

    // Создаем стратегию один раз и кешируем для переиспользования
    if (!this.normalStrategy) {
      this.normalStrategy = new NormalLoadStrategy(
        this.registry,
        this.statusTracker,
        this.lifecycleManager,
        (routeName: string) => this.autoLoadModuleByRoute(routeName),
      );
    }

    const normalModules = this.registry.getModulesByType(ModuleLoadType.NORMAL);
    await this.normalStrategy.loadModules(normalModules, bootstrap);

    log.debug('NORMAL модули загружены', { prefix: LOG_PREFIX });
  }

  /**
   * Загружает модуль по имени (по требованию).
   *
   * @param moduleName - Имя модуля для загрузки
   * @param options - Опции загрузки (таймаут и т.д.)
   */
  public async loadModuleByName(
    moduleName: string,
    options?: LoadModuleOptions,
  ): Promise<void> {
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

    // Проверяем циклические зависимости перед загрузкой
    // Оптимизация: проверяем только если у модуля есть зависимости
    const hasDeps =
      module.loadCondition?.dependencies &&
      module.loadCondition.dependencies.length > 0;
    const dependencyResolver = await this.getDependencyResolver();
    if (hasDeps && dependencyResolver?.hasCircularDependencies(module)) {
      const allDeps = dependencyResolver.getAllDependencies(module);
      throw new Error(
        `Обнаружена циклическая зависимость для модуля "${moduleName}". Зависимости: ${allDeps.join(', ')}`,
      );
    }

    const bootstrap = this.getBootstrapOrThrow();
    const timeout: number | undefined =
      options?.timeout ?? this.defaultLoadTimeout;

    // Загружаем зависимости
    if (dependencyResolver) {
      await dependencyResolver.loadDependencies(
        module,
        bootstrap,
        (m: Module, b: Bootstrap) =>
          this.loadSingleModuleWithTimeout(m, b, timeout),
        (name: string) => this.statusTracker.isLoaded(name),
      );
    }

    // Загружаем сам модуль с таймаутом
    await this.loadSingleModuleWithTimeout(module, bootstrap, timeout);

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
      await this.loadModuleByName(module.name, {
        timeout: this.defaultLoadTimeout,
      });
    }
  }

  // ============================================
  // Публичные методы: Предзагрузка
  // ============================================

  /**
   * Предзагружает маршруты и i18n всех модулей.
   *
   * Используется для регистрации маршрутов до старта приложения.
   *
   * Оптимизация производительности: загружает только INIT модули синхронно,
   * NORMAL модули загружаются асинхронно после рендера для улучшения FCP/LCP.
   */
  public async preloadRoutes(): Promise<void> {
    log.debug('Начало предзагрузки маршрутов', { prefix: LOG_PREFIX });

    const bootstrap = this.getBootstrapOrThrow();
    const allModules = this.registry.getModules();

    // КРИТИЧЕСКАЯ ОПТИМИЗАЦИЯ: Разделяем INIT и NORMAL модули
    // INIT модули загружаем синхронно (нужны для первого рендера)
    // NORMAL модули загружаем асинхронно после рендера (не блокируют FCP/LCP)
    const initModules = allModules.filter(
      (m) => (m.loadType ?? ModuleLoadType.NORMAL) === ModuleLoadType.INIT,
    );
    const normalModules = allModules.filter(
      (m) => (m.loadType ?? ModuleLoadType.NORMAL) !== ModuleLoadType.INIT,
    );

    // Загружаем только INIT модули синхронно (они уже загружены через initInitModules,
    // но нужно зарегистрировать их маршруты, если они еще не зарегистрированы)
    const initModulesToPreload = initModules.filter(
      (m) => !this.shouldSkipModuleInPreload(m),
    );

    if (initModulesToPreload.length > 0) {
      log.debug(
        `Предзагрузка маршрутов INIT модулей: ${initModulesToPreload.length} модулей`,
        { prefix: LOG_PREFIX },
      );

      // INIT модули уже загружены, просто регистрируем маршруты
      for (const module of initModulesToPreload) {
        if (!this.statusTracker.isPreloadedOrLoaded(module.name)) {
          await this.preloadModuleWithoutConditionCheck(module, bootstrap);
        }
      }
    }

    // NORMAL модули: загружаем только маршруты синхронно (нужны для router.start())
    // Полная загрузка (onModuleInit, i18n) происходит асинхронно после рендера
    if (normalModules.length > 0) {
      log.debug(
        `Предзагрузка маршрутов NORMAL модулей: ${normalModules.length} модулей (только маршруты, синхронно)`,
        { prefix: LOG_PREFIX },
      );

      // Загружаем только маршруты синхронно, чтобы они были доступны для router.start()
      await this.preloadNormalModuleRoutesOnly(normalModules, bootstrap);

      // Полная загрузка модулей (onModuleInit, i18n) - асинхронно после рендера
      this.preloadNormalModulesFullAsync(normalModules, bootstrap).catch(
        (error) => {
          log.error('Ошибка полной предзагрузки NORMAL модулей', {
            prefix: LOG_PREFIX,
            error: error instanceof Error ? error.message : String(error),
          });
        },
      );
    }

    log.debug(
      'Предзагрузка маршрутов завершена (INIT синхронно, NORMAL асинхронно)',
      {
        prefix: LOG_PREFIX,
      },
    );
  }

  /**
   * Предзагружает только маршруты NORMAL модулей (синхронно, для router.start()).
   *
   * Загружает конфиги и регистрирует маршруты, но НЕ вызывает onModuleInit
   * и НЕ регистрирует i18n. Это делается асинхронно позже.
   *
   * @param normalModules - Массив NORMAL модулей
   * @param bootstrap - Инстанс Bootstrap
   */
  private async preloadNormalModuleRoutesOnly(
    normalModules: Module[],
    bootstrap: Bootstrap,
  ): Promise<void> {
    // Фильтруем модули для предзагрузки
    const modulesToPreload = normalModules.filter(
      (m) => !this.shouldSkipModuleInPreload(m),
    );

    // Проверяем условия для всех модулей
    const modulesToPreloadFiltered: Module[] = [];
    for (const module of modulesToPreload) {
      const shouldSkip = await this.shouldSkipPreloadInDev(module, bootstrap);
      if (!shouldSkip) {
        modulesToPreloadFiltered.push(module);
      } else {
        this.statusTracker.markAsPreloaded(module);
      }
    }

    if (modulesToPreloadFiltered.length === 0) {
      return;
    }

    // Начинаем резолвить все Promise конфигурации параллельно
    const configPromises = modulesToPreloadFiltered
      .filter((m) => m.config instanceof Promise)
      .map((m) =>
        this.registry.loadModuleConfig(m).catch((error) => {
          log.error(`Ошибка предзагрузки конфигурации модуля "${m.name}"`, {
            prefix: LOG_PREFIX,
            error: error instanceof Error ? error.message : String(error),
          });
        }),
      );

    if (configPromises.length > 0) {
      await Promise.all(configPromises);
    }

    // Регистрируем только маршруты (без onModuleInit и i18n)
    for (const module of modulesToPreloadFiltered) {
      if (this.statusTracker.isPreloadedOrLoaded(module.name)) {
        continue;
      }

      try {
        // Только регистрируем маршруты из конфига
        await this.lifecycleManager.registerModuleRoutes(
          module,
          bootstrap,
          (routeName: string) => this.autoLoadModuleByRoute(routeName),
        );

        // Помечаем как предзагруженный (только маршруты зарегистрированы)
        // Это позволяет loadNormalModules() понять, что маршруты уже есть,
        // но модуль еще не загружен полностью
        this.statusTracker.markAsPreloaded(module);

        log.debug(
          `Маршруты модуля "${module.name}" зарегистрированы (полная загрузка будет позже)`,
          { prefix: LOG_PREFIX },
        );
      } catch (error) {
        log.error(`Ошибка регистрации маршрутов модуля "${module.name}"`, {
          prefix: LOG_PREFIX,
          error: error instanceof Error ? error.message : String(error),
        });
        // Не пробрасываем ошибку, чтобы не блокировать регистрацию других модулей
      }
    }
  }

  /**
   * Асинхронно предзагружает полную загрузку NORMAL модулей (onModuleInit, i18n).
   *
   * Выполняется после рендера, не блокирует FCP/LCP.
   *
   * @param normalModules - Массив NORMAL модулей
   * @param bootstrap - Инстанс Bootstrap
   */
  private async preloadNormalModulesFullAsync(
    normalModules: Module[],
    bootstrap: Bootstrap,
  ): Promise<void> {
    // Фильтруем только те модули, у которых маршруты уже зарегистрированы
    const modulesToLoad = normalModules.filter(
      (m) =>
        this.statusTracker.isPreloaded(m.name) &&
        !this.statusTracker.isLoaded(m.name),
    );

    if (modulesToLoad.length === 0) {
      return;
    }

    log.debug(
      `Полная предзагрузка NORMAL модулей: ${modulesToLoad.length} модулей (асинхронно)`,
      { prefix: LOG_PREFIX },
    );

    // Если у всех модулей нет зависимостей, загружаем параллельно
    const allModulesHaveNoDeps = modulesToLoad.every(
      (m) => !hasDependencies(m),
    );

    if (allModulesHaveNoDeps) {
      await Promise.all(
        modulesToLoad.map(async (module: Module) => {
          try {
            // Регистрируем i18n и вызываем onModuleInit
            await this.lifecycleManager.registerModuleI18n(
              module,
              bootstrap,
              (name: string) => this.statusTracker.isLoaded(name),
            );
            await this.lifecycleManager.initializeModule(
              module,
              bootstrap,
              false,
            );
          } catch (error) {
            log.error(`Ошибка полной загрузки модуля "${module.name}"`, {
              prefix: LOG_PREFIX,
              error: error instanceof Error ? error.message : String(error),
            });
          }
        }),
      );
      return;
    }

    // Группируем по уровням зависимостей (в DEV используем тяжелый билдер, в PROD плоский список)
    const levels = (await this.buildDependencyLevels(
      modulesToLoad,
      (name: string) => this.statusTracker.isLoaded(name),
      (name: string) => this.statusTracker.isPreloaded(name),
    )) ?? [modulesToLoad];

    for (let i = 0; i < levels.length; i++) {
      const levelModules = levels[i];
      await Promise.all(
        levelModules.map(async (module: Module) => {
          try {
            await this.lifecycleManager.registerModuleI18n(
              module,
              bootstrap,
              (name: string) => this.statusTracker.isLoaded(name),
            );
            await this.lifecycleManager.initializeModule(
              module,
              bootstrap,
              false,
            );
          } catch (error) {
            log.error(`Ошибка полной загрузки модуля "${module.name}"`, {
              prefix: LOG_PREFIX,
              error: error instanceof Error ? error.message : String(error),
            });
          }
        }),
      );
    }
  }

  // ============================================
  // Приватные методы: Загрузка
  // ============================================

  /**
   * Загружает один модуль с опциональным таймаутом.
   *
   * @param module - Модуль для загрузки
   * @param bootstrap - Инстанс Bootstrap
   * @param timeout - Таймаут загрузки в миллисекундах (опционально)
   */
  private async loadSingleModuleWithTimeout(
    module: Module,
    bootstrap: Bootstrap,
    timeout?: number,
  ): Promise<void> {
    if (timeout !== undefined) {
      await this.loadSingleModuleWithTimeoutInternal(
        module,
        bootstrap,
        timeout,
      );
    } else {
      await this.loadSingleModule(module, bootstrap);
    }
  }

  /**
   * Загружает один модуль с таймаутом.
   *
   * @param module - Модуль для загрузки
   * @param bootstrap - Инстанс Bootstrap
   * @param timeout - Таймаут загрузки в миллисекундах
   */
  private async loadSingleModuleWithTimeoutInternal(
    module: Module,
    bootstrap: Bootstrap,
    timeout: number,
  ): Promise<void> {
    log.debug(`Загрузка модуля "${module.name}" с таймаутом ${timeout}мс`, {
      prefix: LOG_PREFIX,
    });

    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => {
        const error = new Error(
          `Таймаут загрузки модуля "${module.name}" после ${timeout}мс`,
        );
        log.error(`Таймаут загрузки модуля "${module.name}"`, {
          prefix: LOG_PREFIX,
          error: error.message,
        });
        reject(error);
      }, timeout);
    });

    try {
      await Promise.race([
        this.loadSingleModule(module, bootstrap),
        timeoutPromise,
      ]);
    } catch (error) {
      // Если это таймаут, помечаем модуль как failed
      if (error instanceof Error && error.message.includes('Таймаут')) {
        this.statusTracker.markAsFailed(module, error);
      }
      throw error;
    } finally {
      // Очищаем таймер, если он еще не сработал
      if (timeoutId !== undefined) {
        clearTimeout(timeoutId);
      }
    }
  }

  /**
   * Загружает один модуль без таймаута.
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
    const canLoad = await this.canLoadModule(module, bootstrap);

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
   * Использует атомарную операцию getOrCreatePreloadingPromise для устранения race condition
   * при параллельных вызовах.
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

    // Атомарно получаем или создаем Promise предзагрузки
    // Это устраняет race condition: если два потока одновременно вызывают preloadModule,
    // оба получат один и тот же Promise
    let wasCreatedByUs = false;
    let preloadPromise: Promise<void> | undefined;

    try {
      preloadPromise = this.statusTracker.getOrCreatePreloadingPromise(
        module.name,
        () => {
          wasCreatedByUs = true;
          return this.executePreloadInternal(module, bootstrap);
        },
      );

      await preloadPromise;
    } catch (error) {
      // Логируем ошибку, но не пробрасываем - она уже обработана в executePreloadInternal
      log.debug(`Предзагрузка модуля "${module.name}" завершилась с ошибкой`, {
        prefix: LOG_PREFIX,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    } finally {
      // Гарантируем очистку Promise в любом случае
      // Проверяем, что Promise был создан нами и еще существует
      if (wasCreatedByUs && preloadPromise) {
        // Проверяем, что это тот же Promise, который мы создали
        const currentPromise = this.statusTracker.getPreloadingPromise(
          module.name,
        );
        if (currentPromise === preloadPromise) {
          this.statusTracker.removePreloadingPromise(module.name);
        }
      }
    }
  }

  /**
   * Предзагружает один модуль без проверки условий (условия уже проверены).
   *
   * Используется в preloadRoutes после предварительной проверки условий.
   *
   * @param module - Модуль для предзагрузки
   * @param bootstrap - Инстанс Bootstrap
   */
  private async preloadModuleWithoutConditionCheck(
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

    // Атомарно получаем или создаем Promise предзагрузки
    let wasCreatedByUs = false;
    let preloadPromise: Promise<void> | undefined;

    try {
      preloadPromise = this.statusTracker.getOrCreatePreloadingPromise(
        module.name,
        () => {
          wasCreatedByUs = true;
          // Пропускаем проверку условий, так как они уже проверены в preloadRoutes
          this.statusTracker.markAsLoading(module);
          return this.executePreload(module, bootstrap);
        },
      );

      await preloadPromise;
    } catch (error) {
      log.debug(`Предзагрузка модуля "${module.name}" завершилась с ошибкой`, {
        prefix: LOG_PREFIX,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    } finally {
      // Гарантируем очистку Promise в любом случае
      if (wasCreatedByUs && preloadPromise) {
        const currentPromise = this.statusTracker.getPreloadingPromise(
          module.name,
        );
        if (currentPromise === preloadPromise) {
          this.statusTracker.removePreloadingPromise(module.name);
        }
      }
    }
  }

  /**
   * Внутренний метод выполнения предзагрузки модуля.
   * Используется внутри Promise factory для правильной обработки ошибок.
   *
   * @param module - Модуль для предзагрузки
   * @param bootstrap - Инстанс Bootstrap
   */
  private async executePreloadInternal(
    module: Module,
    bootstrap: Bootstrap,
  ): Promise<void> {
    // Проверяем условия (без зависимостей) перед выполнением
    const shouldSkip = await this.shouldSkipPreloadInDev(module, bootstrap);

    if (shouldSkip) {
      log.debug(`Модуль "${module.name}" пропущен при предзагрузке`, {
        prefix: LOG_PREFIX,
      });
      // Помечаем как предзагруженный (пропущенный), чтобы не пытаться загрузить снова
      this.statusTracker.markAsPreloaded(module);
      return;
    }

    // Помечаем как загружающийся
    this.statusTracker.markAsLoading(module);

    // Выполняем предзагрузку
    await this.executePreload(module, bootstrap);
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

      // INIT модули не должны предзагружаться через preloadRoutes,
      // они загружаются через initInitModules. Но если это произошло,
      // просто регистрируем маршруты и i18n без вызова onModuleInit
      if (loadType === ModuleLoadType.INIT) {
        log.debug(
          `Предзагрузка INIT модуля "${module.name}" (только маршруты и i18n)`,
          { prefix: LOG_PREFIX },
        );

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

        // Не вызываем onModuleInit - он будет вызван в InitLoadStrategy
        this.statusTracker.markAsPreloaded(module);
        log.debug(`INIT модуль "${module.name}" предзагружен`, {
          prefix: LOG_PREFIX,
        });
        return;
      }

      // Для NORMAL модулей вызываем onModuleInit перед регистрацией роутов
      await this.lifecycleManager.initializeModule(module, bootstrap, false);

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
  // Приватные методы: Dev/Prod развилки
  // ============================================

  /**
   * Загружает dev-утилиты лениво.
   * В prod возвращает null, чтобы не тянуть тяжелый код.
   */
  private async getDevTools() {
    if (!import.meta.env.DEV) {
      return null;
    }

    if (!this.devToolsPromise) {
      this.devToolsPromise = import('../dev').then((mod) => ({
        ConditionValidator: mod.ConditionValidator,
        DependencyResolver: mod.DependencyResolver,
        DependencyLevelBuilder: mod.DependencyLevelBuilder,
      }));
    }

    return this.devToolsPromise;
  }

  /**
   * Возвращает dev-валидатор условий (только в DEV).
   */
  private async getConditionValidator(): Promise<ConditionValidator | null> {
    const devTools = await this.getDevTools();
    if (!devTools) {
      return null;
    }

    if (!this.conditionValidator) {
      this.conditionValidator = new devTools.ConditionValidator();
    }

    return this.conditionValidator;
  }

  /**
   * Возвращает dev-резолвер зависимостей (только в DEV).
   */
  private async getDependencyResolver(): Promise<DependencyResolver | null> {
    const devTools = await this.getDevTools();
    if (!devTools) {
      return null;
    }

    if (!this.dependencyResolver) {
      this.dependencyResolver = new devTools.DependencyResolver(this.registry);
    }

    return this.dependencyResolver;
  }

  /**
   * Выполняет проверку условий загрузки.
   * В prod условия считаются выполненными (сервер уже отфильтровал данные).
   */
  private async canLoadModule(
    module: Module,
    bootstrap: Bootstrap,
  ): Promise<boolean> {
    const validator = await this.getConditionValidator();
    if (!validator) {
      return true;
    }

    return validator.validateLoadConditions(module, bootstrap, (name: string) =>
      this.statusTracker.isLoaded(name),
    );
  }

  /**
   * Проверяет, нужно ли пропустить модуль на этапе предзагрузки.
   * В prod всегда возвращает false (условия уже проверены на сервере).
   */
  private async shouldSkipPreloadInDev(
    module: Module,
    bootstrap: Bootstrap,
  ): Promise<boolean> {
    const validator = await this.getConditionValidator();
    if (!validator) {
      return false;
    }

    return validator.shouldSkipInPreload(module, bootstrap);
  }

  /**
   * Строит уровни зависимостей в DEV, в PROD возвращает null
   * (используем плоский список как один уровень).
   */
  private async buildDependencyLevels(
    modules: Module[],
    isLoaded: (name: string) => boolean,
    isPreloaded?: (name: string) => boolean,
  ): Promise<Module[][] | null> {
    const devTools = await this.getDevTools();
    if (!devTools) {
      return null;
    }

    const builder = new devTools.DependencyLevelBuilder(
      this.registry,
      isLoaded,
      isPreloaded,
    );

    const { levels } = builder.buildDependencyLevels(modules);
    return levels;
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
}
