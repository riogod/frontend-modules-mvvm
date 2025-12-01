import { AbstractInitHandler } from './AbstractInitHandler';
import { type Bootstrap } from '../index';
import { log } from '@platform/core';
import { handlers } from 'host/src/mocks/index';

/**
 * Обработчик инициализации мок сервиса
 */
export class MockServiceHandler extends AbstractInitHandler {
  async handle(bootstrap: Bootstrap): Promise<Bootstrap> {
    log.debug('MockServiceHandler: starting', { prefix: 'bootstrap.handlers' });
    
    // Проверяем, нужно ли использовать локальные моки
    const useLocalMocks = import.meta.env.VITE_USE_LOCAL_MOCKS !== undefined
      ? import.meta.env.VITE_USE_LOCAL_MOCKS === 'true'
      : true; // По умолчанию используем моки

    if (process.env.NODE_ENV === 'development' && useLocalMocks) {
      await bootstrap.mockService?.init();
      bootstrap.mockService?.addHandlers(handlers);
      log.debug('MockServiceHandler: mock service initialized', {
        prefix: 'bootstrap.handlers',
      });
    } else if (process.env.NODE_ENV === 'development' && !useLocalMocks) {
      log.debug('MockServiceHandler: моки отключены, используется реальный API', {
        prefix: 'bootstrap.handlers',
      });
    }
    
    log.debug('MockServiceHandler: completed', {
      prefix: 'bootstrap.handlers',
    });
    return await super.handle(bootstrap);
  }
}
