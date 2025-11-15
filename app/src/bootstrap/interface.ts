import { IRoute } from "@todo/core";
import { Bootstrap } from ".";
import { i18n } from "i18next";
import { RequestHandler } from "msw";

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
  onModuleInit?: (bootstrap: Bootstrap) => Promise<void>;
  mockHandlers?: RequestHandler[];
}
