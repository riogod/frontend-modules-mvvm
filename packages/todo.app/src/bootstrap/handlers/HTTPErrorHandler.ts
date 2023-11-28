import { Bootstrap } from "..";
import { AbstractInitHandler } from "./AbstractInitHandler";

/**
 * Обработчик инициализации HTTP ошибок.
 */
export class HTTPErrorHandler extends AbstractInitHandler {
  async handle(bootstrap: Bootstrap): Promise<Bootstrap> {
    return await super.handle(bootstrap);
  }
}
