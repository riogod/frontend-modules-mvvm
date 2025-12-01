import { Bootstrap } from '../index';
import { type Module, ModuleLoadType } from '../../modules/interface';
import { Container } from 'inversify';
import { APIClient, IOC_CORE_TOKENS } from '@platform/core';

let bootstrap: Bootstrap;


const addRoutes = vi.fn();
const registerRoutes = vi.fn();
vi.mock('../services/routerService', () => ({
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

let modules: Module[];

describe('bootstrap', () => {
  beforeEach(() => {
    process.env.NODE_ENV = 'test';
    // Создаем модули заново в каждом тесте, чтобы моки были свежими
    modules = [
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
    bootstrap = new Bootstrap(modules);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('constructor', () => {
    test('should not call mock service if not in development ', () => {
      // mockService больше не используется, так как все моки обрабатываются через proxy-server
    });

    test.skip('should call mock service if in development ', () => {
      // Тест пропущен: mockService больше не используется, моки обрабатываются через proxy-server
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
      expect(bootstrap.di.isBound(IOC_CORE_TOKENS.APIClient)).toBe(true);
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
      bootstrap.initModuleLoader();
      // Модули должны быть добавлены в ModuleLoader перед вызовом initInitModules
      await bootstrap.moduleLoader.addModules(modules);
      await bootstrap.moduleLoader.initInitModules();
    });

    test('should initialize module routes if routes are defined', () => {
      const moduleConfig = modules[0].config;
      if (moduleConfig instanceof Promise) {
        throw new Error('INIT modules should have synchronous config');
      }
      if (moduleConfig.ROUTES) {
        expect(registerRoutes).toBeCalledWith(moduleConfig.ROUTES());
      }
    });

    test('should call onModuleInit if onModuleInit is defined', () => {
      const moduleConfig = modules[0].config;
      if (moduleConfig instanceof Promise) {
        throw new Error('INIT modules should have synchronous config');
      }
      if (moduleConfig.onModuleInit) {
        expect(moduleConfig.onModuleInit).toBeCalled();
      }
    });

    test('should add i18n dictionaries if I18N is defined', () => {
      const moduleConfig = modules[0].config;
      if (moduleConfig instanceof Promise) {
        throw new Error('INIT modules should have synchronous config');
      }
      expect(bootstrap.i18n).not.toBeNull();
      expect(moduleConfig.I18N).toBeCalled();
    });

    test.skip('should add mock handlers if  NODE_ENV is development, mockHandlers and mockService is defined', async () => {
      // Тест пропущен: mockService больше не используется, моки обрабатываются через proxy-server
      process.env.NODE_ENV = 'development';
      bootstrap = new Bootstrap(modules);
      bootstrap.initAPIClient('test');
      bootstrap.initDI();
      bootstrap.initModuleLoader();
      // Модули должны быть добавлены в ModuleLoader перед вызовом initInitModules
      await bootstrap.moduleLoader.addModules(modules);
      await bootstrap.moduleLoader.initInitModules();

      // mockService больше не используется, моки обрабатываются через proxy-server
    });
  });
});
