/**
 * Стратегия загрузки INIT модулей.
 *
 * INIT модули загружаются:
 * - При старте приложения
 * - Последовательно по приоритету
 * - Без условий загрузки (featureFlags, permissions)
 *
 * @module strategies/InitLoadStrategy
 */

import { log } from '@platform/core';
import { type Module, ModuleLoadType } from '../../../../modules/interface';
import type { Bootstrap } from '../../../index';
import type { ILoadStrategy } from './LoadStrategy';
import type { ModuleRegistry } from '../core/ModuleRegistry';
import type { ModuleStatusTracker } from '../core/ModuleStatusTracker';
import type { LifecycleManager } from '../services/LifecycleManager';
import { loadInitModulesProd } from '../prod';

/** Префикс для логирования */
const LOG_PREFIX = 'moduleLoader.initStrategy';

/**
 * Стратегия загрузки INIT модулей.
 *
 * INIT модули - это модули, которые должны быть загружены
 * при инициализации приложения до отображения UI.
 */
export class InitLoadStrategy implements ILoadStrategy {
  public readonly name = 'InitLoadStrategy';

  constructor(
    private readonly registry: ModuleRegistry,
    private readonly statusTracker: ModuleStatusTracker,
    private readonly lifecycleManager: LifecycleManager,
  ) {
    log.debug('InitLoadStrategy: инициализация', { prefix: LOG_PREFIX });
  }

  /**
   * Проверяет, является ли модуль INIT модулем.
   *
   * @param module - Модуль для проверки
   * @returns true, если модуль типа INIT
   */
  public isApplicable(module: Module): boolean {
    return module.loadType === ModuleLoadType.INIT;
  }

  /**
   * Загружает INIT модули последовательно по приоритету.
   *
   * @param modules - Массив INIT модулей
   * @param bootstrap - Инстанс Bootstrap
   */
  public async loadModules(
    modules: Module[],
    bootstrap: Bootstrap,
  ): Promise<void> {
    if (this.registry.isInitModulesLoaded) {
      throw new Error('INIT модули уже загружены');
    }

    const initModules = modules.filter((m) => this.isApplicable(m));
    const sortedModules = this.registry.sortModulesByPriority(initModules);

    // === РАЗВИЛКА Dev/Prod ===
    if (import.meta.env.DEV) {
      log.debug('[DEV] Используем dev-загрузчик для INIT модулей', {
        prefix: LOG_PREFIX,
      });

      // Динамический импорт dev-логики (не попадет в prod-бандл)
      const { loadInitModulesDev } = await import('../dev');
      await loadInitModulesDev(sortedModules, {
        registry: this.registry,
        statusTracker: this.statusTracker,
        lifecycleManager: this.lifecycleManager,
        bootstrap,
      });
    } else {
      log.debug('[PROD] Используем prod-загрузчик для INIT модулей', {
        prefix: LOG_PREFIX,
      });

      await loadInitModulesProd(sortedModules, {
        registry: this.registry,
        statusTracker: this.statusTracker,
        lifecycleManager: this.lifecycleManager,
        bootstrap,
      });
    }
  }
}
