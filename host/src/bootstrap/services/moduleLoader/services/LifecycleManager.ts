/**
 * Менеджер жизненного цикла модулей.
 *
 * Отвечает за:
 * - Инициализацию модулей (вызов onModuleInit)
 * - Регистрацию маршрутов модулей в роутере
 * - Регистрацию i18n ресурсов
 * - Обертку маршрутов для автозагрузки
 *
 * @module services/LifecycleManager
 */

import { log, type IRoutes } from '@platform/core';
import type { Module } from '../../../../modules/interface';
import type { Bootstrap } from '../../../index';
import type { ModuleRegistry } from '../core/ModuleRegistry';
import type {
  AutoLoadByRouteFunction,
  IsModuleLoadedFunction,
  RouteState,
  RouteFromState,
  RouteDependencies,
} from '../types';

/** Префикс для логирования */
const LOG_PREFIX = 'moduleLoader.lifecycleManager';

/**
 * Менеджер жизненного цикла модулей.
 *
 * Управляет жизненным циклом модулей: инициализация,
 * регистрация ресурсов, обработка хуков.
 */
export class LifecycleManager {
  /** Множество модулей, для которых был вызван onModuleInit */
  private readonly initializedModules = new Set<string>();

  constructor(private readonly registry: ModuleRegistry) {
    log.debug('LifecycleManager: инициализация', { prefix: LOG_PREFIX });
  }

  // ============================================
  // Публичные методы: Инициализация
  // ============================================

  /**
   * Инициализирует модуль (вызывает onModuleInit).
   *
   * @param module - Модуль для инициализации
   * @param bootstrap - Инстанс Bootstrap
   * @param skipOnModuleInit - Пропустить вызов onModuleInit
   */
  public async initializeModule(
    module: Module,
    bootstrap: Bootstrap,
    skipOnModuleInit = false,
  ): Promise<void> {
    log.debug(
      `Инициализация модуля "${module.name}"${skipOnModuleInit ? ' (пропуск onModuleInit)' : ''}`,
      { prefix: LOG_PREFIX },
    );

    // Загружаем конфигурацию, если она динамическая
    // Обрабатываем ошибки загрузки конфигурации gracefully
    try {
      await this.registry.loadModuleConfig(module);
    } catch (error) {
      log.warn(
        `Не удалось загрузить конфигурацию модуля "${module.name}": ${
          error instanceof Error ? error.message : String(error)
        }. Пропускаем инициализацию модуля.`,
        { prefix: LOG_PREFIX },
      );
      return;
    }

    const config = module.config;
    if (!config || config instanceof Promise) {
      log.debug(`Модуль "${module.name}": нет валидной конфигурации`, {
        prefix: LOG_PREFIX,
      });
      return;
    }

    // Вызываем onModuleInit только при полной загрузке
    if (!skipOnModuleInit && config.onModuleInit) {
      await this.callOnModuleInit(module, config.onModuleInit, bootstrap);
    }

    log.debug(`Модуль "${module.name}" инициализирован`, {
      prefix: LOG_PREFIX,
    });
  }

  /**
   * Проверяет, был ли модуль инициализирован.
   *
   * @param moduleName - Имя модуля
   * @returns true, если модуль инициализирован
   */
  public isModuleInitialized(moduleName: string): boolean {
    return this.initializedModules.has(moduleName);
  }

  // ============================================
  // Публичные методы: Регистрация ресурсов
  // ============================================

  /**
   * Регистрирует все ресурсы модуля (маршруты и i18n).
   *
   * @param module - Модуль
   * @param bootstrap - Инстанс Bootstrap
   * @param isModuleLoaded - Функция проверки загрузки модуля
   * @param autoLoadHandler - Функция автозагрузки модуля
   */
  public async registerModuleResources(
    module: Module,
    bootstrap: Bootstrap,
    isModuleLoaded: IsModuleLoadedFunction,
    autoLoadHandler?: AutoLoadByRouteFunction,
  ): Promise<void> {
    log.debug(`Регистрация ресурсов модуля "${module.name}"`, {
      prefix: LOG_PREFIX,
    });

    try {
      await this.registerModuleRoutes(module, bootstrap, autoLoadHandler);
    } catch (error) {
      log.warn(
        `Не удалось зарегистрировать маршруты модуля "${module.name}": ${
          error instanceof Error ? error.message : String(error)
        }`,
        { prefix: LOG_PREFIX },
      );
    }

    try {
      await this.registerModuleI18n(module, bootstrap, isModuleLoaded);
    } catch (error) {
      log.warn(
        `Не удалось зарегистрировать i18n модуля "${module.name}": ${
          error instanceof Error ? error.message : String(error)
        }`,
        { prefix: LOG_PREFIX },
      );
    }

    log.debug(`Ресурсы модуля "${module.name}" зарегистрированы`, {
      prefix: LOG_PREFIX,
    });
  }

  /**
   * Регистрирует маршруты модуля в роутере.
   *
   * @param module - Модуль
   * @param bootstrap - Инстанс Bootstrap
   * @param autoLoadHandler - Функция автозагрузки модуля
   */
  public async registerModuleRoutes(
    module: Module,
    bootstrap: Bootstrap,
    autoLoadHandler?: AutoLoadByRouteFunction,
  ): Promise<void> {
    log.debug(`Регистрация маршрутов модуля "${module.name}"`, {
      prefix: LOG_PREFIX,
    });

    // Проверяем, был ли модуль изначально динамическим (до загрузки конфигурации)
    const wasDynamicModule = module.config instanceof Promise;

    const routes = await this.registry.getModuleRoutes(module);
    if (!routes) {
      log.debug(`Модуль "${module.name}": нет маршрутов для регистрации`, {
        prefix: LOG_PREFIX,
      });
      return;
    }

    // Для модулей с динамическим конфигом оборачиваем маршруты
    const routesToRegister =
      wasDynamicModule && autoLoadHandler
        ? this.wrapRoutesWithAutoLoad(routes, autoLoadHandler)
        : routes;

    bootstrap.routerService.registerRoutes(routesToRegister);

    log.debug(
      `Зарегистрировано ${routes.length} маршрутов для модуля "${module.name}"`,
      { prefix: LOG_PREFIX },
    );
  }

  /**
   * Регистрирует i18n ресурсы модуля.
   *
   * @param module - Модуль
   * @param bootstrap - Инстанс Bootstrap
   * @param isModuleLoaded - Функция проверки загрузки модуля
   */
  public async registerModuleI18n(
    module: Module,
    bootstrap: Bootstrap,
    isModuleLoaded: IsModuleLoadedFunction,
  ): Promise<void> {
    // Пропускаем, если модуль уже загружен (i18n уже зарегистрирован)
    if (isModuleLoaded(module.name)) {
      log.debug(`Модуль "${module.name}": i18n уже зарегистрирован`, {
        prefix: LOG_PREFIX,
      });
      return;
    }

    log.debug(`Регистрация i18n модуля "${module.name}"`, {
      prefix: LOG_PREFIX,
    });

    // Загружаем конфигурацию
    // Обрабатываем ошибки загрузки конфигурации gracefully
    try {
      await this.registry.loadModuleConfig(module);
    } catch (error) {
      log.warn(
        `Не удалось загрузить конфигурацию модуля "${module.name}" для регистрации i18n: ${
          error instanceof Error ? error.message : String(error)
        }. Пропускаем регистрацию i18n.`,
        { prefix: LOG_PREFIX },
      );
      return;
    }

    const config = module.config;
    if (!config || config instanceof Promise || !config.I18N) {
      log.debug(`Модуль "${module.name}": нет i18n для регистрации`, {
        prefix: LOG_PREFIX,
      });
      return;
    }

    // Проверяем, что i18n инициализирован
    this.validateI18nInstance(bootstrap);

    config.I18N(bootstrap.i18n);

    log.debug(`i18n модуля "${module.name}" зарегистрирован`, {
      prefix: LOG_PREFIX,
    });
  }

  // ============================================
  // Приватные методы
  // ============================================

  /**
   * Вызывает onModuleInit для модуля.
   *
   * @param module - Модуль
   * @param onModuleInit - Функция инициализации
   * @param bootstrap - Инстанс Bootstrap
   */
  private async callOnModuleInit(
    module: Module,
    onModuleInit: (bootstrap: Bootstrap) => void | Promise<void>,
    bootstrap: Bootstrap,
  ): Promise<void> {
    // Проверяем, не был ли модуль уже инициализирован
    if (this.initializedModules.has(module.name)) {
      log.debug(`Модуль "${module.name}": onModuleInit уже вызван`, {
        prefix: LOG_PREFIX,
      });
      return;
    }

    log.debug(`Вызов onModuleInit для "${module.name}"`, {
      prefix: LOG_PREFIX,
    });

    try {
      const result = onModuleInit(bootstrap);
      if (result instanceof Promise) {
        await result;
      }
      this.initializedModules.add(module.name);
      log.debug(`onModuleInit завершен для "${module.name}"`, {
        prefix: LOG_PREFIX,
      });
    } catch (error) {
      log.error(`Ошибка onModuleInit для "${module.name}"`, {
        prefix: LOG_PREFIX,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Оборачивает маршруты с автоматической загрузкой модуля.
   *
   * @param routes - Маршруты
   * @param autoLoadHandler - Функция автозагрузки
   * @returns Маршруты с добавленным onEnterNode
   */
  private wrapRoutesWithAutoLoad(
    routes: IRoutes,
    autoLoadHandler: AutoLoadByRouteFunction,
  ): IRoutes {
    log.debug(`Обертка ${routes.length} маршрутов с автозагрузкой`, {
      prefix: LOG_PREFIX,
    });

    return routes.map((route) => {
      const existingOnEnterNode = route.onEnterNode;

      return {
        ...route,
        onEnterNode: async (
          toState: RouteState,
          fromState: RouteFromState,
          routeDeps: RouteDependencies,
        ) => {
          const routeName = toState?.name || route.name;

          log.debug(`Автозагрузка модуля для маршрута: ${routeName}`, {
            prefix: LOG_PREFIX,
          });

          await autoLoadHandler(routeName);

          if (existingOnEnterNode) {
            await existingOnEnterNode(toState, fromState, routeDeps);
          }
        },
      };
    });
  }

  /**
   * Валидирует, что i18n инстанс готов к использованию.
   *
   * @param bootstrap - Инстанс Bootstrap
   * @throws {Error} Если i18n не инициализирован
   */
  private validateI18nInstance(bootstrap: Bootstrap): void {
    const i18n = bootstrap.i18n;

    if (!i18n) {
      throw new Error('bootstrap.i18n не определен');
    }

    if (typeof i18n.addResourceBundle !== 'function') {
      log.error('bootstrap.i18n не имеет метода addResourceBundle', {
        prefix: LOG_PREFIX,
        i18nType: typeof i18n,
        i18nConstructor: i18n?.constructor?.name,
      });
      throw new Error(
        'bootstrap.i18n не имеет метода addResourceBundle. ' +
          'Убедитесь, что i18n инициализирован перед регистрацией модулей.',
      );
    }
  }
}
