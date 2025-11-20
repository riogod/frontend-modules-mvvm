import { type Bootstrap } from '../../index.ts';
import { ModulesHandler } from '../ModulesHandler.ts';

describe('ModulesHandler', () => {
  const initInitModules = vi.fn();
  const bootstrapMock: Bootstrap = {
    initModuleLoader: vi.fn(),
    moduleLoader: {
      initInitModules,
    },
  } as any;

  test('should call initModules bootstrap method', async () => {
    const handler = new ModulesHandler({});

    await handler.handle(bootstrapMock);

    expect(bootstrapMock.initModuleLoader).toBeCalled();
    expect(initInitModules).toBeCalled();
  });
});
