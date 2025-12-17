import { type Bootstrap } from '../../index';
import { RouterHandler } from '../RouterHandler';
import { type IRoutes } from '@platform/core';

describe('RouterHandler', () => {
  const bootstrapMock: Bootstrap = {
    routerService: { initRouter: vi.fn() },
  } as any;

  test('должен вызывать initRouter с параметрами', async () => {
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
