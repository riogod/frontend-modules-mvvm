/**
 * Резолвер зависимостей модулей.
 * 
 * Отвечает за:
 * - Получение и валидацию зависимостей модуля
 * - Рекурсивную загрузку зависимостей
 * - Обнаружение циклических зависимостей
 * 
 * @module services/DependencyResolver
 */

import { log } from '@platform/core';
import type { Module } from '../../../../modules/interface';
import type { Bootstrap } from '../../../index';
import type { ModuleRegistry } from '../core/ModuleRegistry';
import type { LoadModuleFunction, IsModuleLoadedFunction } from '../types';
import { getModuleDependencies } from '../utils/moduleUtils';

/** Префикс для логирования */
const LOG_PREFIX = 'moduleLoader.dependencyResolver';

/**
 * Ошибка разрешения зависимостей.
 */
export class DependencyResolutionError extends Error {
  constructor(
    message: string,
    public readonly moduleName: string,
    public readonly dependencies?: string[],
  ) {
    super(message);
    this.name = 'DependencyResolutionError';
  }
}

/**
 * Резолвер зависимостей модулей.
 * 
 * Обеспечивает корректную загрузку зависимостей модулей
 * с учетом порядка и обнаружением циклических зависимостей.
 */
export class DependencyResolver {
  constructor(private readonly registry: ModuleRegistry) {
    log.debug('DependencyResolver: инициализация', { prefix: LOG_PREFIX });
  }

  // ============================================
  // Публичные методы
  // ============================================

  /**
   * Загружает все зависимости модуля рекурсивно.
   * 
   * @param module - Модуль, зависимости которого нужно загрузить
   * @param bootstrap - Инстанс Bootstrap
   * @param loadModule - Функция загрузки модуля
   * @param isModuleLoaded - Функция проверки загрузки модуля
   * @throws {DependencyResolutionError} При циклических или отсутствующих зависимостях
   */
  public async loadDependencies(
    module: Module,
    bootstrap: Bootstrap,
    loadModule: LoadModuleFunction,
    isModuleLoaded: IsModuleLoadedFunction,
  ): Promise<void> {
    // Быстрая проверка: если зависимостей нет, сразу выходим
    if (!getModuleDependencies(module).length) {
      return;
    }

    await this.loadDependenciesRecursive(
      module,
      bootstrap,
      new Set(),
      loadModule,
      isModuleLoaded,
    );
  }

  /**
   * Возвращает модули зависимостей по их именам.
   * 
   * @param moduleName - Имя модуля, для которого получаем зависимости
   * @param dependencyNames - Массив имен зависимостей
   * @returns Массив модулей зависимостей
   * @throws {DependencyResolutionError} Если какие-то зависимости не найдены
   */
  public getDependencyModules(
    moduleName: string,
    dependencyNames: string[],
  ): Module[] {
    log.debug(
      `Получение модулей зависимостей для "${moduleName}": ${dependencyNames.join(', ')}`,
      { prefix: LOG_PREFIX },
    );

    const dependencyModules: Module[] = [];
    const missingDependencies: string[] = [];

    for (const depName of dependencyNames) {
      const depModule = this.registry.getModule(depName);
      if (depModule) {
        dependencyModules.push(depModule);
      } else {
        missingDependencies.push(depName);
      }
    }

    if (missingDependencies.length > 0) {
      const message = `Отсутствуют зависимости для модуля "${moduleName}": ${missingDependencies.join(', ')}`;
      log.error(message, { prefix: LOG_PREFIX });
      throw new DependencyResolutionError(message, moduleName, missingDependencies);
    }

    log.debug(
      `Найдено ${dependencyModules.length} зависимостей для "${moduleName}"`,
      { prefix: LOG_PREFIX },
    );

    return dependencyModules;
  }

  /**
   * Проверяет наличие циклических зависимостей.
   * 
   * @param module - Начальный модуль
   * @returns true, если есть циклические зависимости
   */
  public hasCircularDependencies(module: Module): boolean {
    try {
      this.checkForCircularDependencies(module, new Set());
      return false;
    } catch {
      return true;
    }
  }

  /**
   * Возвращает полный список зависимостей модуля (включая транзитивные).
   * 
   * @param module - Модуль для анализа
   * @returns Массив всех зависимостей
   */
  public getAllDependencies(module: Module): string[] {
    const allDeps = new Set<string>();
    this.collectAllDependencies(module, allDeps, new Set());
    return Array.from(allDeps);
  }

  // ============================================
  // Приватные методы
  // ============================================

  /**
   * Рекурсивно загружает зависимости модуля.
   * 
   * @param module - Модуль для загрузки зависимостей
   * @param bootstrap - Инстанс Bootstrap
   * @param visited - Множество посещенных модулей (для обнаружения циклов)
   * @param loadModule - Функция загрузки модуля
   * @param isModuleLoaded - Функция проверки загрузки
   */
  private async loadDependenciesRecursive(
    module: Module,
    bootstrap: Bootstrap,
    visited: Set<string>,
    loadModule: LoadModuleFunction,
    isModuleLoaded: IsModuleLoadedFunction,
  ): Promise<void> {
    // Проверяем наличие зависимостей
    const dependencies = getModuleDependencies(module);
    if (dependencies.length === 0) {
      return;
    }

    // Проверка на циклические зависимости
    if (visited.has(module.name)) {
      const path = Array.from(visited).join(' -> ');
      const message = `Обнаружена циклическая зависимость: ${path} -> ${module.name}`;
      log.error(message, { prefix: LOG_PREFIX });
      throw new DependencyResolutionError(message, module.name);
    }

    visited.add(module.name);

    log.debug(`Загрузка зависимостей для "${module.name}"`, {
      prefix: LOG_PREFIX,
    });

    const dependencyModules = this.getDependencyModules(module.name, dependencies);

    // Сортируем по приоритету
    const sortedDependencies = this.registry.sortModulesByPriority(dependencyModules);

    // Загружаем зависимости последовательно
    for (const depModule of sortedDependencies) {
      if (!isModuleLoaded(depModule.name)) {
        log.debug(
          `Загрузка зависимости "${depModule.name}" для модуля "${module.name}"`,
          { prefix: LOG_PREFIX },
        );

        // Рекурсивно загружаем зависимости зависимости
        await this.loadDependenciesRecursive(
          depModule,
          bootstrap,
          visited,
          loadModule,
          isModuleLoaded,
        );

        // Загружаем саму зависимость
        await loadModule(depModule, bootstrap);

        log.debug(`Зависимость "${depModule.name}" загружена`, {
          prefix: LOG_PREFIX,
        });
      } else {
        log.debug(`Зависимость "${depModule.name}" уже загружена, пропускаем`, {
          prefix: LOG_PREFIX,
        });
      }
    }

    visited.delete(module.name);

    log.debug(`Все зависимости для "${module.name}" загружены`, {
      prefix: LOG_PREFIX,
    });
  }

  /**
   * Проверяет наличие циклических зависимостей (рекурсивно).
   * 
   * @param module - Модуль для проверки
   * @param visited - Множество посещенных модулей
   * @throws {DependencyResolutionError} При обнаружении цикла
   */
  private checkForCircularDependencies(
    module: Module,
    visited: Set<string>,
  ): void {
    if (visited.has(module.name)) {
      const path = Array.from(visited).join(' -> ');
      throw new DependencyResolutionError(
        `Циклическая зависимость: ${path} -> ${module.name}`,
        module.name,
      );
    }

    if (!module.loadCondition?.dependencies?.length) {
      return;
    }

    visited.add(module.name);

    for (const depName of module.loadCondition.dependencies) {
      const depModule = this.registry.getModule(depName);
      if (depModule) {
        this.checkForCircularDependencies(depModule, visited);
      }
    }

    visited.delete(module.name);
  }

  /**
   * Собирает все зависимости модуля (включая транзитивные).
   * 
   * @param module - Модуль для анализа
   * @param allDeps - Множество для сбора зависимостей
   * @param visited - Множество посещенных модулей
   */
  private collectAllDependencies(
    module: Module,
    allDeps: Set<string>,
    visited: Set<string>,
  ): void {
    if (visited.has(module.name)) {
      return;
    }

    visited.add(module.name);

    const dependencies = getModuleDependencies(module);
    if (dependencies.length === 0) {
      return;
    }

    for (const depName of dependencies) {
      allDeps.add(depName);

      const depModule = this.registry.getModule(depName);
      if (depModule) {
        this.collectAllDependencies(depModule, allDeps, visited);
      }
    }
  }
}

