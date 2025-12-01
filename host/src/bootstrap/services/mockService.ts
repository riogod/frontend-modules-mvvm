import { type SetupWorker, setupWorker } from 'msw/browser';
import { type RequestHandler } from 'msw';
import { log } from '@platform/core';

/**
 * Сервис моков API для локальной разработки основан на библиотеке msw
 */
export class BootstrapMockService {
  mswWorker: SetupWorker = setupWorker();
  private isStarted: boolean = false;

  /**
   * Инициализирует запуск сервиса
   *
   * @return {Promise<void>}
   */
  async init(): Promise<void> {
    if (process.env.NODE_ENV !== 'development') {
      log.debug('Mock service skipped (not in development mode)', {
        prefix: 'bootstrap.mockService',
      });
      return;
    }
    if (!this.mswWorker) {
      log.warn('MSW worker not available', { prefix: 'bootstrap.mockService' });
      return;
    }

    log.debug('Starting MSW worker', { prefix: 'bootstrap.mockService' });
    await this.mswWorker.start({
      onUnhandledRequest: 'bypass',
    });
    this.isStarted = true;
    log.debug('MSW worker started successfully', {
      prefix: 'bootstrap.mockService',
    });
  }

  /**
   * Останавливает MSW worker
   * Используется когда моки отключены, чтобы гарантировать, что запросы идут на реальный сервер
   *
   * @return {void}
   */
  stop(): void {
    if (!this.isStarted || !this.mswWorker) {
      return;
    }

    log.debug('Stopping MSW worker', { prefix: 'bootstrap.mockService' });
    try {
      this.mswWorker.stop();
      this.isStarted = false;
      log.debug('MSW worker stopped successfully', {
        prefix: 'bootstrap.mockService',
      });
    } catch (error) {
      log.warn('Failed to stop MSW worker', {
        prefix: 'bootstrap.mockService',
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Добавляет обработчики для моков API
   * Handlers можно добавлять как до, так и после start() - они будут применены автоматически
   *
   * @param handlers - Массив обработчиков
   */
  addHandlers(handlers: RequestHandler[]): void {
    if (process.env.NODE_ENV !== 'development') {
      log.debug('Mock handlers skipped (not in development mode)', {
        prefix: 'bootstrap.mockService',
      });
      return;
    }
    if (!this.mswWorker) {
      log.warn('Worker not initialized, cannot add handlers', {
        prefix: 'bootstrap.mockService',
      });
      return;
    }
    if (!handlers || handlers.length === 0) {
      log.warn('No handlers provided', { prefix: 'bootstrap.mockService' });
      return;
    }
    log.debug(`Adding ${handlers.length} mock handlers to MSW worker`, {
      prefix: 'bootstrap.mockService',
    });
    this.mswWorker.use(...handlers);
    log.debug(`Mock handlers added successfully`, {
      prefix: 'bootstrap.mockService',
    });
  }
}
