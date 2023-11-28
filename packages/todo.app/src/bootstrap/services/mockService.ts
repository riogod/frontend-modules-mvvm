import { SetupWorker, setupWorker } from "msw/browser";
import { RequestHandler } from "msw";

/**
 * Сервис моков API для локальной разработки основан на библиотеке msw
 */
export class BootstrapMockService {
  mswWorker: SetupWorker = setupWorker();

  /**
   * Инициализирует запуск сервиса
   *
   * @return {Promise<void>}
   */
  async init(): Promise<void> {
    if (process.env.NODE_ENV !== "development") {
      return;
    }
    if (!this.mswWorker) {
      return;
    }

    await this.mswWorker.start({
      onUnhandledRequest: "bypass",
    });
  }

  /**
   * Добавляет обработчики для моков API
   *
   * @param handlers - Массив обработчиков
   */
  addHandlers(handlers: RequestHandler[]): void {
    if (process.env.NODE_ENV !== "development") {
      return;
    }
    this.mswWorker?.use(...handlers);
  }
}
