import { Module, ModuleLoadType } from '../../modules/interface';
import { ModuleConfig } from '../interface';
import { IRoutes, IRoute, RouterDependencies } from '@todo/core';
import { Bootstrap } from '..';
import { AccessControlModel } from '../../modules/core/models/accessControl.model';

/**
 * Статус загрузки модуля
 */
type ModuleLoadStatus = 'pending' | 'loading' | 'loaded' | 'failed';

/**
 * Информация о загруженном модуле
 */
interface LoadedModule {
    module: Module;
    status: ModuleLoadStatus;
    error?: Error;
}

/**
 * Типы для параметров onEnterNode хука маршрута
 */
type RouteState = Parameters<NonNullable<IRoute['onEnterNode']>>[0];
type RouteFromState = Parameters<NonNullable<IRoute['onEnterNode']>>[1];
type RouteDependencies = Parameters<NonNullable<IRoute['onEnterNode']>>[2];

/**
 * Сервис загрузки и управления модулями приложения.
 */
export class BootstrapModuleLoader {
    modules: Module[] = [];
    private loadedModules: Map<string, LoadedModule> = new Map();
    private isInitialized: boolean = false;
    private initModulesLoaded: boolean = false;
    private bootstrap: Bootstrap | null = null;
    /**
     * Кеш соответствия имени маршрута к модулю для оптимизации производительности
     */
    private routeToModuleCache: Map<string, Module> = new Map();

    constructor() {
        return this;
    }

    /**
     * Инициализация Bootstrap для загрузки модулей
     *
     * @param {Bootstrap} bootstrap - Инстанс Bootstrap.
     * @return {void}
     */
    init(bootstrap: Bootstrap): void {
        this.bootstrap = bootstrap;
    }

    /**
     * Получение Bootstrap instance (с проверкой инициализации)
     *
     * @return {Bootstrap}
     * @throws {Error} Если Bootstrap не инициализирован
     */
    private getBootstrap(): Bootstrap {
        if (!this.bootstrap) {
            throw new Error('ModuleLoader bootstrap not initialized. Call init() first.');
        }
        return this.bootstrap;
    }

    /**
     * Добавление модуля в загрузчик
     *
     * @param {Module} module - Модуль для добавления.
     * @return {void}
     */
    addModule(module: Module): void {
        if (this.initModulesLoaded) {
            throw new Error('Cannot add module after INIT modules have been loaded');
        }

        // Проверка на дубликаты по имени
        if (this.modules.some((m) => m.name === module.name)) {
            throw new Error(`Module with name "${module.name}" already exists`);
        }

        this.modules.push(module);

        // Заполняем кеш маршрутов для оптимизации
        this.cacheModuleRoutes(module);
    }

    /**
     * Добавление нескольких модулей в загрузчик
     *
     * @param {Module[]} modules - Массив модулей для добавления.
     * @return {void}
     */
    addModules(modules: Module[]): void {
        if (this.initModulesLoaded) {
            throw new Error('Cannot add modules after INIT modules have been loaded');
        }

        for (const module of modules) {
            this.addModule(module);
        }
    }

    /**
     * Заполняет кеш соответствия маршрутов к модулю
     *
     * @param {Module} module - Модуль для кеширования маршрутов.
     * @return {void}
     */
    private cacheModuleRoutes(module: Module): void {
        if (!module.config.ROUTES) {
            return;
        }

        const routes = module.config.ROUTES();
        for (const route of routes) {
            this.routeToModuleCache.set(route.name, module);
            // Также кешируем первый сегмент для обратной совместимости
            const firstSegment = route.name.split('.')[0];
            if (!this.routeToModuleCache.has(firstSegment)) {
                this.routeToModuleCache.set(firstSegment, module);
            }
        }
    }

    /**
     * Получение модуля по имени
     *
     * @param {string} name - Имя модуля.
     * @return {Module | undefined} - Модуль или undefined, если не найден.
     */
    getModule(name: string): Module | undefined {
        return this.modules.find((m) => m.name === name);
    }

    /**
     * Получение всех модулей
     *
     * @return {Module[]} - Массив всех модулей.
     */
    getModules(): Module[] {
        return [...this.modules];
    }

    /**
     * Проверка наличия модуля по имени
     *
     * @param {string} name - Имя модуля.
     * @return {boolean} - true, если модуль существует.
     */
    hasModule(name: string): boolean {
        return this.modules.some((m) => m.name === name);
    }

    /**
     * Получение конфигурации модуля по имени
     *
     * @param {string} name - Имя модуля.
     * @return {ModuleConfig | undefined} - Конфигурация модуля или undefined, если не найден.
     */
    getModuleConfig(name: string): ModuleConfig | undefined {
        const module = this.getModule(name);
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
     * Получение модулей по типу загрузки
     *
     * @param {ModuleLoadType} loadType - Тип загрузки.
     * @return {Module[]} - Массив модулей указанного типа.
     */
    getModulesByType(loadType: ModuleLoadType): Module[] {
        return this.modules.filter(
            (m) => (m.loadType ?? ModuleLoadType.NORMAL) === loadType,
        );
    }

    /**
     * Предварительная загрузка маршрутов и i18n из всех модулей (включая LAZY)
     * Используется для регистрации всех маршрутов в роутере и загрузки i18n до старта приложения
     *
     * @return {Promise<void>}
     */
    async preloadRoutes(): Promise<void> {
        const bootstrap = this.getBootstrap();

        for (const module of this.modules) {
            if (this.shouldSkipModuleInPreload(module)) {
                continue;
            }

            // Для LAZY модулей проверяем условия и загружаем зависимости
            if (await this.shouldSkipLazyModule(module, bootstrap)) {
                continue;
            }

            // Загружаем зависимости для LAZY модулей
            await this.preloadLazyModuleDependencies(module, bootstrap);

            // Регистрируем маршруты и i18n
            this.registerModuleRoutes(module, bootstrap);
            this.registerModuleI18n(module, bootstrap);
        }
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
            return true;
        }

        // Пропускаем уже загруженные модули (загружены как зависимости)
        if (this.isModuleLoaded(module.name)) {
            return true;
        }

        return false;
    }

    /**
     * Проверяет, нужно ли пропустить LAZY модуль из-за невыполненных условий
     *
     * @param {Module} module - Модуль для проверки.
     * @param {Bootstrap} bootstrap - Инстанс Bootstrap.
     * @return {Promise<boolean>} - true, если модуль нужно пропустить.
     */
    private async shouldSkipLazyModule(module: Module, bootstrap: Bootstrap): Promise<boolean> {
        const loadType = module.loadType ?? ModuleLoadType.NORMAL;
        if (loadType !== ModuleLoadType.LAZY || !module.loadCondition) {
            return false;
        }

        const { featureFlags, accessPermissions } = module.loadCondition;

        // Проверяем featureFlags
        if (featureFlags && featureFlags.length > 0) {
            const hasFeatureFlags = await this.checkFeatureFlags(featureFlags, bootstrap);
            if (!hasFeatureFlags) {
                return true;
            }
        }

        // Проверяем accessPermissions
        if (accessPermissions && accessPermissions.length > 0) {
            const hasPermissions = await this.checkAccessPermissions(accessPermissions, bootstrap);
            if (!hasPermissions) {
                return true;
            }
        }

        return false;
    }

    /**
     * Предзагружает зависимости для LAZY модуля
     *
     * @param {Module} module - Модуль для предзагрузки зависимостей.
     * @param {Bootstrap} bootstrap - Инстанс Bootstrap.
     * @return {Promise<void>}
     */
    private async preloadLazyModuleDependencies(
        module: Module,
        bootstrap: Bootstrap,
    ): Promise<void> {
        const loadType = module.loadType ?? ModuleLoadType.NORMAL;
        if (loadType !== ModuleLoadType.LAZY || !module.loadCondition?.dependencies) {
            return;
        }

        const { dependencies } = module.loadCondition;
        if (dependencies.length === 0) {
            return;
        }

        await this.loadDependencies(module, bootstrap, new Set());
    }

    /**
     * Регистрирует маршруты модуля в роутере
     * Защита от дублирования реализована в routerService.registerRoutes()
     *
     * @param {Module} module - Модуль для регистрации маршрутов.
     * @param {Bootstrap} bootstrap - Инстанс Bootstrap.
     * @return {void}
     */
    private registerModuleRoutes(module: Module, bootstrap: Bootstrap): void {
        if (!module.config.ROUTES) {
            return;
        }

        const routes = module.config.ROUTES();
        const loadType = module.loadType ?? ModuleLoadType.NORMAL;

        if (loadType === ModuleLoadType.LAZY) {
            const routesWithAutoLoad = this.wrapLazyRoutesWithAutoLoad(routes);
            bootstrap.routerService.registerRoutes(routesWithAutoLoad);
        } else {
            bootstrap.routerService.registerRoutes(routes);
        }
    }

    /**
     * Оборачивает маршруты LAZY модуля с автоматической загрузкой
     *
     * @param {IRoutes} routes - Маршруты для обертки.
     * @return {IRoutes} - Маршруты с добавленным onEnterNode.
     */
    private wrapLazyRoutesWithAutoLoad(routes: IRoutes): IRoutes {
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
                    await this.autoLoadLazyModuleByRoute(routeName);

                    if (existingOnEnterNode) {
                        await existingOnEnterNode(toState, fromState, routeDeps);
                    }
                },
            };
        });
    }

    /**
     * Регистрирует i18n ресурсы модуля
     *
     * @param {Module} module - Модуль для регистрации i18n.
     * @param {Bootstrap} bootstrap - Инстанс Bootstrap.
     * @return {void}
     */
    private registerModuleI18n(module: Module, bootstrap: Bootstrap): void {
        if (this.isModuleLoaded(module.name)) {
            return;
        }

        if (module.config.I18N && bootstrap.i18n) {
            module.config.I18N(bootstrap.i18n);
        }
    }

    /**
     * Проверка feature flags
     *
     * @param {string[]} featureFlags - Массив feature flags для проверки.
     * @param {Bootstrap} bootstrap - Инстанс Bootstrap.
     * @return {Promise<boolean>} - true, если все feature flags присутствуют.
     */
    private async checkFeatureFlags(
        featureFlags: string[],
        bootstrap: Bootstrap,
    ): Promise<boolean> {
        try {
            const accessControlModel = bootstrap.di.get<AccessControlModel>(AccessControlModel);
            return accessControlModel.includesFeatureFlags(featureFlags);
        } catch (error) {
            // Если AccessControlModel не найден, считаем что feature flags не выполнены
            return false;
        }
    }

    /**
     * Проверка прав доступа
     *
     * @param {string[]} accessPermissions - Массив прав доступа для проверки.
     * @param {Bootstrap} bootstrap - Инстанс Bootstrap.
     * @return {Promise<boolean>} - true, если все права доступа присутствуют.
     */
    private async checkAccessPermissions(
        accessPermissions: string[],
        bootstrap: Bootstrap,
    ): Promise<boolean> {
        try {
            const accessControlModel = bootstrap.di.get<AccessControlModel>(AccessControlModel);
            return accessControlModel.includesPermissions(accessPermissions);
        } catch (error) {
            // Если AccessControlModel не найден, считаем что permissions не выполнены
            return false;
        }
    }

    /**
     * Проверка условий загрузки модуля
     *
     * @param {Module} module - Модуль для проверки.
     * @param {Bootstrap} bootstrap - Инстанс Bootstrap.
     * @return {Promise<boolean>} - true, если модуль может быть загружен.
     */
    private async checkLoadConditions(
        module: Module,
        bootstrap: Bootstrap,
    ): Promise<boolean> {
        if (!module.loadCondition) {
            return true;
        }

        const { featureFlags, accessPermissions, dependencies } = module.loadCondition;

        // Проверка feature flags
        if (featureFlags && featureFlags.length > 0) {
            const hasFeatureFlags = await this.checkFeatureFlags(featureFlags, bootstrap);
            if (!hasFeatureFlags) {
                return false;
            }
        }

        // Проверка прав доступа
        if (accessPermissions && accessPermissions.length > 0) {
            const hasPermissions = await this.checkAccessPermissions(accessPermissions, bootstrap);
            if (!hasPermissions) {
                return false;
            }
        }

        // Проверка зависимостей
        if (dependencies && dependencies.length > 0) {
            if (!this.checkDependencies(module.name, dependencies)) {
                return false;
            }
        }

        return true;
    }

    /**
     * Проверяет зависимости модуля
     *
     * @param {string} moduleName - Имя модуля.
     * @param {string[]} dependencies - Массив имен зависимостей.
     * @return {boolean} - true, если все зависимости загружены.
     */
    private checkDependencies(moduleName: string, dependencies: string[]): boolean {
        const missingDeps = dependencies.filter((depName) => !this.isModuleLoaded(depName));

        if (missingDeps.length > 0) {
            return false;
        }

        return true;
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
        if (this.isModuleAlreadyLoadedOrLoading(module.name)) {
            return;
        }

        if (!(await this.validateLoadConditions(module, bootstrap))) {
            return;
        }

        this.markModuleAsLoading(module);

        try {
            this.registerModuleResources(module, bootstrap);
            await this.initializeModule(module, bootstrap);
            this.markModuleAsLoaded(module);
        } catch (error) {
            this.markModuleAsFailed(module, error);
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
        if (this.isModuleLoaded(moduleName)) {
            return true;
        }

        if (this.getModuleStatus(moduleName) === 'loading') {
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
    private async validateLoadConditions(module: Module, bootstrap: Bootstrap): Promise<boolean> {
        const canLoad = await this.checkLoadConditions(module, bootstrap);

        if (!canLoad) {
            this.loadedModules.set(module.name, {
                module,
                status: 'failed',
                error: new Error(`Load conditions not met for module ${module.name}`),
            });
            return false;
        }

        return true;
    }

    /**
     * Помечает модуль как загружающийся
     *
     * @param {Module} module - Модуль для пометки.
     * @return {void}
     */
    private markModuleAsLoading(module: Module): void {
        this.loadedModules.set(module.name, {
            module,
            status: 'loading',
        });
    }

    /**
     * Помечает модуль как загруженный
     *
     * @param {Module} module - Модуль для пометки.
     * @return {void}
     */
    private markModuleAsLoaded(module: Module): void {
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
        this.loadedModules.set(module.name, {
            module,
            status: 'failed',
            error: err,
        });
    }

    /**
     * Регистрирует ресурсы модуля (маршруты и i18n)
     *
     * @param {Module} module - Модуль для регистрации ресурсов.
     * @param {Bootstrap} bootstrap - Инстанс Bootstrap.
     * @return {void}
     */
    private registerModuleResources(module: Module, bootstrap: Bootstrap): void {
        // Используем единый метод для регистрации маршрутов (включая обработку LAZY модулей)
        this.registerModuleRoutes(module, bootstrap);

        // Регистрируем i18n только если еще не зарегистрирован
        this.registerModuleI18n(module, bootstrap);
    }

    /**
     * Инициализирует модуль (вызывает onModuleInit и добавляет мок-обработчики)
     *
     * @param {Module} module - Модуль для инициализации.
     * @param {Bootstrap} bootstrap - Инстанс Bootstrap.
     * @return {Promise<void>}
     */
    private async initializeModule(module: Module, bootstrap: Bootstrap): Promise<void> {
        if (module.config.onModuleInit) {
            await module.config.onModuleInit(bootstrap);
        }

        // Добавляем мок-обработчики только в development
        if (process.env.NODE_ENV === 'development' && module.config.mockHandlers) {
            if (bootstrap.mockService) {
                bootstrap.mockService.addHandlers(module.config.mockHandlers);
            }
        }
    }

    /**
     * Загрузка зависимостей модуля (рекурсивно)
     *
     * @param {Module} module - Модуль, для которого загружаются зависимости.
     * @param {Bootstrap} bootstrap - Инстанс Bootstrap.
     * @param {Set<string>} visited - Множество уже посещенных модулей для предотвращения циклов.
     * @return {Promise<void>}
     */
    private async loadDependencies(
        module: Module,
        bootstrap: Bootstrap,
        visited: Set<string> = new Set(),
    ): Promise<void> {
        if (!module.loadCondition?.dependencies) {
            return;
        }

        // Проверка на циклические зависимости
        if (visited.has(module.name)) {
            throw new Error(
                `Circular dependency detected: ${Array.from(visited).join(' -> ')} -> ${module.name}`,
            );
        }

        visited.add(module.name);

        const dependencies = module.loadCondition.dependencies;
        const dependencyModules = this.getDependencyModules(module.name, dependencies);

        // Сортируем зависимости по приоритету
        const sortedDependencies = this.sortModulesByPriority(dependencyModules);

        // Загружаем зависимости последовательно (рекурсивно)
        for (const depModule of sortedDependencies) {
            if (!this.isModuleLoaded(depModule.name)) {
                await this.loadDependencies(depModule, bootstrap, visited);
                await this.loadModule(depModule, bootstrap);
            }
        }

        visited.delete(module.name);
    }

    /**
     * Инициализация INIT модулей при старте приложения
     *
     * @return {Promise<void>}
     */
    async initInitModules(): Promise<void> {
        if (this.initModulesLoaded) {
            throw new Error('Init modules have already been loaded');
        }

        const bootstrap = this.getBootstrap();
        const initModules = this.sortModulesByPriority(
            this.getModulesByType(ModuleLoadType.INIT),
        );

        for (const module of initModules) {
            await this.loadModule(module, bootstrap);
        }

        this.initModulesLoaded = true;
        this.isInitialized = true;
    }

    /**
     * Загрузка модулей типа NORMAL после старта приложения
     *
     * @return {Promise<void>}
     */
    async loadNormalModules(): Promise<void> {
        if (!this.initModulesLoaded) {
            throw new Error('Init modules must be loaded first');
        }

        const bootstrap = this.getBootstrap();
        const normalModules = this.sortModulesByPriority(
            this.getModulesByType(ModuleLoadType.NORMAL),
        );

        for (const module of normalModules) {
            await this.loadDependencies(module, bootstrap);

            const canLoad = await this.checkLoadConditions(module, bootstrap);
            if (canLoad) {
                await this.loadModule(module, bootstrap);
            }
        }
    }

    /**
     * Получает модули зависимостей и проверяет их наличие
     *
     * @param {string} moduleName - Имя модуля, для которого получаем зависимости.
     * @param {string[]} dependencyNames - Массив имен зависимостей.
     * @return {Module[]} - Массив модулей зависимостей.
     * @throws {Error} Если какие-то зависимости не найдены.
     */
    private getDependencyModules(moduleName: string, dependencyNames: string[]): Module[] {
        const dependencyModules = dependencyNames
            .map((name) => this.getModule(name))
            .filter((m): m is Module => m !== undefined);

        const missingDependencies = dependencyNames.filter(
            (name) => !this.getModule(name),
        );

        if (missingDependencies.length > 0) {
            throw new Error(
                `Missing dependencies for module ${moduleName}: ${missingDependencies.join(', ')}`,
            );
        }

        return dependencyModules;
    }

    /**
     * Сортирует модули по приоритету загрузки
     *
     * @param {Module[]} modules - Массив модулей для сортировки.
     * @return {Module[]} - Отсортированный массив модулей.
     */
    private sortModulesByPriority(modules: Module[]): Module[] {
        return [...modules].sort((a, b) => {
            const priorityA = a.loadPriority ?? 0;
            const priorityB = b.loadPriority ?? 0;
            return priorityA - priorityB;
        });
    }

    /**
     * Загрузка модуля типа LAZY по требованию
     *
     * @param {string} moduleName - Имя модуля для загрузки.
     * @return {Promise<void>}
     */
    async loadLazyModule(moduleName: string): Promise<void> {
        const module = this.getModule(moduleName);
        if (!module) {
            throw new Error(`Module "${moduleName}" not found`);
        }

        const loadType = module.loadType ?? ModuleLoadType.NORMAL;
        if (loadType !== ModuleLoadType.LAZY) {
            throw new Error(`Module "${moduleName}" is not a lazy module`);
        }

        const bootstrap = this.getBootstrap();

        await this.loadDependencies(module, bootstrap);
        await this.loadModule(module, bootstrap);
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
        return this.initModulesLoaded;
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
        // Сначала проверяем кеш по полному имени маршрута
        const cachedModule = this.routeToModuleCache.get(routeName);
        if (cachedModule) {
            return cachedModule;
        }

        // Затем проверяем по первому сегменту
        const firstSegment = routeName.split('.')[0];
        return this.routeToModuleCache.get(firstSegment);
    }

    /**
     * Автоматическая загрузка LAZY модуля по имени маршрута
     *
     * @param {string} routeName - Имя маршрута.
     * @return {Promise<void>}
     */
    async autoLoadLazyModuleByRoute(routeName: string): Promise<void> {
        const module = this.getModuleByRouteName(routeName);
        if (!module) {
            return;
        }

        const loadType = module.loadType ?? ModuleLoadType.NORMAL;
        if (loadType !== ModuleLoadType.LAZY || this.isModuleLoaded(module.name)) {
            return;
        }

        await this.loadLazyModule(module.name);
    }
}

