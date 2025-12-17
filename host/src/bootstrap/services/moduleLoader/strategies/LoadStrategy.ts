/**
 * Интерфейс стратегии загрузки модулей.
 * 
 * Реализует паттерн Strategy для различных типов загрузки модулей.
 * 
 * @module strategies/LoadStrategy
 */

import type { Module } from '../../../../modules/interface';
import type { Bootstrap } from '../../../index';

/**
 * Интерфейс стратегии загрузки модулей.
 * 
 * Каждая стратегия определяет свой способ загрузки модулей
 * в зависимости от их типа (INIT, NORMAL).
 */
export interface ILoadStrategy {
  /**
   * Возвращает имя стратегии для логирования.
   */
  readonly name: string;

  /**
   * Загружает модули согласно стратегии.
   * 
   * @param modules - Массив модулей для загрузки
   * @param bootstrap - Инстанс Bootstrap
   */
  loadModules(modules: Module[], bootstrap: Bootstrap): Promise<void>;

  /**
   * Проверяет, подходит ли модуль для данной стратегии.
   * 
   * @param module - Модуль для проверки
   * @returns true, если модуль подходит
   */
  isApplicable(module: Module): boolean;
}

/**
 * Контекст загрузки, передаваемый в стратегию.
 */
export interface LoadContext {
  /** Инстанс Bootstrap */
  bootstrap: Bootstrap;
  /** Callback для загрузки одного модуля */
  loadModule: (module: Module) => Promise<void>;
  /** Callback для предзагрузки модуля */
  preloadModule: (module: Module) => Promise<void>;
  /** Проверка, загружен ли модуль */
  isModuleLoaded: (moduleName: string) => boolean;
  /** Проверка, предзагружен ли модуль */
  isModulePreloaded: (moduleName: string) => boolean;
}

