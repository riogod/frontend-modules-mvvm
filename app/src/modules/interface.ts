import { ModuleConfig } from "../bootstrap/interface";
export interface Module {
  name: string;
  description?: string;
  config: ModuleConfig;

  /**
   * Приоритет загрузки модуля
   */
  loadPriority?: number;
  /**
   * Тип загрузки модуля (по умолчанию: normal)
   */
  loadType?: ModuleLoadType;
  /**
   * Условия загрузки модуля
   */
  loadCondition?: ModuleLoadCondition;
}

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