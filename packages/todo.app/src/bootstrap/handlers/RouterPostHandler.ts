import { AbstractInitHandler } from "./AbstractInitHandler";
import { Bootstrap } from "..";

/**
 * Обработчик пост инициализации роутера.
 */
export class RouterPostHandler extends AbstractInitHandler {
  async handle(bootstrap: Bootstrap): Promise<Bootstrap> {
    const { routerPostInit } = this.params;

    bootstrap.routerService.routerPostInit(routerPostInit);

    const appMenu = bootstrap.routerService.buildRoutesMenu(
      bootstrap.routerService.routes,
    );

    bootstrap.routerService.router.setDependencies({
      di: bootstrap.di,
      menu: appMenu,
    });

    return await super.handle(bootstrap);
  }
}
