import { type IRoute } from '@platform/core';
import { type i18n } from 'i18next';
import { type RequestHandler } from 'msw';
import type { Bootstrap } from '.';

// Реэкспорт типов манифеста из единого источника
import type { ModuleManifestEntry } from '@platform/vite-config/plugins/types';

export type { ModuleManifestEntry };

/**
 *  Интерфейс конфигурации модуля приложения.
 */
export interface ModuleConfig {
  /**
   * Функция, возвращающая маршруты модуля.
   * Опциональна - модуль может не иметь маршрутов (например, модули только для инициализации).
   */
  ROUTES?: () => IRoute[];
  I18N?: (i18n: i18n) => void;
  /**
   * Функция инициализации модуля. Может быть как синхронной (void), так и асинхронной (Promise<void>).
   */
  onModuleInit?: (bootstrap: Bootstrap) => void | Promise<void>;
  mockHandlers?: RequestHandler[];
  mockModuleData?: {
    features?: Record<string, boolean>;
    permissions?: Record<string, boolean>;
    params?: Record<string, unknown>;
  };
  mockModuleInfo: ModuleManifestEntry;
}
