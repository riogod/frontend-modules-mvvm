import { type ModuleConfig } from '../bootstrap/interface';
import { ModuleLoadType, type ModuleLoadCondition } from '@platform/core';

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
 * Может быть как локальным, так и удаленным (remote)
 * Для remote модулей config будет Promise<ModuleConfig>
 */
export interface InitModule extends BaseModule {
  loadType: ModuleLoadType.INIT;
  loadCondition?: never; // Запрещено для INIT модулей
  /**
   * Конфигурация модуля. Для локальных модулей - синхронная (ModuleConfig),
   * для remote модулей - асинхронная (Promise<ModuleConfig>)
   */
  config: ModuleConfig | Promise<ModuleConfig>;
  /**
   * Информация о remote модуле (только для REMOTE источника)
   */
  remote?: RemoteModuleInfo;
}

/**
 * Расширенный интерфейс для Remote модулей
 */
export interface RemoteModuleInfo {
  /**
   * URL к remoteEntry.js
   */
  entry: string;

  /**
   * Имя scope в Module Federation
   */
  scope: string;
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

  /**
   * Информация о remote модуле (только для REMOTE источника)
   */
  remote?: RemoteModuleInfo;
}

/**
 * Объединенный тип модуля
 * Использует discriminated union для обеспечения типобезопасности:
 * - INIT модули не могут иметь loadCondition, но могут быть как локальными, так и remote
 * - NORMAL модули могут иметь loadCondition и поддерживают как синхронный, так и асинхронный config
 */
export type Module = InitModule | NormalModule;

// Реэкспорт типов из core для удобства
export { ModuleLoadType, type ModuleLoadCondition };
