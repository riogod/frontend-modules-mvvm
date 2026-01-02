import type { IRoute } from '../Router/interfaces';
import { type RequestHandler } from 'msw';
import type { IBootstrap } from '../interfaces';

/**
 * Интерфейс i18n для модулей.
 * Определён локально, чтобы избежать прямой зависимости от i18next
 * в shared библиотеках (это вызывает проблемы с Module Federation).
 */
export interface ModuleI18n {
  addResourceBundle(
    lng: string,
    ns: string,
    resources: Record<string, unknown>,
    deep?: boolean,
    overwrite?: boolean,
  ): void;
}

/**
 * Запись модуля в манифесте
 */
export interface ModuleManifestEntry {
  name: string;
  loadType: ModuleLoadType;
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
  I18N?: (i18n: ModuleI18n) => void;
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
   * Информация о модуле для манифеста.
   * Обязательна для MFE модулей, не требуется для Local модулей.
   */
  mockModuleInfo?: ModuleManifestEntry;
}

// Реэкспорт интерфейса Bootstrap
export type { IBootstrap } from '../interfaces';
