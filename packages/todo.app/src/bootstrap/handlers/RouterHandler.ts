import { Bootstrap } from "..";
import { AbstractInitHandler } from "./AbstractInitHandler";

/**
 * Обработчик инициализации роутера
 */
export class RouterHandler extends AbstractInitHandler {
  async handle(bootstrap: Bootstrap): Promise<Bootstrap> {
    const { routes, appPrefix } = this.params;
    bootstrap.routerService.initRouter(routes, appPrefix);

    return await super.handle(bootstrap);
  }
}
