import { type Bootstrap } from '../../index.ts';
import { RouterHandler } from '../RouterHandler.ts';
import { type IRoutes } from '@todo/core';

describe('RouterHandler', () => {
  const bootstrapMock: Bootstrap = {
    routerService: { initRouter: vi.fn() },
  } as any;

  test('should call initRouter with params', async () => {
    const testUrl = 'test_url';
    const testPrefix = 'test_prefix';
    const testRoutes: IRoutes = [{ path: 'test_path', name: 'test_name' }];

    const handler = new RouterHandler({
      apiUrl: testUrl,
      appPrefix: testPrefix,
      routes: testRoutes,
    });

    await handler.handle(bootstrapMock);

    expect(bootstrapMock.routerService.initRouter).toBeCalledWith(
      testRoutes,
      testPrefix,
    );
  });
});
