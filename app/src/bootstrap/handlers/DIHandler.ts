import { Bootstrap } from "..";
import { AbstractInitHandler } from "./AbstractInitHandler";

/**
 * Обработчик инициализации DI контейнера.
 */
export class DIHandler extends AbstractInitHandler {
  async handle(bootstrap: Bootstrap): Promise<Bootstrap> {
    bootstrap.initDI();

    return await super.handle(bootstrap);
  }
}
