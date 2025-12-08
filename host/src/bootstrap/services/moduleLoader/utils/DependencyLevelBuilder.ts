/**
 * Построитель уровней зависимостей.
 *
 * Отвечает за:
 * - Группировку модулей по уровням зависимостей
 * - Обеспечение параллельной загрузки независимых модулей
 * - Обнаружение и обработку проблем с зависимостями
 *
 * Реализует паттерн Builder для построения структуры зависимостей.
 *
 * @module utils/DependencyLevelBuilder
 */

import { log } from '@platform/core';
import type { Module } from '../../../../modules/interface';
import type { ModuleRegistry } from '../core/ModuleRegistry';
import type { DependencyLevelResult, SkippedModuleInfo } from '../types';
import type {
  IsModuleLoadedFunction,
  IsModulePreloadedFunction,
} from '../types';
import { getModuleDependencies } from './moduleUtils';

/** Префикс для логирования */
const LOG_PREFIX = 'moduleLoader.dependencyLevelBuilder';

/**
 * Построитель уровней зависимостей для параллельной загрузки модулей.
 *
 * Группирует модули таким образом, что:
 * - Модули на одном уровне не зависят друг от друга
 * - Модули на уровне N зависят только от модулей на уровнях < N
 * - Модули на одном уровне можно загружать параллельно
 */
export class DependencyLevelBuilder {
  constructor(
    private readonly registry: ModuleRegistry,
    private readonly isModuleLoaded: IsModuleLoadedFunction,
    private readonly isModulePreloaded?: IsModulePreloadedFunction,
  ) {
    log.debug('DependencyLevelBuilder: инициализация', { prefix: LOG_PREFIX });
  }

  // ============================================
  // Публичные методы
  // ============================================

  /**
   * Группирует модули по уровням зависимостей.
   *
   * Алгоритм:
   * 1. Создаем карту модулей для быстрого доступа
   * 2. На каждой итерации находим модули, все зависимости которых готовы
   * 3. Добавляем их в текущий уровень и помечаем как обработанные
   * 4. Повторяем до обработки всех модулей или обнаружения проблем
   *
   * @param modules - Массив модулей для группировки
   * @returns Результат группировки с уровнями и пропущенными модулями
   */
  public buildDependencyLevels(modules: Module[]): DependencyLevelResult {
    log.debug(`Группировка ${modules.length} модулей по уровням зависимостей`, {
      prefix: LOG_PREFIX,
    });

    const levels: Module[][] = [];
    const processed = new Set<string>();
    const moduleMap = this.buildModuleMap(modules);
    const skippedModules: SkippedModuleInfo[] = [];

    while (processed.size < modules.length) {
      const currentLevel = this.findReadyModules(modules, moduleMap, processed);

      if (currentLevel.length === 0) {
        // Не удалось найти модули для текущего уровня
        const result = this.handleUnprocessedModules(
          modules,
          processed,
          skippedModules,
        );

        if (result.shouldBreak) {
          break;
        }

        // Если есть циклическая зависимость, выбрасываем ошибку
        if (result.hasCircularDependency) {
          const unprocessed = this.getUnprocessedModuleNames(
            modules,
            processed,
          );
          throw new Error(
            `Обнаружена циклическая зависимость. Необработанные модули: ${unprocessed.join(', ')}`,
          );
        }
      }

      // Добавляем модули текущего уровня в обработанные
      for (const module of currentLevel) {
        processed.add(module.name);
      }

      if (currentLevel.length > 0) {
        levels.push(currentLevel);
        log.debug(
          `Уровень ${levels.length}: ${currentLevel.map((m) => m.name).join(', ')}`,
          { prefix: LOG_PREFIX },
        );
      }
    }

    log.debug(
      `Группировка завершена: ${levels.length} уровней, ${skippedModules.length} пропущено`,
      { prefix: LOG_PREFIX },
    );

    return { levels, skippedModules };
  }

  /**
   * Проверяет, готовы ли все зависимости модуля.
   *
   * Зависимость считается готовой, если:
   * - Модуль уже загружен
   * - Модуль предзагружен
   * - Модуль обработан в текущем цикле
   * - Модуль существует, но не входит в список для обработки
   *
   * @param module - Модуль для проверки
   * @param moduleMap - Карта модулей для обработки
   * @param processed - Множество обработанных модулей
   * @returns true, если все зависимости готовы
   */
  public areDependenciesReady(
    module: Module,
    moduleMap: Map<string, Module>,
    processed: Set<string>,
  ): boolean {
    const dependencies = getModuleDependencies(module);

    if (dependencies.length === 0) {
      return true;
    }

    return dependencies.every((depName) => {
      // Зависимость уже обработана в текущем цикле
      if (processed.has(depName)) {
        return true;
      }

      // Зависимость уже загружена
      if (this.isModuleLoaded(depName)) {
        return true;
      }

      // Зависимость предзагружена
      if (this.isModulePreloaded?.(depName)) {
        return true;
      }

      // Зависимость существует, но не в списке для обработки
      // (уже была обработана ранее или обрабатывается отдельно)
      const depModule = this.registry.getModule(depName);
      if (depModule && !moduleMap.has(depName)) {
        return true;
      }

      return false;
    });
  }

  // ============================================
  // Приватные методы
  // ============================================

  /**
   * Создает карту модулей для быстрого доступа.
   *
   * @param modules - Массив модулей
   * @returns Map с модулями по именам
   */
  private buildModuleMap(modules: Module[]): Map<string, Module> {
    const moduleMap = new Map<string, Module>();
    for (const module of modules) {
      moduleMap.set(module.name, module);
    }
    return moduleMap;
  }

  /**
   * Находит модули, готовые к обработке на текущем уровне.
   *
   * @param modules - Все модули
   * @param moduleMap - Карта модулей
   * @param processed - Множество обработанных модулей
   * @returns Массив модулей для текущего уровня
   */
  private findReadyModules(
    modules: Module[],
    moduleMap: Map<string, Module>,
    processed: Set<string>,
  ): Module[] {
    const currentLevel: Module[] = [];

    for (const module of modules) {
      if (processed.has(module.name)) {
        continue;
      }

      if (this.areDependenciesReady(module, moduleMap, processed)) {
        currentLevel.push(module);
      }
    }

    return currentLevel;
  }

  /**
   * Обрабатывает ситуацию, когда не удалось найти модули для уровня.
   *
   * @param modules - Все модули
   * @param processed - Множество обработанных модулей
   * @param skippedModules - Массив для сбора пропущенных модулей
   * @returns Результат обработки
   */
  private handleUnprocessedModules(
    modules: Module[],
    processed: Set<string>,
    skippedModules: SkippedModuleInfo[],
  ): { shouldBreak: boolean; hasCircularDependency: boolean } {
    const unprocessedModules = modules.filter((m) => !processed.has(m.name));
    const modulesWithMissingDeps: SkippedModuleInfo[] = [];

    for (const module of unprocessedModules) {
      const dependencies = getModuleDependencies(module);
      const missingDeps = dependencies.filter((depName) => {
        const depModule = this.registry.getModule(depName);
        return !depModule && !this.isModuleLoaded(depName);
      });

      if (missingDeps.length > 0) {
        modulesWithMissingDeps.push({
          moduleName: module.name,
          missingDependencies: missingDeps,
        });
      }
    }

    if (modulesWithMissingDeps.length > 0) {
      // Есть модули с отсутствующими зависимостями - пропускаем их
      log.warn(
        `Пропуск модулей с отсутствующими зависимостями: ${modulesWithMissingDeps
          .map((m) => m.moduleName)
          .join(', ')}`,
        { prefix: LOG_PREFIX },
      );

      for (const info of modulesWithMissingDeps) {
        skippedModules.push(info);
        processed.add(info.moduleName);
      }

      return { shouldBreak: false, hasCircularDependency: false };
    }

    // Нет отсутствующих зависимостей - значит циклическая зависимость
    return { shouldBreak: true, hasCircularDependency: true };
  }

  /**
   * Возвращает имена необработанных модулей.
   *
   * @param modules - Все модули
   * @param processed - Множество обработанных модулей
   * @returns Массив имен необработанных модулей
   */
  private getUnprocessedModuleNames(
    modules: Module[],
    processed: Set<string>,
  ): string[] {
    return modules.filter((m) => !processed.has(m.name)).map((m) => m.name);
  }
}
