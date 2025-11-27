import { type Bootstrap } from '..';
import { AbstractInitHandler } from './AbstractInitHandler';
import { log } from '@platform/core';

/**
 * Обработчик инициализации HTTP ошибок.
 */
export class HTTPErrorHandler extends AbstractInitHandler {
  async handle(bootstrap: Bootstrap): Promise<Bootstrap> {
    log.debug('HTTPErrorHandler: starting', { prefix: 'bootstrap.handlers' });
    log.debug('HTTPErrorHandler: completed', { prefix: 'bootstrap.handlers' });
    return await super.handle(bootstrap);
  }
}
