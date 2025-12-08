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
    // Проверяем, не были ли INIT модули уже загружены
    if (this.registry.isInitModulesLoaded) {
      log.error('INIT модули уже были загружены', { prefix: LOG_PREFIX });
      throw new Error('INIT модули уже были загружены');
    }

    // Фильтруем только INIT модули
    const initModules = modules.filter((m) => this.isApplicable(m));

    // Сортируем по приоритету
    const sortedModules = this.registry.sortModulesByPriority(initModules);

    log.debug(`Загрузка ${sortedModules.length} INIT модулей`, {
      prefix: LOG_PREFIX,
    });

    // Загружаем последовательно
    for (const module of sortedModules) {
      await this.loadSingleModule(module, bootstrap);
    }

    // Помечаем, что INIT модули загружены
    this.registry.setInitModulesLoaded(true);

    log.debug('Все INIT модули загружены', { prefix: LOG_PREFIX });
  }

  /**
   * Загружает один INIT модуль.
   *
   * @param module - Модуль для загрузки
   * @param bootstrap - Инстанс Bootstrap
   */
  private async loadSingleModule(
    module: Module,
    bootstrap: Bootstrap,
  ): Promise<void> {
    // Проверяем, не загружен ли уже
    if (this.statusTracker.isLoaded(module.name)) {
      log.debug(`INIT модуль "${module.name}" уже загружен`, {
        prefix: LOG_PREFIX,
      });
      return;
    }

    log.debug(
      `Загрузка INIT модуля "${module.name}" (приоритет: ${module.loadPriority ?? 0})`,
      { prefix: LOG_PREFIX },
    );

    this.statusTracker.markAsLoading(module);

    try {
      // Инициализируем модуль (вызываем onModuleInit)
      await this.lifecycleManager.initializeModule(module, bootstrap, false);

      // Регистрируем ресурсы (маршруты и i18n)
      await this.lifecycleManager.registerModuleResources(
        module,
        bootstrap,
        (name: string) => this.statusTracker.isLoaded(name),
      );

      this.statusTracker.markAsLoaded(module);

      log.debug(`INIT модуль "${module.name}" загружен успешно`, {
        prefix: LOG_PREFIX,
      });
    } catch (error) {
      this.statusTracker.markAsFailed(module, error);
      log.error(`Ошибка загрузки INIT модуля "${module.name}"`, {
        prefix: LOG_PREFIX,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }
}
