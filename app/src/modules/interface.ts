import { ModuleConfig } from "../bootstrap/interface";

/**
 * Базовый интерфейс модуля
 */
interface BaseModule {
  name: string;
  description?: string;

  /**
   * Приоритет загрузки модуля
   */
  loadPriority?: number;
}

/**
 * Модуль типа INIT - загружается при инициализации приложения
 * loadCondition запрещен для INIT модулей
 */
export interface InitModule extends BaseModule {
  loadType: ModuleLoadType.INIT;
  loadCondition?: never; // Запрещено для INIT модулей
  config: ModuleConfig;
}

/**
 * Модуль типа LAZY - загружается при первом обращении к нему
 */
export interface LazyModule extends BaseModule {
  loadType: ModuleLoadType.LAZY;
  /**
   * Условия загрузки модуля
   */
  loadCondition?: ModuleLoadCondition;
  config: Promise<ModuleConfig>;
}

/**
 * Модуль типа NORMAL - загружается в фоновом режиме после инициализации приложения
 */
export interface NormalModule extends BaseModule {
  loadType?: ModuleLoadType.NORMAL;
  /**
   * Условия загрузки модуля
   */
  loadCondition?: ModuleLoadCondition;
  config: ModuleConfig;
}

/**
 * Объединенный тип модуля
 * Использует discriminated union для обеспечения типобезопасности:
 * - INIT модули не могут иметь loadCondition
 * - LAZY и NORMAL модули могут иметь loadCondition
 */
export type Module = InitModule | LazyModule | NormalModule;

/**
 * Тип загрузки модуля (по умолчанию: NORMAL)
 */
export enum ModuleLoadType {
  /**
   * Модуль загружается при инициализации приложения
   */
  INIT = 'init',
  /**
   * Модуль загружается при первом обращении к нему
   */
  LAZY = 'lazy',
  /**
   * Модуль загружается в фоновом режиме после инициализации приложения
   */
  NORMAL = 'normal',
}

/**
 * Условия загрузки модуля
 */
export type ModuleLoadCondition = {
  /**
   * Массив идентификаторов фич-флагов, при их отсутствии в AccessControlModel модуль не загружается
   */
  featureFlags?: string[];
  /**
   * Массив идентификаторов прав доступа, при их отсутствии в AccessControlModel модуль не загружается
   */
  accessPermissions?: string[];
  /**
   * Массив идентификаторов модулей, от которых зависит текущий модуль. При lazy загрузке модуля,
   * загрузка зависимых модулей будет происходить перед загрузкой текущего модуля в соответствии 
   * с их приоритетами загрузки.
   * При их отсутствии модуль не загружается.
   */
  dependencies?: string[];
}