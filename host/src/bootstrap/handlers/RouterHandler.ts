import { type Bootstrap } from '..';
import { AbstractInitHandler } from './AbstractInitHandler';
import { log } from '@platform/core';

/**
 * Обработчик инициализации роутера
 */
export class RouterHandler extends AbstractInitHandler {
  async handle(bootstrap: Bootstrap): Promise<Bootstrap> {
    log.debug('RouterHandler: starting', {
      prefix: 'bootstrap.handlers.RouterHandler',
    });
    const { routes, appPrefix } = this.params;
    if (routes) {
      bootstrap.routerService.initRouter(routes, appPrefix || '');
      log.debug(
        `RouterHandler: router initialized with ${routes.length} routes, prefix: ${appPrefix || ''}`,
        { prefix: 'bootstrap.handlers.RouterHandler' },
      );
    }

    log.debug('RouterHandler: completed', {
      prefix: 'bootstrap.handlers.RouterHandler',
    });
    return await super.handle(bootstrap);
  }
}
