import { type Module } from '../../../modules/interface';
import { type Bootstrap } from '../../index';
import { AccessControlModel } from '@todo/common';
import { log } from '@todo/core';

/**
 * Валидатор условий загрузки модулей
 */
export class ModuleConditionValidator {
    /**
     * Проверка feature flags
     *
     * @param {string[]} featureFlags - Массив feature flags для проверки.
     * @param {Bootstrap} bootstrap - Инстанс Bootstrap.
     * @return {Promise<boolean>} - true, если все feature flags присутствуют.
     */
    async checkFeatureFlags(featureFlags: string[], bootstrap: Bootstrap): Promise<boolean> {
        log.debug(`Checking feature flags: ${featureFlags.join(', ')}`, { prefix: 'bootstrap.moduleLoader.conditionValidator' });
        try {
            const accessControlModel = bootstrap.di.get<AccessControlModel>('AccessControlModel');
            const result = await Promise.resolve(accessControlModel.includesFeatureFlags(featureFlags));
            log.debug(`Feature flags check result: ${result}`, { prefix: 'bootstrap.moduleLoader.conditionValidator' });
            return result;
        } catch (error) {
            // Если AccessControlModel не найден, считаем что feature flags не выполнены
            log.error('AccessControlModel not found, feature flags check failed', { prefix: 'bootstrap.moduleLoader.conditionValidator' }, error);
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
    async checkAccessPermissions(
        accessPermissions: string[],
        bootstrap: Bootstrap,
    ): Promise<boolean> {
        log.debug(`Checking access permissions: ${accessPermissions.join(', ')}`, { prefix: 'bootstrap.moduleLoader.conditionValidator' });
        try {
            const accessControlModel = bootstrap.di.get<AccessControlModel>('AccessControlModel');
            const result = await Promise.resolve(accessControlModel.includesPermissions(accessPermissions));
            log.debug(`Access permissions check result: ${result}`, { prefix: 'bootstrap.moduleLoader.conditionValidator' });
            return result;
        } catch (error) {
            // Если AccessControlModel не найден, считаем что permissions не выполнены
            log.error('AccessControlModel not found, access permissions check failed', { prefix: 'bootstrap.moduleLoader.conditionValidator' }, error);
            return false;
        }
    }

    /**
     * Проверка условий загрузки модуля
     *
     * @param {Module} module - Модуль для проверки.
     * @param {Bootstrap} bootstrap - Инстанс Bootstrap.
     * @param {isModuleLoadedFn} isModuleLoadedFn - Функция проверки загрузки модуля.
     * @return {Promise<boolean>} - true, если модуль может быть загружен.
     */
    async checkLoadConditions(
        module: Module,
        bootstrap: Bootstrap,
        isModuleLoadedFn: (name: string) => boolean,
    ): Promise<boolean> {
        log.debug(`Checking load conditions for module: ${module.name}`, { prefix: 'bootstrap.moduleLoader.conditionValidator' });
        if (!module.loadCondition) {
            log.debug(`Module ${module.name} has no load conditions, allowing load`, { prefix: 'bootstrap.moduleLoader.conditionValidator' });
            return true;
        }

        const { featureFlags, accessPermissions, dependencies } = module.loadCondition;

        // Проверка feature flags
        if (featureFlags && featureFlags.length > 0) {
            const hasFeatureFlags = await this.checkFeatureFlags(featureFlags, bootstrap);
            if (!hasFeatureFlags) {
                log.error(`Module ${module.name} failed feature flags check`, { prefix: 'bootstrap.moduleLoader.conditionValidator' });
                return false;
            }
        }

        // Проверка прав доступа
        if (accessPermissions && accessPermissions.length > 0) {
            const hasPermissions = await this.checkAccessPermissions(accessPermissions, bootstrap);
            if (!hasPermissions) {
                log.error(`Module ${module.name} failed access permissions check`, { prefix: 'bootstrap.moduleLoader.conditionValidator' });
                return false;
            }
        }

        // Проверка зависимостей
        if (dependencies && dependencies.length > 0) {
            if (!this.checkDependencies(module.name, dependencies, isModuleLoadedFn)) {
                log.error(`Module ${module.name} failed dependencies check`, { prefix: 'bootstrap.moduleLoader.conditionValidator' });
                return false;
            }
        }

        log.debug(`Module ${module.name} passed all load conditions`, { prefix: 'bootstrap.moduleLoader.conditionValidator' });
        return true;
    }

    /**
     * Проверяет зависимости модуля
     *
     * @param {string} moduleName - Имя модуля.
     * @param {string[]} dependencies - Массив имен зависимостей.
     * @param {isModuleLoadedFn} isModuleLoadedFn - Функция проверки загрузки модуля.
     * @return {boolean} - true, если все зависимости загружены.
     */
    private checkDependencies(
        moduleName: string,
        dependencies: string[],
        isModuleLoadedFn: (name: string) => boolean,
    ): boolean {
        log.debug(`Checking dependencies for module ${moduleName}: ${dependencies.join(', ')}`, { prefix: 'bootstrap.moduleLoader.conditionValidator' });
        const missingDeps = dependencies.filter((depName) => !isModuleLoadedFn(depName));

        if (missingDeps.length > 0) {
            log.error(`Module ${moduleName} missing dependencies: ${missingDeps.join(', ')}`, { prefix: 'bootstrap.moduleLoader.conditionValidator' });
            return false;
        }

        log.debug(`Module ${moduleName} all dependencies are loaded`, { prefix: 'bootstrap.moduleLoader.conditionValidator' });
        return true;
    }
}

