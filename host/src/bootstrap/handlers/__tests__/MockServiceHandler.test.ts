import { type Bootstrap } from '../../index';
import { MockServiceHandler } from '../MockServiceHandler';

describe('MockServiceHandler', () => {
  test('should initialize mock service in development environment', async () => {
    process.env.NODE_ENV = 'development';

    const mockService = {
      init: vi.fn(),
      addHandlers: vi.fn(),
    };
    const bootstrap: Bootstrap = { mockService } as any;

    const handler = new MockServiceHandler({});
    await handler.handle(bootstrap);

    expect(mockService.init).toHaveBeenCalled();
    expect(mockService.addHandlers).toHaveBeenCalled();
  });

  test('should not initialize mock service in non-development environment', async () => {
    process.env.NODE_ENV = 'production';

    const mockService = {
      init: vi.fn(),
      addHandlers: vi.fn(),
    };
    const bootstrap: Bootstrap = { mockService } as any;

    const handler = new MockServiceHandler({});
    await handler.handle(bootstrap);

    expect(mockService.init).not.toHaveBeenCalled();
    expect(mockService.addHandlers).not.toHaveBeenCalled();
  });

  test('should call the superclass handle method', async () => {
    const mockService = {
      init: vi.fn(),
      addHandlers: vi.fn(),
    };
    const bootstrap: Bootstrap = { mockService } as any;

    const handler = new MockServiceHandler({});
    const superHandleSpy = vi.spyOn(handler, 'handle');

    await handler.handle(bootstrap);

    expect(superHandleSpy).toHaveBeenCalledWith(bootstrap);
  });
});
