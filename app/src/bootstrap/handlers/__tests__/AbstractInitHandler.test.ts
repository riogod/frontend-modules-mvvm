import { Bootstrap } from '../../index.ts';
import { AbstractInitHandler } from '../AbstractInitHandler.ts';
import { IAppConfig } from '../../../config/app.ts';

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

  test('should set next handler correctly', () => {
    const result = abstractInitHandler.setNext(nextHandler);
    expect(result).toBe(nextHandler);
  });

  test('should return the original bootstrap when next handler does not exist', async () => {
    const result = await abstractInitHandler.handle(bootstrap);
    expect(result).toBe(bootstrap);
  });

  test('should call next handler when next handler exists', async () => {
    abstractInitHandler.setNext(nextHandler);
    const result = await nextHandler.handle(bootstrap);

    expect(result).toBe(bootstrap);
  });
});
