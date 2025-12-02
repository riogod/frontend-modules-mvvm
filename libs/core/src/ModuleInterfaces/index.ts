import type { IRoute } from '../Router/interfaces';
import { type i18n } from 'i18next';
import { type RequestHandler } from 'msw';
import type { IBootstrap } from '../interfaces';

/**
 * Запись модуля в манифесте
 */
export interface ModuleManifestEntry {
  name: string;
  version?: string;
  loadType: 'init' | 'normal';
  loadPriority?: number;
  remoteEntry: string;
  dependencies?: string[];
  featureFlags?: string[];
  accessPermissions?: string[];
}

/**
 * Тип загрузки модуля
 */
export enum ModuleLoadType {
  /**
   * Модуль загружается при инициализации приложения
   */
  INIT = 'init',
  /**
   * Модуль загружается перед стартом приложения
   */
  BEFORE = 'before',
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
};

/**
 * Интерфейс конфигурации модуля приложения.
 * @template TBootstrap - Тип bootstrap объекта для инициализации модуля (по умолчанию IBootstrap)
 */
export interface ModuleConfig<TBootstrap extends IBootstrap = IBootstrap> {
  /**
   * Функция, возвращающая маршруты модуля.
   * Опциональна - модуль может не иметь маршрутов (например, модули только для инициализации).
   */
  ROUTES?: () => IRoute[];
  /**
   * Функция для настройки i18n модуля
   */
  I18N?: (i18n: i18n) => void;
  /**
   * Функция инициализации модуля. Может быть как синхронной (void), так и асинхронной (Promise<void>).
   */
  onModuleInit?: (bootstrap: TBootstrap) => void | Promise<void>;
  /**
   * MSW handlers для моков модуля
   */
  mockHandlers?: RequestHandler[];
  /**
   * Mock данные модуля (features, permissions, params)
   */
  mockModuleData?: {
    features?: Record<string, boolean>;
    permissions?: Record<string, boolean>;
    params?: Record<string, unknown>;
  };
  /**
   * Информация о модуле для манифеста
   */
  mockModuleInfo: ModuleManifestEntry;
}

// Реэкспорт интерфейса Bootstrap
export type { IBootstrap } from '../interfaces';
