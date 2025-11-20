import { Bootstrap } from '..';
import { InitHandler } from './interface';
import { IAppConfig } from '../../config/app.ts';

/**
 * Абстрактный обработчик инициализации.
 */
export abstract class AbstractInitHandler implements InitHandler {
  private nextHandler?: InitHandler;

  constructor(protected params: IAppConfig) {}

  setNext(handler: InitHandler): InitHandler {
    this.nextHandler = handler;

    return handler;
  }

  async handle(bootstrap: Bootstrap): Promise<Bootstrap> {
    if (this.nextHandler) {
      return await this.nextHandler.handle(bootstrap);
    }

    return bootstrap;
  }
}
