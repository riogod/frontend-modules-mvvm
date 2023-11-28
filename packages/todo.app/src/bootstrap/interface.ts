import { IRoute } from "@todo/core";
import { Bootstrap } from ".";
import { i18n } from "i18next";
import { RequestHandler } from "msw";

/**
 *  Интерфейс конфигурации модуля приложения.
 */
export interface ModuleConfig {
  ROUTES: () => IRoute[];
  I18N?: (i18n: i18n) => void;
  onModuleInit?: (bootstrap: Bootstrap) => Promise<void>;
  mockHandlers?: RequestHandler[];
}
