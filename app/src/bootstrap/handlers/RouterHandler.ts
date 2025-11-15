import { Bootstrap } from '..';
import { AbstractInitHandler } from './AbstractInitHandler';
import { log } from '@todo/core';

/**
 * Обработчик инициализации роутера
 */
export class RouterHandler extends AbstractInitHandler {
  async handle(bootstrap: Bootstrap): Promise<Bootstrap> {
    log.debug('RouterHandler: starting', { prefix: 'bootstrap.handlers' });
    const { routes, appPrefix } = this.params;
    if (routes) {
      bootstrap.routerService.initRouter(routes, appPrefix || '');
      log.debug(`RouterHandler: router initialized with ${routes.length} routes, prefix: ${appPrefix || ''}`, { prefix: 'bootstrap.handlers' });
    }

    log.debug('RouterHandler: completed', { prefix: 'bootstrap.handlers' });
    return await super.handle(bootstrap);
  }
}
