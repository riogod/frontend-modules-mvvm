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
 * Тип загрузки модуля
 * 
 * - init: Модуль загружается при инициализации приложения
 * - lazy: Модуль загружается при первом обращении к нему
 * - normal: Модуль загружается в фоновом режиме после инициализации приложения
 */
export type ModuleLoadType = 'init' | 'lazy' | 'normal';

/**
 * Условия загрузки модуля
 * 
 * - featureFlags: Массив идентификаторов фич-флагов, при их отсутствии модуль не загружается
 * - accessPermissions: Массив идентификаторов прав доступа, при их отсутствии модуль не загружается
 * - dependencies: Массив идентификаторов модулей, от которых зависит текущий модуль. При lazy загрузке модуля,
 *   загрузка зависимых модулей будет происходить параллельно с загрузкой текущего модуля.
 *   При их отсутствии модуль не загружается.
 */
export type ModuleLoadCondition = {
  featureFlags?: string[];
  accessPermissions?: string[];
  dependencies?: string[];
}