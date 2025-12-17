import { type Bootstrap } from '../../index';
import { AbstractInitHandler } from '../AbstractInitHandler';
import { type IAppConfig } from '../../../config/app';

class TestHandler extends AbstractInitHandler {
  async handle(bootstrap: Bootstrap): Promise<Bootstrap> {
    return bootstrap;
  }
}

const params: IAppConfig = {
  apiUrl: 'test',
};

describe('AbstractInitHandler', () => {
  let abstractInitHandler: AbstractInitHandler;
  let nextHandler: TestHandler;
  let bootstrap: Bootstrap;

  beforeEach(() => {
    abstractInitHandler = new TestHandler(params);
    nextHandler = new TestHandler(params);
    bootstrap = {} as Bootstrap;
  });

  test('должен корректно устанавливать следующий обработчик', () => {
    const result = abstractInitHandler.setNext(nextHandler);
    expect(result).toBe(nextHandler);
  });

  test('должен возвращать исходный bootstrap, когда следующий обработчик не существует', async () => {
    const result = await abstractInitHandler.handle(bootstrap);
    expect(result).toBe(bootstrap);
  });

  test('должен вызывать следующий обработчик, когда он существует', async () => {
    abstractInitHandler.setNext(nextHandler);
    const result = await nextHandler.handle(bootstrap);

    expect(result).toBe(bootstrap);
  });
});
