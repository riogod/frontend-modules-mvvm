import { Module, ModuleLoadType } from '../../../modules/interface';
import { ModuleConfig } from '../../interface';
import { Bootstrap } from '../../index';
import { ModuleRegistry } from './ModuleRegistry';
import { ModuleDependencyResolver } from './ModuleDependencyResolver';
import { ModuleConditionValidator } from './ModuleConditionValidator';
import { ModuleLifecycleManager } from './ModuleLifecycleManager';
import { ModuleLoadStatus, LoadedModule } from './types';

/**
 * Сервис загрузки и управления модулями приложения.
 */
export class BootstrapModuleLoader {
    modules: Module[] = [];
    private loadedModules: Map<string, LoadedModule> = new Map();
    private isInitialized: boolean = false;
    private bootstrap: Bootstrap | null = null;

    private registry: ModuleRegistry;
    private dependencyResolver: ModuleDependencyResolver;
    private conditionValidator: ModuleConditionValidator;
    private lifecycleManager: ModuleLifecycleManager;

    constructor() {
        this.registry = new ModuleRegistry();
        this.dependencyResolver = new ModuleDependencyResolver(this.registry);
        this.conditionValidator = new ModuleConditionValidator();
        this.lifecycleManager = new ModuleLifecycleManager(this.registry);
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
     * @return {Promise<void>}
     */
    async addModule(module: Module): Promise<void> {
        await this.registry.addModule(module);
        this.modules = this.registry.getModules();
    }

    /**
     * Добавление нескольких модулей в загрузчик
     *
     * @param {Module[]} modules - Массив модулей для добавления.
     * @return {Promise<void>}
     */
    async addModules(modules: Module[]): Promise<void> {
        for (const module of modules) {
            await this.registry.addModule(module);
        }
        this.modules = this.registry.getModules();
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
     * @return {ModuleConfig | undefined} - Конфигурация модуля или undefined, если не найден.
     */
    getModuleConfig(name: string): ModuleConfig | undefined {
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
     * Получение модулей по типу загрузки
     *
     * @param {ModuleLoadType} loadType - Тип загрузки.
     * @return {Module[]} - Массив модулей указанного типа.
     */
    getModulesByType(loadType: ModuleLoadType): Module[] {
        return this.registry.getModulesByType(loadType);
    }

    /**
     * Предварительная загрузка маршрутов и i18n из всех модулей (включая LAZY)
     * Используется для регистрации всех маршрутов в роутере и загрузки i18n до старта приложения
     * Оптимизировано для параллельной загрузки независимых модулей
     *
     * @return {Promise<void>}
     */
    async preloadRoutes(): Promise<void> {
        const bootstrap = this.getBootstrap();

        // Фильтруем модули, которые нужно обработать
        const modulesToProcess = this.registry
            .getModules()
            .filter((module) => !this.shouldSkipModuleInPreload(module));

        // Группируем модули по уровням зависимостей для параллельной обработки
        const dependencyLevels = this.groupModulesByDependencyLevels(modulesToProcess);

        // Обрабатываем каждый уровень последовательно, модули внутри уровня - параллельно
        for (const levelModules of dependencyLevels) {
            await Promise.all(
                levelModules.map((module) => this.preloadModuleRoutes(module, bootstrap)),
            );
        }
    }

    /**
     * Предзагружает маршруты и i18n для одного модуля
     *
     * @param {Module} module - Модуль для предзагрузки.
     * @param {Bootstrap} bootstrap - Инстанс Bootstrap.
     * @return {Promise<void>}
     */
    private async preloadModuleRoutes(module: Module, bootstrap: Bootstrap): Promise<void> {
        // Для LAZY модулей проверяем условия и загружаем зависимости
        if (await this.shouldSkipLazyModule(module, bootstrap)) {
            return;
        }

        // Загружаем зависимости для LAZY модулей
        await this.preloadLazyModuleDependencies(module, bootstrap);

        // Регистрируем маршруты и i18n
        // Для LAZY модулей автоматически загружает конфигурацию
        await this.lifecycleManager.registerModuleRoutes(
            module,
            bootstrap,
            (routeName) => this.autoLoadLazyModuleByRoute(routeName),
        );
        await this.lifecycleManager.registerModuleI18n(
            module,
            bootstrap,
            (name) => this.isModuleLoaded(name),
        );

        // Инициализируем модуль для добавления мок-обработчиков
        // Это важно для LAZY модулей, чтобы моки были доступны до загрузки модуля
        // Пропускаем onModuleInit, так как это предзагрузка маршрутов
        await this.lifecycleManager.initializeModule(module, bootstrap, true);
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
        const levels: Module[][] = [];
        const processed = new Set<string>();
        const moduleMap = new Map<string, Module>();

        // Создаем карту модулей для быстрого доступа
        for (const module of modules) {
            moduleMap.set(module.name, module);
        }

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
                throw new Error(
                    `Circular dependency detected or missing dependencies. Unprocessed modules: ${unprocessed.join(', ')}`,
                );
            }

            levels.push(currentLevel);
        }

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
            const hasFeatureFlags = await this.conditionValidator.checkFeatureFlags(
                featureFlags,
                bootstrap,
            );
            if (!hasFeatureFlags) {
                return true;
            }
        }

        // Проверяем accessPermissions
        if (accessPermissions && accessPermissions.length > 0) {
            const hasPermissions = await this.conditionValidator.checkAccessPermissions(
                accessPermissions,
                bootstrap,
            );
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

        await this.dependencyResolver.loadDependencies(
            module,
            bootstrap,
            new Set(),
            (m, b) => this.loadModule(m, b),
            (name) => this.isModuleLoaded(name),
        );
    }

    /**
     * Загрузка одного модуля
     *
     * @param {Module} module - Модуль для загрузки.
     * @param {Bootstrap} bootstrap - Инстанс Bootstrap.
     * @return {Promise<void>}
     */
    private async loadModule(module: Module, bootstrap: Bootstrap): Promise<void> {
        if (this.isModuleAlreadyLoadedOrLoading(module.name)) {
            return;
        }

        if (!(await this.validateLoadConditions(module, bootstrap))) {
            return;
        }

        this.markModuleAsLoading(module);

        try {
            // Для LAZY модулей автоматически загружает конфигурацию
            await this.lifecycleManager.registerModuleResources(
                module,
                bootstrap,
                (name) => this.isModuleLoaded(name),
                (routeName) => this.autoLoadLazyModuleByRoute(routeName),
            );
            await this.lifecycleManager.initializeModule(module, bootstrap);
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
        const canLoad = await this.conditionValidator.checkLoadConditions(
            module,
            bootstrap,
            (name) => this.isModuleLoaded(name),
        );

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
     * Инициализация INIT модулей при старте приложения
     *
     * @return {Promise<void>}
     */
    async initInitModules(): Promise<void> {
        if (this.registry.isInitModulesLoaded) {
            throw new Error('Init modules have already been loaded');
        }

        const bootstrap = this.getBootstrap();
        const initModules = this.registry.sortModulesByPriority(
            this.registry.getModulesByType(ModuleLoadType.INIT),
        );

        for (const module of initModules) {
            await this.loadModule(module, bootstrap);
        }

        this.registry.setInitModulesLoaded(true);
        this.isInitialized = true;
    }

    /**
     * Загрузка модулей типа NORMAL после старта приложения
     *
     * @return {Promise<void>}
     */
    async loadNormalModules(): Promise<void> {
        if (!this.registry.isInitModulesLoaded) {
            throw new Error('Init modules must be loaded first');
        }

        const bootstrap = this.getBootstrap();
        const normalModules = this.registry.sortModulesByPriority(
            this.registry.getModulesByType(ModuleLoadType.NORMAL),
        );

        for (const module of normalModules) {
            await this.dependencyResolver.loadDependencies(
                module,
                bootstrap,
                new Set(),
                (m, b) => this.loadModule(m, b),
                (name) => this.isModuleLoaded(name),
            );

            const canLoad = await this.conditionValidator.checkLoadConditions(
                module,
                bootstrap,
                (name) => this.isModuleLoaded(name),
            );
            if (canLoad) {
                await this.loadModule(module, bootstrap);
            }
        }
    }

    /**
     * Загрузка модуля типа LAZY по требованию
     *
     * @param {string} moduleName - Имя модуля для загрузки.
     * @return {Promise<void>}
     */
    async loadLazyModule(moduleName: string): Promise<void> {
        const module = this.registry.getModule(moduleName);
        if (!module) {
            throw new Error(`Module "${moduleName}" not found`);
        }

        const loadType = module.loadType ?? ModuleLoadType.NORMAL;
        if (loadType !== ModuleLoadType.LAZY) {
            throw new Error(`Module "${moduleName}" is not a lazy module`);
        }

        const bootstrap = this.getBootstrap();

        await this.dependencyResolver.loadDependencies(
            module,
            bootstrap,
            new Set(),
            (m, b) => this.loadModule(m, b),
            (name) => this.isModuleLoaded(name),
        );
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
     * Автоматическая загрузка LAZY модуля по имени маршрута
     *
     * @param {string} routeName - Имя маршрута.
     * @return {Promise<void>}
     */
    async autoLoadLazyModuleByRoute(routeName: string): Promise<void> {
        const module = this.registry.getModuleByRouteName(routeName);
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

