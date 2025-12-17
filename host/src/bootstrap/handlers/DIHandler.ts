import { type Bootstrap } from '..';
import { AbstractInitHandler } from './AbstractInitHandler';
import { log } from '@platform/core';

/**
 * Обработчик инициализации DI контейнера.
 */
export class DIHandler extends AbstractInitHandler {
  async handle(bootstrap: Bootstrap): Promise<Bootstrap> {
    log.debug('DIHandler: starting', {
      prefix: 'bootstrap.handlers.DIHandler',
    });
    bootstrap.initDI();
    log.debug('DIHandler: completed', {
      prefix: 'bootstrap.handlers.DIHandler',
    });

    return await super.handle(bootstrap);
  }
}
