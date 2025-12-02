import { type Module } from '../../../modules/interface';
import { type Bootstrap } from '../../index';
import { type IRoutes, log } from '@platform/core';
import {
  type RouteState,
  type RouteFromState,
  type RouteDependencies,
} from './types';
import { type ModuleRegistry } from './ModuleRegistry';

/**
 * Менеджер жизненного цикла модулей
 */
export class ModuleLifecycleManager {
  private initializedModules: Set<string> = new Set();

  constructor(private registry: ModuleRegistry) {
    log.debug('ModuleLifecycleManager: constructor', {
      prefix: 'bootstrap.moduleLoader.lifecycleManager',
    });
  }
  /**
   * Регистрирует маршруты модуля в роутере
   * Защита от дублирования реализована в routerService.registerRoutes()
   *
   * @param {Module} module - Модуль для регистрации маршрутов.
   * @param {Bootstrap} bootstrap - Инстанс Bootstrap.
   * @param {autoLoadHandler} autoLoadHandler - Опциональная функция автоматической загрузки модуля.
   * @return {void}
   */
  async registerModuleRoutes(
    module: Module,
    bootstrap: Bootstrap,
    autoLoadHandler?: (routeName: string) => Promise<void>,
  ): Promise<void> {
    log.debug(`Registering routes for module: ${module.name}`, {
      prefix: 'bootstrap.moduleLoader.lifecycleManager',
    });
    // Используем кешированные маршруты для оптимизации
    // Для модулей с динамическим конфигом автоматически загружает конфигурацию
    const routes = await this.registry.getModuleRoutes(module);
    if (!routes) {
      log.debug(`Module ${module.name} has no routes to register`, {
        prefix: 'bootstrap.moduleLoader.lifecycleManager',
      });
      return;
    }

    // Для модулей с динамическим конфигом (Promise) оборачиваем маршруты с авто-загрузкой
    if (module.config instanceof Promise && autoLoadHandler) {
      log.debug(`Wrapping routes with auto-load for module: ${module.name}`, {
        prefix: 'bootstrap.moduleLoader.lifecycleManager',
      });
      const routesWithAutoLoad = this.wrapRoutesWithAutoLoad(
        routes,
        autoLoadHandler,
      );
      bootstrap.routerService.registerRoutes(routesWithAutoLoad);
    } else {
      bootstrap.routerService.registerRoutes(routes);
    }
    log.debug(`Registered ${routes.length} routes for module: ${module.name}`, {
      prefix: 'bootstrap.moduleLoader.lifecycleManager',
    });
  }

  /**
   * Оборачивает маршруты с автоматической загрузкой (для модулей с динамическим конфигом)
   *
   * @param {IRoutes} routes - Маршруты для обертки.
   * @param {autoLoadHandler} autoLoadHandler - Функция автоматической загрузки модуля.
   * @return {IRoutes} - Маршруты с добавленным onEnterNode.
   */
  private wrapRoutesWithAutoLoad(
    routes: IRoutes,
    autoLoadHandler: (routeName: string) => Promise<void>,
  ): IRoutes {
    log.debug(`Wrapping ${routes.length} routes with auto-load handler`, {
      prefix: 'bootstrap.moduleLoader.lifecycleManager.wrapRoutesWithAutoLoad',
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
          log.debug(`Auto-loading module for route: ${routeName}`, {
            prefix:
              'bootstrap.moduleLoader.lifecycleManager.wrapRoutesWithAutoLoad.onEnterNode',
          });
          await autoLoadHandler(routeName);

          if (existingOnEnterNode) {
            log.debug(`Calling existing onEnterNode for route: ${routeName}`, {
              prefix:
                'bootstrap.moduleLoader.lifecycleManager.wrapRoutesWithAutoLoad.onEnterNode',
            });
            await existingOnEnterNode(toState, fromState, routeDeps);
          }
        },
      };
    });
  }

  /**
   * Регистрирует i18n ресурсы модуля
   * Для модулей с динамическим конфигом автоматически загружает конфигурацию перед использованием
   *
   * @param {Module} module - Модуль для регистрации i18n.
   * @param {Bootstrap} bootstrap - Инстанс Bootstrap.
   * @param {isModuleLoadedFn} isModuleLoadedFn - Функция проверки загрузки модуля.
   * @return {Promise<void>}
   */
  async registerModuleI18n(
    module: Module,
    bootstrap: Bootstrap,
    isModuleLoadedFn: (name: string) => boolean,
  ): Promise<void> {
    if (isModuleLoadedFn(module.name)) {
      log.debug(
        `Module ${module.name} already loaded, skipping i18n registration`,
        { prefix: 'bootstrap.moduleLoader.lifecycleManager' },
      );
      return;
    }

    log.debug(`Registering i18n for module: ${module.name}`, {
      prefix: 'bootstrap.moduleLoader.lifecycleManager',
    });
    // Для модулей с динамическим конфигом загружаем конфигурацию, если она еще не загружена
    await this.registry.loadModuleConfig(module);

    // После загрузки config уже не является Promise
    const config = module.config;
    if (config && 'I18N' in config && config.I18N && bootstrap.i18n) {
      config.I18N(bootstrap.i18n);
      log.debug(`i18n registered for module: ${module.name}`, {
        prefix: 'bootstrap.moduleLoader.lifecycleManager',
      });
    } else {
      log.debug(`Module ${module.name} has no i18n to register`, {
        prefix: 'bootstrap.moduleLoader.lifecycleManager',
      });
    }
  }

  /**
   * Регистрирует ресурсы модуля (маршруты и i18n)
   *
   * @param {Module} module - Модуль для регистрации ресурсов.
   * @param {Bootstrap} bootstrap - Инстанс Bootstrap.
   * @param {isModuleLoadedFn} isModuleLoadedFn - Функция проверки загрузки модуля.
   * @param {autoLoadHandler} autoLoadHandler - Функция автоматической загрузки модуля.
   * @return {void}
   */
  async registerModuleResources(
    module: Module,
    bootstrap: Bootstrap,
    isModuleLoadedFn: (name: string) => boolean,
    autoLoadHandler?: (routeName: string) => Promise<void>,
  ): Promise<void> {
    log.debug(`Registering resources for module: ${module.name}`, {
      prefix: 'bootstrap.moduleLoader.lifecycleManager.registerModuleResources',
    });
    // Используем единый метод для регистрации маршрутов (включая обработку модулей с динамическим конфигом)
    await this.registerModuleRoutes(module, bootstrap, autoLoadHandler);

    // Регистрируем i18n только если еще не зарегистрирован
    // Для модулей с динамическим конфигом автоматически загружает конфигурацию
    await this.registerModuleI18n(module, bootstrap, isModuleLoadedFn);
    log.debug(`Resources registered for module: ${module.name}`, {
      prefix: 'bootstrap.moduleLoader.lifecycleManager.registerModuleResources',
    });
  }

  /**
   * Инициализирует модуль (вызывает onModuleInit и добавляет мок-обработчики)
   *
   * @param {Module} module - Модуль для инициализации.
   * @param {Bootstrap} bootstrap - Инстанс Bootstrap.
   * @param {boolean} skipOnModuleInit - Пропустить вызов onModuleInit (для предзагрузки маршрутов).
   * @return {Promise<void>}
   */
  async initializeModule(
    module: Module,
    bootstrap: Bootstrap,
    skipOnModuleInit: boolean = false,
  ): Promise<void> {
    log.debug(
      `Initializing module: ${module.name}${skipOnModuleInit ? ' (skipping onModuleInit)' : ''}`,
      { prefix: 'bootstrap.moduleLoader.lifecycleManager' },
    );
    // Убеждаемся, что конфигурация загружена (для модулей с динамическим конфигом)
    await this.registry.loadModuleConfig(module);

    // После загрузки config уже не является Promise
    const config = module.config;
    if (!config || config instanceof Promise) {
      log.debug(
        `Module ${module.name} has no valid config, skipping initialization`,
        { prefix: 'bootstrap.moduleLoader.lifecycleManager' },
      );
      return;
    }

    // Mock handlers теперь регистрируются в dev-server (порт 1337)
    // Dev-server загружает handlers из packages/{moduleName}/src/config/mocks/index.ts
    // Браузерный MSW worker не используется, так как все запросы идут через Vite proxy на dev-server
    if (config.mockHandlers && process.env.NODE_ENV !== 'development') {
      log.debug(
        `Mock handlers skipped for module: ${module.name} (not in development mode)`,
        { prefix: 'bootstrap.moduleLoader.lifecycleManager' },
      );
    } else if (!config.mockHandlers) {
      log.debug(`Module ${module.name} has no mock handlers`, {
        prefix: 'bootstrap.moduleLoader.lifecycleManager',
      });
    }

    // Вызываем onModuleInit только при полной загрузке модуля
    // Поддерживаем как синхронные, так и асинхронные функции
    if (!skipOnModuleInit && config.onModuleInit) {
      log.debug(`Calling onModuleInit for: ${module.name}`, {
        prefix: 'bootstrap.moduleLoader.lifecycleManager',
      });
      try {
        const result = config.onModuleInit(bootstrap);
        if (result instanceof Promise) {
          await result;
        }
        log.debug(`onModuleInit completed for: ${module.name}`, {
          prefix: 'bootstrap.moduleLoader.lifecycleManager',
        });
      } catch (error) {
        log.error(
          `onModuleInit failed for module: ${module.name}`,
          { prefix: 'bootstrap.moduleLoader.lifecycleManager' },
          error,
        );
        throw error; // Пробрасываем ошибку дальше
      }
    } else if (skipOnModuleInit) {
      log.debug(
        `Skipping onModuleInit for: ${module.name} (skipOnModuleInit=true)`,
        { prefix: 'bootstrap.moduleLoader.lifecycleManager' },
      );
    } else if (!config.onModuleInit) {
      log.debug(`Module ${module.name} has no onModuleInit callback`, {
        prefix: 'bootstrap.moduleLoader.lifecycleManager',
      });
    }
    log.debug(`Module ${module.name} initialized`, {
      prefix: 'bootstrap.moduleLoader.lifecycleManager',
    });
  }
}
