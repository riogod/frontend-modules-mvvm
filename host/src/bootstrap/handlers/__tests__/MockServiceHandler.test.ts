import { type Bootstrap } from '../../index.ts';
import { MockServiceHandler } from '../MockServiceHandler.ts';

describe('MockServiceHandler', () => {
  test('should initialize mock service in development environment', async () => {
    process.env.NODE_ENV = 'development';

    const mockService = { init: vi.fn() };
    const bootstrap: Bootstrap = { mockService } as any;

    const handler = new MockServiceHandler({});
    await handler.handle(bootstrap);

    expect(mockService.init).toHaveBeenCalled();
  });

  test('should not initialize mock service in non-development environment', async () => {
    process.env.NODE_ENV = 'production';

    const mockService = { init: vi.fn() };
    const bootstrap: Bootstrap = { mockService } as any;

    const handler = new MockServiceHandler({});
    await handler.handle(bootstrap);

    expect(mockService.init).not.toHaveBeenCalled();
  });

  test('should call the superclass handle method', async () => {
    const mockService = { init: vi.fn() };
    const bootstrap: Bootstrap = { mockService } as any;

    const handler = new MockServiceHandler({});
    const superHandleSpy = vi.spyOn(handler, 'handle');

    await handler.handle(bootstrap);

    expect(superHandleSpy).toHaveBeenCalledWith(bootstrap);
  });
});
