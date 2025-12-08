/**
 * Типы, связанные с модулями и их конфигурацией.
 * @module types/module
 */

import type { Module } from '../../../../modules/interface';
import type { IRoute, IRoutes } from '@platform/core';

/**
 * Расширенный интерфейс информации о загруженном модуле.
 */
export interface LoadedModuleInfo {
  /** Модуль */
  module: Module;
  /** Время начала загрузки */
  loadStartTime?: number;
  /** Время окончания загрузки */
  loadEndTime?: number;
}

/**
 * Параметры состояния маршрута (toState).
 */
export type RouteState = Parameters<NonNullable<IRoute['onEnterNode']>>[0];

/**
 * Параметры предыдущего состояния маршрута (fromState).
 */
export type RouteFromState = Parameters<NonNullable<IRoute['onEnterNode']>>[1];

/**
 * Зависимости маршрута.
 */
export type RouteDependencies = Parameters<
  NonNullable<IRoute['onEnterNode']>
>[2];

/**
 * Результат группировки модулей по уровням зависимостей.
 */
export interface DependencyLevelResult {
  /** Уровни зависимостей (модули на каждом уровне могут загружаться параллельно) */
  levels: Module[][];
  /** Модули, пропущенные из-за отсутствующих зависимостей */
  skippedModules: SkippedModuleInfo[];
}

/**
 * Информация о пропущенном модуле.
 */
export interface SkippedModuleInfo {
  /** Имя модуля */
  moduleName: string;
  /** Отсутствующие зависимости */
  missingDependencies: string[];
}

/**
 * Конфигурация для кеширования маршрутов.
 */
export interface RouteCacheEntry {
  /** Маршруты модуля */
  routes: IRoutes;
  /** Время кеширования */
  cachedAt: number;
}

/**
 * Переэкспорт типа Module для удобства.
 */
export type { Module };

