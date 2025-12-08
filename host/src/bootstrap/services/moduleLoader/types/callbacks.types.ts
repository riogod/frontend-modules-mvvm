/**
 * Типы callback-функций, используемых в загрузчике модулей.
 * @module types/callbacks
 */

import type { Module } from '../../../../modules/interface';
import type { Bootstrap } from '../../../index';

/**
 * Функция загрузки модуля.
 * @param module - Модуль для загрузки
 * @param bootstrap - Инстанс Bootstrap
 * @returns Promise, завершающийся после загрузки модуля
 */
export type LoadModuleFunction = (
  module: Module,
  bootstrap: Bootstrap,
) => Promise<void>;

/**
 * Функция проверки, загружен ли модуль.
 * @param moduleName - Имя модуля
 * @returns true, если модуль загружен
 */
export type IsModuleLoadedFunction = (moduleName: string) => boolean;

/**
 * Функция проверки, предзагружен ли модуль.
 * @param moduleName - Имя модуля
 * @returns true, если модуль предзагружен
 */
export type IsModulePreloadedFunction = (moduleName: string) => boolean;

/**
 * Функция автоматической загрузки модуля по имени маршрута.
 * @param routeName - Имя маршрута
 * @returns Promise, завершающийся после загрузки модуля
 */
export type AutoLoadByRouteFunction = (routeName: string) => Promise<void>;

/**
 * Функция фильтрации модулей.
 * @param module - Модуль для проверки
 * @returns true, если модуль проходит фильтр
 */
export type ModuleFilterFunction = (module: Module) => boolean;

/**
 * Опции инициализации загрузчика модулей.
 */
export interface ModuleLoaderInitOptions {
  /** Включить детальное логирование */
  enableDebugLogging?: boolean;
  /** Таймаут загрузки модуля по умолчанию (мс) */
  defaultLoadTimeout?: number;
}

