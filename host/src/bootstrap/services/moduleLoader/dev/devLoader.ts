/**
 * DEV-ONLY: Точка входа для тяжелой dev-логики ModuleLoader.
 *
 * Этот файл НЕ включается в production-сборку.
 * Содержит логику построения графа зависимостей и валидации.
 *
 * @module dev/devLoader
 */

import { log } from '@platform/core';
import type { Module } from '../../../../modules/interface';
import type { Bootstrap } from '../../../index';
import type { ModuleRegistry } from '../core/ModuleRegistry';
import type { ModuleStatusTracker } from '../core/ModuleStatusTracker';
import type { LifecycleManager } from '../services/LifecycleManager';
import { ConditionValidator } from './ConditionValidator';
import { DependencyResolver } from './DependencyResolver';
import { DependencyLevelBuilder } from './DependencyLevelBuilder';

const LOG_PREFIX = 'moduleLoader.dev';

/**
 * Контекст для dev-загрузки модулей.
 */
export interface DevLoaderContext {
  registry: ModuleRegistry;
  statusTracker: ModuleStatusTracker;
  lifecycleManager: LifecycleManager;
  bootstrap: Bootstrap;
  autoLoadHandler?: (routeName: string) => Promise<void>;
}

/**
 * Загружает INIT модули в Dev-режиме.
 * Выполняет полную валидацию и построение порядка загрузки.
 */
export async function loadInitModulesDev(
  modules: Module[],
  context: DevLoaderContext,
): Promise<void> {
  log.debug('[DEV] Загрузка INIT модулей с полной валидацией', {
    prefix: LOG_PREFIX,
  });

  const { registry, statusTracker, lifecycleManager, bootstrap } = context;

  // Сортируем по приоритету
  const sortedModules = registry.sortModulesByPriority(modules);

  // Последовательная загрузка
  for (const module of sortedModules) {
    if (statusTracker.isLoaded(module.name)) {
      continue;
    }

    statusTracker.markAsLoading(module);

    try {
      await lifecycleManager.initializeModule(module, bootstrap, false);
      await lifecycleManager.registerModuleResources(
        module,
        bootstrap,
        (name: string) => statusTracker.isLoaded(name),
      );
      statusTracker.markAsLoaded(module);
    } catch (error) {
      statusTracker.markAsFailed(module, error);
      throw error;
    }
  }

  registry.setInitModulesLoaded(true);
  log.debug('[DEV] INIT модули загружены', { prefix: LOG_PREFIX });
}

/**
 * Загружает NORMAL модули в Dev-режиме.
 * Строит граф зависимостей, проверяет циклы, валидирует условия.
 */
export async function loadNormalModulesDev(
  modules: Module[],
  context: DevLoaderContext,
): Promise<void> {
  log.debug('[DEV] Загрузка NORMAL модулей с полной валидацией', {
    prefix: LOG_PREFIX,
  });

  const { registry, statusTracker, bootstrap } = context;

  // Инициализируем dev-сервисы
  const conditionValidator = new ConditionValidator();
  const dependencyResolver = new DependencyResolver(registry);

  // Проверяем циклические зависимости
  const modulesWithCircularDeps: string[] = [];
  for (const module of modules) {
    const hasDeps =
      module.loadCondition?.dependencies &&
      module.loadCondition.dependencies.length > 0;
    if (hasDeps && dependencyResolver.hasCircularDependencies(module)) {
      modulesWithCircularDeps.push(module.name);
    }
  }

  if (modulesWithCircularDeps.length > 0) {
    throw new Error(
      `[DEV] Циклические зависимости: ${modulesWithCircularDeps.join(', ')}`,
    );
  }

  // Строим уровни зависимостей
  const levelBuilder = new DependencyLevelBuilder(
    registry,
    (name: string) => statusTracker.isLoaded(name),
    (name: string) => statusTracker.isPreloaded(name),
  );

  const { levels, skippedModules } =
    levelBuilder.buildDependencyLevels(modules);

  if (skippedModules.length > 0) {
    log.warn(`[DEV] Пропущено модулей: ${skippedModules.length}`, {
      prefix: LOG_PREFIX,
    });
  }

  // Загружаем уровни
  for (let i = 0; i < levels.length; i++) {
    const levelModules = levels[i];
    log.debug(`[DEV] Уровень ${i + 1}/${levels.length}`, {
      prefix: LOG_PREFIX,
    });

    await Promise.all(
      levelModules.map(async (module: Module) => {
        if (statusTracker.isLoadedOrLoading(module.name)) {
          return;
        }

        // Если модуль предзагружен, проверяем условия перед пометкой как загруженный
        if (statusTracker.isPreloaded(module.name)) {
          // Проверяем условия загрузки для предзагруженного модуля
          const canLoad = await conditionValidator.validateLoadConditions(
            module,
            bootstrap,
            (name: string) => statusTracker.isLoaded(name),
          );

          if (!canLoad) {
            log.debug(
              `[DEV] Предзагруженный модуль "${module.name}" не может быть загружен: условия не выполнены`,
              { prefix: LOG_PREFIX },
            );
            statusTracker.markAsFailed(
              module,
              new Error(`Условия не выполнены: ${module.name}`),
            );
            return;
          }

          // Условия выполнены, помечаем как загруженный
          statusTracker.markAsLoaded(module);
          return;
        }

        // Проверяем условия загрузки
        const canLoad = await conditionValidator.validateLoadConditions(
          module,
          bootstrap,
          (name: string) => statusTracker.isLoaded(name),
        );

        if (!canLoad) {
          statusTracker.markAsFailed(
            module,
            new Error(`Условия не выполнены: ${module.name}`),
          );
          return;
        }

        // Загружаем зависимости
        await dependencyResolver.loadDependencies(
          module,
          bootstrap,
          async (m: Module, b: Bootstrap) => {
            await loadSingleModuleDev(m, b, context);
          },
          (name: string) => statusTracker.isLoaded(name),
        );

        // Загружаем сам модуль
        await loadSingleModuleDev(module, bootstrap, context);
      }),
    );
  }

  log.debug('[DEV] NORMAL модули загружены', { prefix: LOG_PREFIX });
}

/**
 * Загружает один модуль в Dev-режиме.
 */
async function loadSingleModuleDev(
  module: Module,
  bootstrap: Bootstrap,
  context: DevLoaderContext,
): Promise<void> {
  const { statusTracker, lifecycleManager, autoLoadHandler } = context;

  if (statusTracker.isLoadedOrLoading(module.name)) {
    return;
  }

  statusTracker.markAsLoading(module);

  try {
    await lifecycleManager.initializeModule(module, bootstrap, false);
    await lifecycleManager.registerModuleResources(
      module,
      bootstrap,
      (name: string) => statusTracker.isLoaded(name),
      autoLoadHandler,
    );
    statusTracker.markAsLoaded(module);
  } catch (error) {
    statusTracker.markAsFailed(module, error);
    throw error;
  }
}
