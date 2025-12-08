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
import type { ConditionValidator } from '../services/ConditionValidator';
import type { DependencyResolver } from '../services/DependencyResolver';
import { DependencyLevelBuilder } from '../utils/DependencyLevelBuilder';
import type { AutoLoadByRouteFunction } from '../types';

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
    private readonly conditionValidator: ConditionValidator,
    private readonly dependencyResolver: DependencyResolver,
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
    // Проверяем, загружены ли INIT модули
    if (!this.registry.isInitModulesLoaded) {
      log.error('INIT модули должны быть загружены первыми', {
        prefix: LOG_PREFIX,
      });
      throw new Error('INIT модули должны быть загружены первыми');
    }

    // Фильтруем только NORMAL модули
    const normalModules = modules.filter((m) => this.isApplicable(m));

    // Сортируем по приоритету
    const sortedModules = this.registry.sortModulesByPriority(normalModules);

    log.debug(`Загрузка ${sortedModules.length} NORMAL модулей`, {
      prefix: LOG_PREFIX,
    });

    // Группируем по уровням зависимостей
    const levelBuilder = new DependencyLevelBuilder(
      this.registry,
      (name: string) => this.statusTracker.isLoaded(name),
      (name: string) => this.statusTracker.isPreloaded(name),
    );

    const { levels, skippedModules } =
      levelBuilder.buildDependencyLevels(sortedModules);

    if (skippedModules.length > 0) {
      log.warn(
        `Пропущено ${skippedModules.length} модулей из-за отсутствующих зависимостей`,
        { prefix: LOG_PREFIX },
      );
    }

    // Загружаем уровни последовательно, модули внутри уровня - параллельно
    for (let i = 0; i < levels.length; i++) {
      const levelModules = levels[i];
      log.debug(
        `Обработка уровня ${i + 1}/${levels.length} (${levelModules.length} модулей)`,
        { prefix: LOG_PREFIX },
      );

      await Promise.all(
        levelModules.map((module: Module) =>
          this.loadSingleModule(module, bootstrap),
        ),
      );

      log.debug(`Уровень ${i + 1}/${levels.length} завершен`, {
        prefix: LOG_PREFIX,
      });
    }

    log.debug('Все NORMAL модули обработаны', { prefix: LOG_PREFIX });
  }

  /**
   * Загружает один NORMAL модуль.
   *
   * @param module - Модуль для загрузки
   * @param bootstrap - Инстанс Bootstrap
   */
  private async loadSingleModule(
    module: Module,
    bootstrap: Bootstrap,
  ): Promise<void> {
    // Проверяем, не загружен ли уже
    if (this.statusTracker.isLoadedOrLoading(module.name)) {
      log.debug(`NORMAL модуль "${module.name}" уже загружен или загружается`, {
        prefix: LOG_PREFIX,
      });
      return;
    }

    // Если модуль предзагружен, просто помечаем как загруженный
    if (this.statusTracker.isPreloaded(module.name)) {
      log.debug(
        `NORMAL модуль "${module.name}" предзагружен, помечаем как загруженный`,
        {
          prefix: LOG_PREFIX,
        },
      );
      this.statusTracker.markAsLoaded(module);
      return;
    }

    // Проверяем условия загрузки
    const canLoad = await this.conditionValidator.validateLoadConditions(
      module,
      bootstrap,
      (name: string) => this.statusTracker.isLoaded(name),
    );

    if (!canLoad) {
      log.debug(
        `NORMAL модуль "${module.name}": условия загрузки не выполнены`,
        {
          prefix: LOG_PREFIX,
        },
      );
      this.statusTracker.markAsFailed(
        module,
        new Error(`Условия загрузки не выполнены для модуля ${module.name}`),
      );
      return;
    }

    log.debug(`Загрузка NORMAL модуля "${module.name}"`, {
      prefix: LOG_PREFIX,
    });

    // Загружаем зависимости
    await this.dependencyResolver.loadDependencies(
      module,
      bootstrap,
      (m: Module, b: Bootstrap) => this.loadSingleModuleInternal(m, b),
      (name: string) => this.statusTracker.isLoaded(name),
    );

    // Загружаем сам модуль
    await this.loadSingleModuleInternal(module, bootstrap);
  }

  /**
   * Внутренний метод загрузки модуля (без проверки зависимостей).
   *
   * @param module - Модуль для загрузки
   * @param bootstrap - Инстанс Bootstrap
   */
  private async loadSingleModuleInternal(
    module: Module,
    bootstrap: Bootstrap,
  ): Promise<void> {
    if (this.statusTracker.isLoadedOrLoading(module.name)) {
      return;
    }

    this.statusTracker.markAsLoading(module);

    try {
      // Инициализируем модуль
      await this.lifecycleManager.initializeModule(module, bootstrap, false);

      // Регистрируем ресурсы
      await this.lifecycleManager.registerModuleResources(
        module,
        bootstrap,
        (name: string) => this.statusTracker.isLoaded(name),
        this.autoLoadHandler,
      );

      this.statusTracker.markAsLoaded(module);

      log.debug(`NORMAL модуль "${module.name}" загружен успешно`, {
        prefix: LOG_PREFIX,
      });
    } catch (error) {
      this.statusTracker.markAsFailed(module, error);
      log.error(`Ошибка загрузки NORMAL модуля "${module.name}"`, {
        prefix: LOG_PREFIX,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }
}
