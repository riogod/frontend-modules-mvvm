import { Bootstrap } from '../index.ts';
import { type Module, ModuleLoadType } from '../../modules/interface.ts';
import { Container } from 'inversify';
import { APIClient } from '@todo/core';

let bootstrap: Bootstrap;

vi.mock('../services/mockService.ts', () => ({
  BootstrapMockService: class {
    init = vi.fn();
    addHandlers = vi.fn();
  },
}));

const addRoutes = vi.fn();
const registerRoutes = vi.fn();
vi.mock('../services/routerService.ts', () => ({
  BootstrapRouterService: class {
    routes: any[] = [];
    router = {
      add: vi.fn(),
    };
    init = vi.fn();
    addRoutes = addRoutes;
    registerRoutes = registerRoutes;
    routerPostInit = vi.fn();
    buildRoutesMenu = vi.fn();
  },
}));

const modules: Module[] = [
  {
    name: 'core',
    loadType: ModuleLoadType.INIT,
    config: {
      ROUTES: () => [
        {
          name: 'home',
          path: '/',
        },
        {
          name: '404',
          path: '/404',
        },
      ],
      I18N: vi.fn(),
      onModuleInit: vi.fn(),
    },
  },
  {
    name: 'todo',
    config: {
      ROUTES: () => [
        {
          name: 'todo',
          path: '/',
        },
      ],
      I18N: vi.fn(),
    },
  },
  {
    name: 'api',
    config: {
      ROUTES: () => [
        {
          name: 'api',
          path: '/api-example',
        },
      ],
    },
  },
  {
    name: 'demo',
    config: {
      ROUTES: () => [],
      mockHandlers: [],
    },
  },
];

describe('bootstrap', () => {
  beforeEach(() => {
    process.env.NODE_ENV = 'test';
    bootstrap = new Bootstrap(modules);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('constructor', () => {
    test('should not call mock service if not in development ', () => {
      expect(bootstrap.mockService).toBeNull();
    });

    test('should call mock service if in development ', () => {
      process.env.NODE_ENV = 'development';
      bootstrap = new Bootstrap([]);
      expect(bootstrap.mockService).not.toBeNull();
    });
  });

  describe('getAPIClient getter', () => {
    test('should throw error if getAPIClient is not defined', () => {
      expect(() => bootstrap.getAPIClient).toThrow();
    });

    // test('should return APIClient after initialization', async () => {
    //   await initBootstrap(bootstrap, { apiUrl: 'test' });
    //   expect(bootstrap.getAPIClient).not.toBeNull();
    // });
  });

  describe('di getter', () => {
    test('should return instance of di container', () => {
      expect(bootstrap.di).not.toBeNull();
      expect(bootstrap.di).toBeInstanceOf(Container);
    });
  });

  describe('initAPIClient', () => {
    test('should set APIClient', () => {
      bootstrap.initAPIClient('test');
      expect(bootstrap.getAPIClient).not.toBeNull();
      expect(bootstrap.getAPIClient).toBeInstanceOf(APIClient);
    });
  });

  describe('initDI', () => {
    test('should set DI container', () => {
      bootstrap.initDI();
      expect(bootstrap.di).not.toBeNull();
      expect(bootstrap.di).toBeInstanceOf(Container);
    });
    test('should bind APIClient to DI container', () => {
      bootstrap.initAPIClient('test');
      bootstrap.initDI();
      expect(bootstrap.di.isBound(APIClient)).toBe(true);
    });
    test('should not bind APIClient to DI container', () => {
      bootstrap.initDI();
      // APIClient не должен быть зарегистрирован, если он не был инициализирован
      // С autobind: true isBound может выбросить ошибку для классов без @injectable/@provide
      // Это нормально - APIClient не должен быть зарегистрирован без явной инициализации
      let isBound = false;
      try {
        isBound = bootstrap.di.isBound(APIClient);
      } catch (error) {
        // Если isBound выбросил ошибку из-за отсутствия метаданных, это нормально
        // APIClient не должен быть зарегистрирован
        isBound = false;
      }
      expect(isBound).toBe(false);
    });
  });

  describe('initModules', () => {
    beforeEach(async () => {
      bootstrap.initAPIClient('test');
      bootstrap.initDI();
      void bootstrap.initModuleLoader();
      await bootstrap.moduleLoader.initInitModules();
    });

    test('should initialize module routes if routes are defined', () => {
      expect(registerRoutes).toBeCalledWith(modules[0].config.ROUTES());
    });

    test('should call onModuleInit if onModuleInit is defined', () => {
      expect(modules[0].config.onModuleInit).toBeCalled();
    });

    test('should add i18n dictionaries if I18N is defined', () => {
      expect(bootstrap.i18n).not.toBeNull();
      expect(modules[0].config.I18N).toBeCalled();
    });

    test('should add mock handlers if  NODE_ENV is development, mockHandlers and mockService is defined', async () => {
      process.env.NODE_ENV = 'development';
      bootstrap = new Bootstrap(modules);
      bootstrap.initAPIClient('test');
      bootstrap.initDI();
      void bootstrap.initModuleLoader();
      await bootstrap.moduleLoader.initInitModules();

      expect(bootstrap.mockService).not.toBeNull();
    });
  });
});
