import { Module, ModuleLoadType } from '../../../modules/interface.ts';
import { Bootstrap } from '../../index';
import { IRoutes } from '@todo/core';
import { RouteState, RouteFromState, RouteDependencies } from './types';
import { ModuleRegistry } from './ModuleRegistry';

/**
 * Менеджер жизненного цикла модулей
 */
export class ModuleLifecycleManager {
    constructor(private registry: ModuleRegistry) { }
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
        // Используем кешированные маршруты для оптимизации
        // Для LAZY модулей автоматически загружает конфигурацию
        const routes = await this.registry.getModuleRoutes(module);
        if (!routes) {
            return;
        }

        const loadType = module.loadType ?? ModuleLoadType.NORMAL;

        if (loadType === ModuleLoadType.LAZY && autoLoadHandler) {
            const routesWithAutoLoad = this.wrapLazyRoutesWithAutoLoad(routes, autoLoadHandler);
            bootstrap.routerService.registerRoutes(routesWithAutoLoad);
        } else {
            bootstrap.routerService.registerRoutes(routes);
        }
    }

    /**
     * Оборачивает маршруты LAZY модуля с автоматической загрузкой
     *
     * @param {IRoutes} routes - Маршруты для обертки.
     * @param {autoLoadHandler} autoLoadHandler - Функция автоматической загрузки модуля.
     * @return {IRoutes} - Маршруты с добавленным onEnterNode.
     */
    private wrapLazyRoutesWithAutoLoad(
        routes: IRoutes,
        autoLoadHandler: (routeName: string) => Promise<void>,
    ): IRoutes {
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
                    await autoLoadHandler(routeName);

                    if (existingOnEnterNode) {
                        await existingOnEnterNode(toState, fromState, routeDeps);
                    }
                },
            };
        });
    }

    /**
     * Регистрирует i18n ресурсы модуля
     * Для LAZY модулей автоматически загружает конфигурацию перед использованием
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
            return;
        }

        // Для LAZY модулей загружаем конфигурацию, если она еще не загружена
        await this.registry.loadModuleConfig(module);

        // После загрузки config уже не является Promise
        const config = module.config;
        if (config && 'I18N' in config && config.I18N && bootstrap.i18n) {
            config.I18N(bootstrap.i18n);
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
        // Используем единый метод для регистрации маршрутов (включая обработку LAZY модулей)
        await this.registerModuleRoutes(module, bootstrap, autoLoadHandler);

        // Регистрируем i18n только если еще не зарегистрирован
        // Для LAZY модулей автоматически загружает конфигурацию
        await this.registerModuleI18n(module, bootstrap, isModuleLoadedFn);
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
        // Убеждаемся, что конфигурация загружена (для LAZY модулей)
        await this.registry.loadModuleConfig(module);

        // После загрузки config уже не является Promise
        const config = module.config;
        if (!config || config instanceof Promise) {
            return;
        }

        // Вызываем onModuleInit только при полной загрузке модуля
        if (!skipOnModuleInit && config.onModuleInit) {
            await config.onModuleInit(bootstrap);
        }

        // Добавляем мок-обработчики только в development
        if (process.env.NODE_ENV === 'development' && config.mockHandlers) {
            if (bootstrap.mockService) {
                bootstrap.mockService.addHandlers(config.mockHandlers);
            }
        }
    }
}

