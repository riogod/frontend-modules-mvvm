import { type IRoute } from "@todo/core";
import { type Bootstrap } from ".";
import { type i18n } from "i18next";
import { type RequestHandler } from "msw";

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
}
