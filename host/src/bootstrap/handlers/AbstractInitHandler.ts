import { type Bootstrap } from '..';
import { type InitHandler } from './interface';
import { type IAppConfig } from '../../config/app';

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
