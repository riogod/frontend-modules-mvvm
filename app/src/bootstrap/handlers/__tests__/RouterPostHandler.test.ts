import { Bootstrap } from '../../index.ts';
import { RouterPostHandler } from '../RouterPostHandler.ts';

describe('RouterPostHandler', () => {
  const bootstrapMock: Bootstrap = {
    routerService: {
      routerPostInit: vi.fn(),
      buildRoutesMenu: vi.fn(),
      routes: [{ path: 'test_path' }],
      router: {
        setDependencies: vi.fn(),
      },
    },
  } as any;

  test('should initialize APIClient with apiUrl', async () => {
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

    expect(bootstrapMock.routerService.routerPostInit).toBeCalledWith(
      routerPostInit,
    );
    expect(bootstrapMock.routerService.buildRoutesMenu).toBeCalledWith(
      bootstrapMock.routerService.routes,
    );
    expect(bootstrapMock.routerService.router.setDependencies).toBeCalled();
  });
});
