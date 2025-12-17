import { type Bootstrap } from '../../index';
import { RouterPostHandler } from '../RouterPostHandler';

describe('RouterPostHandler', () => {
  const preloadRoutes = vi.fn();
  const buildRoutesMenu = vi.fn().mockReturnValue([]);
  const bootstrapMock: Bootstrap = {
    routerService: {
      routerPostInit: vi.fn(),
      buildRoutesMenu,
      routes: [{ path: 'test_path' }],
      router: {
        setDependencies: vi.fn(),
      },
    },
    moduleLoader: {
      preloadRoutes,
    },
  } as any;

  test('должен инициализировать APIClient с apiUrl', async () => {
    const testUrl = 'test_url';
    const testPrefix = 'test_prefix';
    const routerPostInit = 'postInit';

    const handler = new RouterPostHandler({
      apiUrl: testUrl,
      appPrefix: testPrefix,
      // @ts-ignore
      routerPostInit,
    });

    await handler.handle(bootstrapMock);

    expect(preloadRoutes).toBeCalled();
    expect(bootstrapMock.routerService.routerPostInit).toBeCalledWith(
      routerPostInit,
    );
    expect(bootstrapMock.routerService.buildRoutesMenu).toBeCalledWith(
      bootstrapMock.routerService.routes,
    );
    expect(bootstrapMock.routerService.router.setDependencies).toBeCalled();
  });
});
