import { type ModuleConfig } from "../bootstrap/interface";

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
 * Модуль типа NORMAL - загружается в фоновом режиме после инициализации приложения
 * Поддерживает как статический, так и динамический импорт конфигурации:
 * - Статический: config: ModuleConfig (конфиг загружается вместе с основным бандлом)
 * - Динамический: config: Promise<ModuleConfig> (конфиг выносится в отдельный чанк)
 */
export interface NormalModule extends BaseModule {
  loadType?: ModuleLoadType.NORMAL;
  /**
   * Условия загрузки модуля
   */
  loadCondition?: ModuleLoadCondition;
  /**
   * Конфигурация модуля. Может быть синхронной (ModuleConfig) или асинхронной (Promise<ModuleConfig>).
   * При использовании Promise конфигурация будет загружена динамически при первом обращении.
   * Пример динамической загрузки: config: import('./module_config').then(m => m.default)
   */
  config: ModuleConfig | Promise<ModuleConfig>;
}

/**
 * Объединенный тип модуля
 * Использует discriminated union для обеспечения типобезопасности:
 * - INIT модули не могут иметь loadCondition и всегда имеют синхронный config
 * - NORMAL модули могут иметь loadCondition и поддерживают как синхронный, так и асинхронный config
 */
export type Module = InitModule | NormalModule;

/**
 * Тип загрузки модуля
 */
export enum ModuleLoadType {
  /**
   * Модуль загружается при инициализации приложения
   */
  INIT = 'init',
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
   * Массив идентификаторов модулей, от которых зависит текущий модуль.
   * Загрузка зависимых модулей будет происходить перед загрузкой текущего модуля в соответствии 
   * с их приоритетами загрузки.
   * При их отсутствии модуль не загружается.
   */
  dependencies?: string[];
}