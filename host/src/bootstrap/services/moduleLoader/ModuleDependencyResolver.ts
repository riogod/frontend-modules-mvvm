import { type Module } from '../../../modules/interface';
import { type Bootstrap } from '../../index';
import { type ModuleRegistry } from './ModuleRegistry';
import { log } from '@todo/core';

/**
 * Резолвер зависимостей модулей
 */
export class ModuleDependencyResolver {
    constructor(private registry: ModuleRegistry) { }

    /**
     * Получает модули зависимостей и проверяет их наличие
     *
     * @param {string} moduleName - Имя модуля, для которого получаем зависимости.
     * @param {string[]} dependencyNames - Массив имен зависимостей.
     * @return {Module[]} - Массив модулей зависимостей.
     * @throws {Error} Если какие-то зависимости не найдены.
     */
    getDependencyModules(moduleName: string, dependencyNames: string[]): Module[] {
        log.debug(`Getting dependency modules for ${moduleName}: ${dependencyNames.join(', ')}`, { prefix: 'bootstrap.moduleLoader.dependencyResolver' });
        const dependencyModules = dependencyNames
            .map((name) => this.registry.getModule(name))
            .filter((m): m is Module => m !== undefined);

        const missingDependencies = dependencyNames.filter(
            (name) => !this.registry.getModule(name),
        );

        if (missingDependencies.length > 0) {
            log.error(`Missing dependencies for module ${moduleName}: ${missingDependencies.join(', ')}`, { prefix: 'bootstrap.moduleLoader.dependencyResolver' });
            throw new Error(
                `Missing dependencies for module ${moduleName}: ${missingDependencies.join(', ')}`,
            );
        }

        log.debug(`Found ${dependencyModules.length} dependency modules for ${moduleName}`, { prefix: 'bootstrap.moduleLoader.dependencyResolver' });
        return dependencyModules;
    }

    /**
     * Загрузка зависимостей модуля (рекурсивно)
     *
     * @param {Module} module - Модуль, для которого загружаются зависимости.
     * @param {Bootstrap} bootstrap - Инстанс Bootstrap.
     * @param {visited} visited - Множество уже посещенных модулей для предотвращения циклов.
     * @param {loadModuleFn} loadModuleFn - Функция загрузки модуля.
     * @param {isModuleLoadedFn} isModuleLoadedFn - Функция проверки загрузки модуля.
     * @return {Promise<void>}
     */
    async loadDependencies(
        module: Module,
        bootstrap: Bootstrap,
        visited: Set<string> = new Set(),
        loadModuleFn: (module: Module, bootstrap: Bootstrap) => Promise<void>,
        isModuleLoadedFn: (name: string) => boolean,
    ): Promise<void> {
        if (!module.loadCondition?.dependencies) {
            return;
        }

        log.debug(`Loading dependencies for module: ${module.name}`, { prefix: 'bootstrap.moduleLoader.dependencyResolver' });
        // Проверка на циклические зависимости
        if (visited.has(module.name)) {
            log.error(`Circular dependency detected: ${Array.from(visited).join(' -> ')} -> ${module.name}`, { prefix: 'bootstrap.moduleLoader.dependencyResolver' });
            throw new Error(
                `Circular dependency detected: ${Array.from(visited).join(' -> ')} -> ${module.name}`,
            );
        }

        visited.add(module.name);

        const dependencies = module.loadCondition.dependencies;
        const dependencyModules = this.getDependencyModules(module.name, dependencies);

        // Сортируем зависимости по приоритету
        const sortedDependencies = this.registry.sortModulesByPriority(dependencyModules);
        log.debug(`Loading ${sortedDependencies.length} dependencies for ${module.name} (sorted by priority)`, { prefix: 'bootstrap.moduleLoader.dependencyResolver' });

        // Загружаем зависимости последовательно (рекурсивно)
        for (const depModule of sortedDependencies) {
            if (!isModuleLoadedFn(depModule.name)) {
                log.debug(`Loading dependency ${depModule.name} for module ${module.name}`, { prefix: 'bootstrap.moduleLoader.dependencyResolver' });
                await this.loadDependencies(
                    depModule,
                    bootstrap,
                    visited,
                    loadModuleFn,
                    isModuleLoadedFn,
                );
                await loadModuleFn(depModule, bootstrap);
                log.debug(`Dependency ${depModule.name} loaded for module ${module.name}`, { prefix: 'bootstrap.moduleLoader.dependencyResolver' });
            } else {
                log.debug(`Dependency ${depModule.name} already loaded, skipping`, { prefix: 'bootstrap.moduleLoader.dependencyResolver' });
            }
        }

        visited.delete(module.name);
        log.debug(`All dependencies loaded for module: ${module.name}`, { prefix: 'bootstrap.moduleLoader.dependencyResolver' });
    }
}

