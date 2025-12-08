/**
 * Валидатор условий загрузки модулей.
 * 
 * Отвечает за:
 * - Проверку feature flags
 * - Проверку прав доступа (permissions)
 * - Проверку зависимостей модулей
 * - Комплексную валидацию условий загрузки
 * 
 * @module services/ConditionValidator
 */

import { IOC_CORE_TOKENS, log } from '@platform/core';
import type { AccessControlModel } from '@platform/common';
import type { Module } from '../../../../modules/interface';
import type { Bootstrap } from '../../../index';
import type { IsModuleLoadedFunction } from '../types';
import { getModuleDependencies } from '../utils/moduleUtils';

/** Префикс для логирования */
const LOG_PREFIX = 'moduleLoader.conditionValidator';

/**
 * Результат проверки условий загрузки.
 */
export interface ValidationResult {
  /** Можно ли загрузить модуль */
  canLoad: boolean;
  /** Причина отказа (если canLoad === false) */
  reason?: string;
  /** Детали проверки */
  details?: {
    featureFlags?: { required: string[]; missing: string[] };
    permissions?: { required: string[]; missing: string[] };
    dependencies?: { required: string[]; missing: string[] };
  };
}

/**
 * Валидатор условий загрузки модулей.
 * 
 * Проверяет выполнение условий перед загрузкой модуля:
 * - Feature flags (функциональные флаги)
 * - Access permissions (права доступа)
 * - Dependencies (зависимости от других модулей)
 */
export class ConditionValidator {
  constructor() {
    log.debug('ConditionValidator: инициализация', { prefix: LOG_PREFIX });
  }

  // ============================================
  // Публичные методы: Комплексная проверка
  // ============================================

  /**
   * Проверяет все условия загрузки модуля.
   * 
   * @param module - Модуль для проверки
   * @param bootstrap - Инстанс Bootstrap
   * @param isModuleLoaded - Функция проверки загрузки модуля
   * @returns true, если все условия выполнены
   */
  public async validateLoadConditions(
    module: Module,
    bootstrap: Bootstrap,
    isModuleLoaded: IsModuleLoadedFunction,
  ): Promise<boolean> {
    const result = await this.validateLoadConditionsWithDetails(
      module,
      bootstrap,
      isModuleLoaded,
    );
    return result.canLoad;
  }

  /**
   * Проверяет все условия загрузки модуля с детальным результатом.
   * 
   * @param module - Модуль для проверки
   * @param bootstrap - Инстанс Bootstrap
   * @param isModuleLoaded - Функция проверки загрузки модуля
   * @returns Детальный результат проверки
   */
  public async validateLoadConditionsWithDetails(
    module: Module,
    bootstrap: Bootstrap,
    isModuleLoaded: IsModuleLoadedFunction,
  ): Promise<ValidationResult> {
    log.debug(`Проверка условий загрузки модуля "${module.name}"`, {
      prefix: LOG_PREFIX,
    });

    // Если условий нет, разрешаем загрузку
    if (!module.loadCondition) {
      log.debug(`Модуль "${module.name}" не имеет условий загрузки`, {
        prefix: LOG_PREFIX,
      });
      return { canLoad: true };
    }

    const { featureFlags, accessPermissions } = module.loadCondition;
    const dependencies = getModuleDependencies(module);

    // Проверка feature flags
    if (featureFlags && featureFlags.length > 0) {
      const hasFlags = await this.checkFeatureFlags(featureFlags, bootstrap);
      if (!hasFlags) {
        log.debug(`Модуль "${module.name}": feature flags не выполнены`, {
          prefix: LOG_PREFIX,
        });
        return {
          canLoad: false,
          reason: 'Feature flags не выполнены',
          details: { featureFlags: { required: featureFlags, missing: featureFlags } },
        };
      }
    }

    // Проверка прав доступа
    if (accessPermissions && accessPermissions.length > 0) {
      const hasPermissions = await this.checkAccessPermissions(
        accessPermissions,
        bootstrap,
      );
      if (!hasPermissions) {
        log.debug(`Модуль "${module.name}": права доступа не выполнены`, {
          prefix: LOG_PREFIX,
        });
        return {
          canLoad: false,
          reason: 'Права доступа не выполнены',
          details: {
            permissions: { required: accessPermissions, missing: accessPermissions },
          },
        };
      }
    }

    // Проверка зависимостей
    if (dependencies.length > 0) {
      const missingDeps = this.findMissingDependencies(dependencies, isModuleLoaded);
      if (missingDeps.length > 0) {
        log.debug(
          `Модуль "${module.name}": отсутствуют зависимости: ${missingDeps.join(', ')}`,
          { prefix: LOG_PREFIX },
        );
        return {
          canLoad: false,
          reason: `Отсутствуют зависимости: ${missingDeps.join(', ')}`,
          details: { dependencies: { required: dependencies, missing: missingDeps } },
        };
      }
    }

    log.debug(`Модуль "${module.name}": все условия выполнены`, {
      prefix: LOG_PREFIX,
    });
    return { canLoad: true };
  }

  // ============================================
  // Публичные методы: Проверка отдельных условий
  // ============================================

  /**
   * Проверяет наличие всех требуемых feature flags.
   * 
   * @param featureFlags - Массив требуемых feature flags
   * @param bootstrap - Инстанс Bootstrap
   * @returns true, если все флаги присутствуют
   */
  public async checkFeatureFlags(
    featureFlags: string[],
    bootstrap: Bootstrap,
  ): Promise<boolean> {
    log.debug(`Проверка feature flags: ${featureFlags.join(', ')}`, {
      prefix: LOG_PREFIX,
    });

    try {
      const accessControlModel = this.getAccessControlModel(bootstrap);
      if (!accessControlModel) {
        log.debug('AccessControlModel не найден, feature flags проверка не пройдена', {
          prefix: LOG_PREFIX,
        });
        return false;
      }

      const result = await Promise.resolve(
        accessControlModel.includesFeatureFlags(featureFlags),
      );

      log.debug(`Feature flags проверка: ${result ? 'успех' : 'неудача'}`, {
        prefix: LOG_PREFIX,
      });
      return result;
    } catch (error) {
      log.error('Ошибка при проверке feature flags', {
        prefix: LOG_PREFIX,
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }

  /**
   * Проверяет наличие всех требуемых прав доступа.
   * 
   * @param permissions - Массив требуемых прав
   * @param bootstrap - Инстанс Bootstrap
   * @returns true, если все права присутствуют
   */
  public async checkAccessPermissions(
    permissions: string[],
    bootstrap: Bootstrap,
  ): Promise<boolean> {
    log.debug(`Проверка прав доступа: ${permissions.join(', ')}`, {
      prefix: LOG_PREFIX,
    });

    try {
      const accessControlModel = this.getAccessControlModel(bootstrap);
      if (!accessControlModel) {
        log.debug('AccessControlModel не найден, проверка прав не пройдена', {
          prefix: LOG_PREFIX,
        });
        return false;
      }

      const result = await Promise.resolve(
        accessControlModel.includesPermissions(permissions),
      );

      log.debug(`Проверка прав доступа: ${result ? 'успех' : 'неудача'}`, {
        prefix: LOG_PREFIX,
      });
      return result;
    } catch (error) {
      log.error('Ошибка при проверке прав доступа', {
        prefix: LOG_PREFIX,
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }

  /**
   * Проверяет, загружены ли все зависимости модуля.
   * 
   * @param dependencies - Массив имен зависимостей
   * @param isModuleLoaded - Функция проверки загрузки модуля
   * @returns true, если все зависимости загружены
   */
  public checkDependencies(
    dependencies: string[],
    isModuleLoaded: IsModuleLoadedFunction,
  ): boolean {
    log.debug(`Проверка зависимостей: ${dependencies.join(', ')}`, {
      prefix: LOG_PREFIX,
    });

    const missingDeps = this.findMissingDependencies(dependencies, isModuleLoaded);
    const result = missingDeps.length === 0;

    if (!result) {
      log.debug(`Отсутствующие зависимости: ${missingDeps.join(', ')}`, {
        prefix: LOG_PREFIX,
      });
    }

    return result;
  }

  /**
   * Находит отсутствующие зависимости.
   * 
   * @param dependencies - Массив имен зависимостей
   * @param isModuleLoaded - Функция проверки загрузки модуля
   * @returns Массив имен отсутствующих зависимостей
   */
  public findMissingDependencies(
    dependencies: string[],
    isModuleLoaded: IsModuleLoadedFunction,
  ): string[] {
    return dependencies.filter((depName) => !isModuleLoaded(depName));
  }

  // ============================================
  // Публичные методы: Проверка для предзагрузки
  // ============================================

  /**
   * Проверяет условия для предзагрузки модуля (без проверки зависимостей).
   * 
   * Используется при предзагрузке, когда зависимости еще не загружены.
   * 
   * @param module - Модуль для проверки
   * @param bootstrap - Инстанс Bootstrap
   * @returns true, если модуль можно предзагрузить
   */
  public async shouldSkipInPreload(
    module: Module,
    bootstrap: Bootstrap,
  ): Promise<boolean> {
    if (!module.loadCondition) {
      return false;
    }

    const { featureFlags, accessPermissions } = module.loadCondition;

    // Проверяем только feature flags и permissions (не зависимости)
    if (featureFlags && featureFlags.length > 0) {
      const hasFlags = await this.checkFeatureFlags(featureFlags, bootstrap);
      if (!hasFlags) {
        log.debug(`Модуль "${module.name}" пропущен при предзагрузке: feature flags`, {
          prefix: LOG_PREFIX,
        });
        return true;
      }
    }

    if (accessPermissions && accessPermissions.length > 0) {
      const hasPermissions = await this.checkAccessPermissions(
        accessPermissions,
        bootstrap,
      );
      if (!hasPermissions) {
        log.debug(`Модуль "${module.name}" пропущен при предзагрузке: права доступа`, {
          prefix: LOG_PREFIX,
        });
        return true;
      }
    }

    return false;
  }

  // ============================================
  // Приватные методы
  // ============================================

  /**
   * Получает AccessControlModel из DI контейнера.
   * 
   * @param bootstrap - Инстанс Bootstrap
   * @returns AccessControlModel или null, если не найден
   */
  private getAccessControlModel(bootstrap: Bootstrap): AccessControlModel | null {
    try {
      return bootstrap.di.get<AccessControlModel>(
        IOC_CORE_TOKENS.MODEL_ACCESS_CONTROL,
      );
    } catch {
      return null;
    }
  }
}

