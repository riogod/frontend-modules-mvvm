import { Module } from '../../../modules/interface';
import { Bootstrap } from '../../index';
import { AccessControlModel } from '../../../modules/core.access/models/accessControl.model';

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
        try {
            const accessControlModel = bootstrap.di.get<AccessControlModel>(AccessControlModel);
            return await Promise.resolve(accessControlModel.includesFeatureFlags(featureFlags));
        } catch {
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
    async checkAccessPermissions(
        accessPermissions: string[],
        bootstrap: Bootstrap,
    ): Promise<boolean> {
        try {
            const accessControlModel = bootstrap.di.get<AccessControlModel>(AccessControlModel);
            return await Promise.resolve(accessControlModel.includesPermissions(accessPermissions));
        } catch {
            // Если AccessControlModel не найден, считаем что permissions не выполнены
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
            if (!this.checkDependencies(module.name, dependencies, isModuleLoadedFn)) {
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
     * @param {isModuleLoadedFn} isModuleLoadedFn - Функция проверки загрузки модуля.
     * @return {boolean} - true, если все зависимости загружены.
     */
    private checkDependencies(
        moduleName: string,
        dependencies: string[],
        isModuleLoadedFn: (name: string) => boolean,
    ): boolean {
        const missingDeps = dependencies.filter((depName) => !isModuleLoadedFn(depName));

        if (missingDeps.length > 0) {
            return false;
        }

        return true;
    }
}

