import { type Bootstrap } from '../../index';
import { ModulesHandler } from '../ModulesHandler';

describe('ModulesHandler', () => {
  const initInitModules = vi.fn();
  const addModules = vi.fn();
  const bootstrapMock: Bootstrap = {
    initModuleLoader: vi.fn(),
    getDiscoveredModules: vi.fn(() => []),
    moduleLoader: {
      initInitModules,
      addModules,
    },
  } as any;

  test('should call initModules bootstrap method', async () => {
    const handler = new ModulesHandler({});

    await handler.handle(bootstrapMock);

    expect(bootstrapMock.initModuleLoader).toBeCalled();
    expect(bootstrapMock.getDiscoveredModules).toBeCalled();
    expect(addModules).toBeCalled();
    expect(initInitModules).toBeCalled();
  });
});
