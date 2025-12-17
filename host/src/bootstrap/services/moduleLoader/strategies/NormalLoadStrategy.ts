/**
 * Стратегия загрузки NORMAL модулей.
 *
 * NORMAL модули загружаются:
 * - После INIT модулей
 * - Параллельно по уровням зависимостей
 * - С учетом условий загрузки (featureFlags, permissions, dependencies)
 *
 * @module strategies/NormalLoadStrategy
 */

import { log } from '@platform/core';
import { type Module, ModuleLoadType } from '../../../../modules/interface';
import type { Bootstrap } from '../../../index';
import type { ILoadStrategy } from './LoadStrategy';
import type { ModuleRegistry } from '../core/ModuleRegistry';
import type { ModuleStatusTracker } from '../core/ModuleStatusTracker';
import type { LifecycleManager } from '../services/LifecycleManager';
import type { AutoLoadByRouteFunction } from '../types';
import { loadNormalModulesProd } from '../prod';

/** Префикс для логирования */
const LOG_PREFIX = 'moduleLoader.normalStrategy';

/**
 * Стратегия загрузки NORMAL модулей.
 *
 * NORMAL модули загружаются в фоновом режиме после инициализации приложения.
 * Поддерживает параллельную загрузку независимых модулей.
 */
export class NormalLoadStrategy implements ILoadStrategy {
  public readonly name = 'NormalLoadStrategy';

  constructor(
    private readonly registry: ModuleRegistry,
    private readonly statusTracker: ModuleStatusTracker,
    private readonly lifecycleManager: LifecycleManager,
    private readonly autoLoadHandler: AutoLoadByRouteFunction,
  ) {
    log.debug('NormalLoadStrategy: инициализация', { prefix: LOG_PREFIX });
  }

  /**
   * Проверяет, является ли модуль NORMAL модулем.
   *
   * @param module - Модуль для проверки
   * @returns true, если модуль типа NORMAL
   */
  public isApplicable(module: Module): boolean {
    const loadType = module.loadType ?? ModuleLoadType.NORMAL;
    return loadType === ModuleLoadType.NORMAL;
  }

  /**
   * Загружает NORMAL модули параллельно по уровням зависимостей.
   *
   * @param modules - Массив NORMAL модулей
   * @param bootstrap - Инстанс Bootstrap
   */
  public async loadModules(
    modules: Module[],
    bootstrap: Bootstrap,
  ): Promise<void> {
    if (!this.registry.isInitModulesLoaded) {
      log.error('INIT модули должны быть загружены первыми', {
        prefix: LOG_PREFIX,
      });
      throw new Error('INIT модули должны быть загружены первыми');
    }

    const normalModules = modules.filter((m) => this.isApplicable(m));
    const sortedModules = this.registry.sortModulesByPriority(normalModules);

    // === РАЗВИЛКА Dev/Prod ===
    if (import.meta.env.DEV) {
      log.debug('[DEV] Используем dev-загрузчик для NORMAL модулей', {
        prefix: LOG_PREFIX,
      });

      // Динамический импорт dev-логики
      const { loadNormalModulesDev } = await import('../dev');
      await loadNormalModulesDev(sortedModules, {
        registry: this.registry,
        statusTracker: this.statusTracker,
        lifecycleManager: this.lifecycleManager,
        bootstrap,
        autoLoadHandler: this.autoLoadHandler,
      });
    } else {
      log.debug('[PROD] Используем prod-загрузчик для NORMAL модулей', {
        prefix: LOG_PREFIX,
      });

      // В prod-режиме считаем, что модули уже отсортированы сервером
      // Пока используем плоский список как один уровень
      await loadNormalModulesProd([sortedModules], {
        registry: this.registry,
        statusTracker: this.statusTracker,
        lifecycleManager: this.lifecycleManager,
        bootstrap,
        autoLoadHandler: this.autoLoadHandler,
      });
    }
  }
}
