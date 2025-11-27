import { AbstractInitHandler } from './AbstractInitHandler';
import { type Bootstrap } from '../index.ts';
import { log } from '@platform/core';
import { handlers } from 'host/src/mocks/index.ts';

/**
 * Обработчик инициализации мок сервиса
 */
export class MockServiceHandler extends AbstractInitHandler {
  async handle(bootstrap: Bootstrap): Promise<Bootstrap> {
    log.debug('MockServiceHandler: starting', { prefix: 'bootstrap.handlers' });
    if (process.env.NODE_ENV === 'development') {
      await bootstrap.mockService?.init();
      bootstrap.mockService?.addHandlers(handlers);
      log.debug('MockServiceHandler: mock service initialized', {
        prefix: 'bootstrap.handlers',
      });
    }
    log.debug('MockServiceHandler: completed', {
      prefix: 'bootstrap.handlers',
    });
    return await super.handle(bootstrap);
  }
}
