/**
 * PROD-ONLY: Простой исполнитель для загрузки модулей.
 * Выполняет базовую проверку статусов зависимостей (защита от ошибок).
 *
 * @module prod/ProdModuleExecutor
 */

import { log } from '@platform/core';
import type { Module } from '../../../../modules/interface';
import type { Bootstrap } from '../../../index';
import type { ModuleRegistry } from '../core/ModuleRegistry';
import type { ModuleStatusTracker } from '../core/ModuleStatusTracker';
import type { LifecycleManager } from '../services/LifecycleManager';
import { ModuleLoadStatus } from '../types';

const LOG_PREFIX = 'moduleLoader.prod';

export interface ProdExecutorContext {
  registry: ModuleRegistry;
  statusTracker: ModuleStatusTracker;
  lifecycleManager: LifecycleManager;
  bootstrap: Bootstrap;
  autoLoadHandler?: (routeName: string) => Promise<void>;
}

// ============================================
// БАЗОВАЯ ЗАЩИТА: Проверка статусов зависимостей
// ============================================

/**
 * Результат проверки зависимостей.
 */
interface DependencyCheckResult {
  canLoad: boolean;
  failedDeps: string[];
  notLoadedDeps: string[];
}

/**
 * Проверяет, можно ли загружать модуль.
 * Это ЛЕГКОВЕСНАЯ проверка — только статусы, без построения графа.
 *
 * @param module - Модуль для проверки
 * @param statusTracker - Трекер статусов
 * @returns Результат проверки
 */
function checkDependencyStatuses(
  module: Module,
  statusTracker: ModuleStatusTracker,
): DependencyCheckResult {
  const deps = module.loadCondition?.dependencies ?? [];

  if (deps.length === 0) {
    return { canLoad: true, failedDeps: [], notLoadedDeps: [] };
  }

  const failedDeps = deps.filter(
    (name) => statusTracker.getStatus(name) === ModuleLoadStatus.FAILED,
  );

  const notLoadedDeps = deps.filter(
    (name) => !statusTracker.isLoaded(name) && !failedDeps.includes(name),
  );

  // Если есть зависимости в FAILED статусе — не загружаем
  if (failedDeps.length > 0) {
    return { canLoad: false, failedDeps, notLoadedDeps };
  }

  // Если есть незагруженные зависимости — предупреждаем, но пробуем загрузить
  // (сервер должен был отсортировать правильно, но на всякий случай)
  return { canLoad: true, failedDeps: [], notLoadedDeps };
}

// ============================================
// Загрузка модулей
// ============================================

/**
 * Загружает INIT модули в Prod-режиме.
 * Простая последовательная загрузка с базовой защитой.
 */
export async function loadInitModulesProd(
  modules: Module[],
  context: ProdExecutorContext,
): Promise<void> {
  log.debug('[PROD] Загрузка INIT модулей', { prefix: LOG_PREFIX });

  const { registry, statusTracker, lifecycleManager, bootstrap } = context;

  for (const module of modules) {
    if (statusTracker.isLoaded(module.name)) {
      continue;
    }

    // Базовая защита: проверяем статусы зависимостей
    const { canLoad, failedDeps } = checkDependencyStatuses(
      module,
      statusTracker,
    );
    if (!canLoad) {
      log.error(
        `[PROD] Модуль "${module.name}" пропущен: зависимости в FAILED статусе: ${failedDeps.join(', ')}`,
        {
          prefix: LOG_PREFIX,
        },
      );
      statusTracker.markAsFailed(
        module,
        new Error(`Зависимости не загружены: ${failedDeps.join(', ')}`),
      );
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
      log.error(`[PROD] Ошибка загрузки модуля ${module.name}`, {
        prefix: LOG_PREFIX,
        error: error instanceof Error ? error.message : String(error),
      });
      // В prod не бросаем ошибку, продолжаем загрузку остальных
    }
  }

  registry.setInitModulesLoaded(true);
}

/**
 * Загружает NORMAL модули в Prod-режиме.
 * Сервер уже разбил их на уровни — просто выполняем с базовой защитой.
 */
export async function loadNormalModulesProd(
  levels: Module[][],
  context: ProdExecutorContext,
): Promise<void> {
  log.debug(`[PROD] Загрузка NORMAL модулей: ${levels.length} уровней`, {
    prefix: LOG_PREFIX,
  });

  const { statusTracker, lifecycleManager, bootstrap, autoLoadHandler } =
    context;

  for (let i = 0; i < levels.length; i++) {
    const levelModules = levels[i];

    await Promise.all(
      levelModules.map(async (module: Module) => {
        if (statusTracker.isLoadedOrLoading(module.name)) {
          return;
        }

        if (statusTracker.isPreloaded(module.name)) {
          statusTracker.markAsLoaded(module);
          return;
        }

        // Базовая защита: проверяем статусы зависимостей
        const { canLoad, failedDeps, notLoadedDeps } = checkDependencyStatuses(
          module,
          statusTracker,
        );

        if (!canLoad) {
          log.error(
            `[PROD] Модуль "${module.name}" пропущен: зависимости в FAILED статусе: ${failedDeps.join(', ')}`,
            {
              prefix: LOG_PREFIX,
            },
          );
          statusTracker.markAsFailed(
            module,
            new Error(`Зависимости не загружены: ${failedDeps.join(', ')}`),
          );
          return;
        }

        if (notLoadedDeps.length > 0) {
          log.warn(
            `[PROD] Модуль "${module.name}": не все зависимости загружены: ${notLoadedDeps.join(', ')}. Пробуем загрузить.`,
            {
              prefix: LOG_PREFIX,
            },
          );
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
          log.error(`[PROD] Ошибка загрузки модуля ${module.name}`, {
            prefix: LOG_PREFIX,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }),
    );
  }
}


