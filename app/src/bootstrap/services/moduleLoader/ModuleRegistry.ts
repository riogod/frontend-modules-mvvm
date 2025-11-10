import { Module, ModuleLoadType } from '../../../modules/interface';
import { IRoutes } from '@todo/core';
import { ModuleConfig } from '../../../bootstrap/interface';

/**
 * Реестр модулей - управление списком модулей
 */
export class ModuleRegistry {
    private modules: Module[] = [];
    private routeToModuleCache: Map<string, Module> = new Map();
    private routesCache: Map<string, IRoutes> = new Map();
    private initModulesLoaded: boolean = false;

    /**
     * Добавление модуля в реестр
     * Для INIT модулей кеширует маршруты сразу
     * Для LAZY модулей маршруты будут закешированы при первом обращении
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

        this.modules.push(module);

        // Для INIT модулей кешируем маршруты сразу
        // Для LAZY модулей маршруты будут закешированы при первом обращении
        const loadType = module.loadType ?? ModuleLoadType.NORMAL;
        if (loadType === ModuleLoadType.INIT) {
            await this.cacheModuleRoutes(module);
        }
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
     * Загружает конфигурацию модуля динамически (для LAZY модулей)
     * Ожидает разрешения Promise, если config является Promise
     *
     * @param {Module} module - Модуль для загрузки конфигурации.
     * @return {Promise<void>}
     */
    async loadModuleConfig(module: Module): Promise<void> {
        const loadType = module.loadType ?? ModuleLoadType.NORMAL;

        // Для LAZY модулей загружаем конфигурацию динамически
        if (loadType === ModuleLoadType.LAZY) {
            // Если config - это Promise, ждем его разрешения
            if (module.config instanceof Promise) {
                try {
                    const config = await module.config;
                    // Заменяем Promise на загруженную конфигурацию
                    (module as any).config = config;
                } catch (error) {
                    throw new Error(
                        `Failed to load config for module "${module.name}": ${error instanceof Error ? error.message : String(error)}`,
                    );
                }
            }
        }
    }

    /**
     * Получает маршруты модуля с кешированием результата
     * Кеширует результат ROUTES() для избежания повторных вызовов
     * Для LAZY модулей автоматически загружает конфигурацию при первом обращении
     *
     * @param {Module} module - Модуль для получения маршрутов.
     * @return {Promise<IRoutes | undefined>} - Массив маршрутов или undefined, если маршруты не определены.
     */
    async getModuleRoutes(module: Module): Promise<IRoutes | undefined> {
        // Для LAZY модулей загружаем конфигурацию, если она еще не загружена
        await this.loadModuleConfig(module);

        if (!module.config || !module.config.ROUTES) {
            return undefined;
        }

        // Проверяем кеш
        if (this.routesCache.has(module.name)) {
            return this.routesCache.get(module.name)!;
        }

        // Вызываем ROUTES() только один раз и кешируем результат
        // После loadModuleConfig config гарантированно не является Promise
        const routes = (module.config as ModuleConfig).ROUTES();
        this.routesCache.set(module.name, routes);
        return routes;
    }

    /**
     * Заполняет кеш соответствия маршрутов к модулю
     * Использует кешированный результат ROUTES() для оптимизации
     * Для LAZY модулей загружает конфигурацию динамически
     *
     * @param {Module} module - Модуль для кеширования маршрутов.
     * @return {Promise<void>}
     */
    private async cacheModuleRoutes(module: Module): Promise<void> {
        const routes = await this.getModuleRoutes(module);
        if (!routes) {
            return;
        }

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
     * Сортирует модули по приоритету загрузки
     *
     * @param {Module[]} modules - Массив модулей для сортировки.
     * @return {Module[]} - Отсортированный массив модулей.
     */
    sortModulesByPriority(modules: Module[]): Module[] {
        return [...modules].sort((a, b) => {
            const priorityA = a.loadPriority ?? 0;
            const priorityB = b.loadPriority ?? 0;
            return priorityA - priorityB;
        });
    }

    /**
     * Установка флага загрузки INIT модулей
     *
     * @param {boolean} value - Значение флага.
     * @return {void}
     */
    setInitModulesLoaded(value: boolean): void {
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

