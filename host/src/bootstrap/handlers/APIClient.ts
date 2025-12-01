import { AbstractInitHandler } from './AbstractInitHandler';
import { type Bootstrap } from '..';
import { log } from '@platform/core';

/**
 * Обработчик инициализации APIClient.
 */
export class APIClientHandler extends AbstractInitHandler {
  async handle(bootstrap: Bootstrap): Promise<Bootstrap> {
    log.debug('APIClientHandler: starting', {
      prefix: 'bootstrap.handlers.APIClientHandler',
    });
    const { apiUrl } = this.params;

    if (!apiUrl) {
      throw new Error('apiUrl in application config is not defined');
    }
    bootstrap.initAPIClient(apiUrl);

    log.debug('APIClientHandler: completed', {
      prefix: 'bootstrap.handlers.APIClientHandler',
    });
    return await super.handle(bootstrap);
  }
}
