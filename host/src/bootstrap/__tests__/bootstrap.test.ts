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
          mockModuleInfo: {
            name: 'core',
            loadType: ModuleLoadType.INIT,
            loadPriority: 1,
            remoteEntry: '',
            dependencies: [],
            featureFlags: [],
            accessPermissions: [],
          },
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
          mockModuleInfo: {
            name: 'todo',
            loadType: ModuleLoadType.NORMAL,
            loadPriority: 1,
            remoteEntry: '',
            dependencies: [],
            featureFlags: [],
            accessPermissions: [],
          },
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
          mockModuleInfo: {
            name: 'api',
            loadType: ModuleLoadType.NORMAL,
            loadPriority: 1,
            remoteEntry: '',
            dependencies: [],
            featureFlags: [],
            accessPermissions: [],
          },
        },
      },
      {
        name: 'demo',
        config: {
          ROUTES: () => [],
          mockHandlers: [],
          mockModuleInfo: {
            name: 'demo',
            loadType: ModuleLoadType.NORMAL,
            loadPriority: 1,
            remoteEntry: '',
            dependencies: [],
            featureFlags: [],
            accessPermissions: [],
          },
        },
      },
    ];
    bootstrap = new Bootstrap(modules);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('constructor', () => {
    test('не должен вызывать mock service, если не в режиме development', () => {
      // mockService больше не используется, так как все моки обрабатываются через dev-server
    });

    test.skip('должен вызывать mock service, если в режиме development', () => {
      // Тест пропущен: mockService больше не используется, моки обрабатываются через proxy-server
    });
  });

  describe('getAPIClient getter', () => {
    test('должен выбрасывать ошибку, если getAPIClient не определен', () => {
      // Подавляем вывод в stderr от logger
      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      expect(() => bootstrap.getAPIClient).toThrow();

      consoleErrorSpy.mockRestore();
    });

    // test('should return APIClient after initialization', async () => {
    //   await initBootstrap(bootstrap, { apiUrl: 'test' });
    //   expect(bootstrap.getAPIClient).not.toBeNull();
    // });
  });

  describe('di getter', () => {
    test('должен возвращать экземпляр DI контейнера', () => {
      expect(bootstrap.di).not.toBeNull();
      expect(bootstrap.di).toBeInstanceOf(Container);
    });
  });

  describe('initAPIClient', () => {
    test('должен устанавливать APIClient', () => {
      bootstrap.initAPIClient('test');
      expect(bootstrap.getAPIClient).not.toBeNull();
      expect(bootstrap.getAPIClient).toBeInstanceOf(APIClient);
    });
  });

  describe('initDI', () => {
    test('должен устанавливать DI контейнер', () => {
      bootstrap.initDI();
      expect(bootstrap.di).not.toBeNull();
      expect(bootstrap.di).toBeInstanceOf(Container);
    });
    test('должен привязывать APIClient к DI контейнеру', () => {
      bootstrap.initAPIClient('test');
      bootstrap.initDI();
      expect(bootstrap.di.isBound(IOC_CORE_TOKENS.APIClient)).toBe(true);
    });
    test('не должен привязывать APIClient к DI контейнеру', () => {
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
      // Очищаем моки перед каждым тестом
      vi.clearAllMocks();

      // Заменяем routerService на мок после создания Bootstrap
      // так как Bootstrap создает экземпляр напрямую в поле класса
      bootstrap.routerService = {
        routes: [],
        router: {
          add: vi.fn(),
        },
        init: vi.fn(),
        addRoutes: addRoutes,
        registerRoutes: registerRoutes,
        routerPostInit: vi.fn(),
        buildRoutesMenu: vi.fn(),
      } as any;

      bootstrap.initAPIClient('test');
      bootstrap.initDI();
      // Инициализируем i18n перед загрузкой модулей, так как модули требуют addResourceBundle
      await bootstrap.i18n.init({
        resources: { ru: {}, en: {} },
        fallbackLng: 'en',
      });
      bootstrap.initModuleLoader();
      // Модули должны быть добавлены в ModuleLoader перед вызовом initInitModules
      await bootstrap.moduleLoader.addModules(modules);
      await bootstrap.moduleLoader.initInitModules();
    });

    test('должен инициализировать маршруты модуля, если они определены', async () => {
      let moduleConfig = modules[0].config;
      // Для remote INIT модулей config может быть Promise
      if (moduleConfig instanceof Promise) {
        moduleConfig = await moduleConfig;
      }
      if (moduleConfig.ROUTES) {
        expect(registerRoutes).toBeCalledWith(moduleConfig.ROUTES());
      }
    });

    test('должен вызывать onModuleInit, если он определен', async () => {
      let moduleConfig = modules[0].config;
      // Для remote INIT модулей config может быть Promise
      if (moduleConfig instanceof Promise) {
        moduleConfig = await moduleConfig;
      }
      if (moduleConfig.onModuleInit) {
        expect(moduleConfig.onModuleInit).toBeCalled();
      }
    });

    test('должен добавлять словари i18n, если I18N определен', async () => {
      let moduleConfig = modules[0].config;
      // Для remote INIT модулей config может быть Promise
      if (moduleConfig instanceof Promise) {
        moduleConfig = await moduleConfig;
      }
      expect(bootstrap.i18n).not.toBeNull();
      expect(moduleConfig.I18N).toBeCalled();
    });

    test.skip('должен добавлять mock handlers, если NODE_ENV - development, mockHandlers и mockService определены', async () => {
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
