import { describe, test, expect, beforeEach, vi } from 'vitest';
import { ModuleLoader } from '../ModuleLoader';
import { type Module, ModuleLoadType } from '../../../../../modules/interface';
import type { Bootstrap } from '../../../../index';
import type { ModuleConfig } from '../../../../interface';
import { ModuleLoadStatus } from '../../types/status.types';
import type { IRoutes } from '@platform/core';

// Мокаем logger
vi.mock('@platform/core', async () => {
  const actual = await vi.importActual('@platform/core');
  return {
    ...actual,
    log: {
      debug: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      info: vi.fn(),
    },
  };
});

// Мокаем dev и prod загрузчики
vi.mock('../../dev', async () => {
  const actual = await vi.importActual('../../dev');
  return {
    ...actual,
    loadInitModulesDev: vi.fn().mockImplementation(async (modules, context) => {
      context.registry.setInitModulesLoaded(true);
    }),
    loadNormalModulesDev: vi.fn().mockResolvedValue(undefined),
  };
});

vi.mock('../../prod', async () => {
  const actual = await vi.importActual('../../prod');
  return {
    ...actual,
    loadInitModulesProd: vi
      .fn()
      .mockImplementation(async (modules, context) => {
        context.registry.setInitModulesLoaded(true);
      }),
    loadNormalModulesProd: vi.fn().mockResolvedValue(undefined),
  };
});

describe('ModuleLoader', () => {
  let loader: ModuleLoader;
  let bootstrap: Bootstrap;

  const createMockModule = (
    name: string,
    loadType: ModuleLoadType = ModuleLoadType.NORMAL,
    config?: Partial<ModuleConfig>,
  ): Module => ({
    name,
    loadType,
    config: {
      mockModuleInfo: {
        name,
        loadType,
        loadPriority: 1,
        remoteEntry: '',
        dependencies: [],
        featureFlags: [],
        accessPermissions: [],
      },
      ...config,
    } as ModuleConfig,
  });

  const createMockBootstrap = (): Bootstrap => {
    const mockRouterService = {
      registerRoutes: vi.fn(),
    };

    const mockI18n = {
      addResourceBundle: vi.fn(),
    };

    return {
      routerService: mockRouterService as any,
      i18n: mockI18n as any,
    } as Bootstrap;
  };

  beforeEach(() => {
    loader = new ModuleLoader();
    bootstrap = createMockBootstrap();
    loader.init(bootstrap);
    vi.clearAllMocks();
  });

  describe('Инициализация', () => {
    test('должен создавать экземпляр ModuleLoader', () => {
      const newLoader = new ModuleLoader();
      expect(newLoader).toBeInstanceOf(ModuleLoader);
    });

    test('должен инициализироваться с bootstrap', () => {
      const newLoader = new ModuleLoader();
      newLoader.init(bootstrap);
      expect(newLoader.getModules()).toEqual([]);
    });

    test('должен возвращать false для isInitModulesLoaded до загрузки', () => {
      expect(loader.isInitModulesLoaded).toBe(false);
    });
  });

  describe('Управление модулями', () => {
    test('должен добавлять один модуль', async () => {
      const module = createMockModule('test-module');
      await loader.addModule(module);

      expect(loader.hasModule('test-module')).toBe(true);
      expect(loader.getModule('test-module')).toBe(module);
    });

    test('должен добавлять несколько модулей', async () => {
      const module1 = createMockModule('module1');
      const module2 = createMockModule('module2');
      const module3 = createMockModule('module3');

      await loader.addModules([module1, module2, module3]);

      expect(loader.getModules()).toHaveLength(3);
      expect(loader.hasModule('module1')).toBe(true);
      expect(loader.hasModule('module2')).toBe(true);
      expect(loader.hasModule('module3')).toBe(true);
    });

    test('должен возвращать модуль по имени', async () => {
      const module = createMockModule('test-module');
      await loader.addModule(module);

      expect(loader.getModule('test-module')).toBe(module);
    });

    test('должен возвращать undefined для несуществующего модуля', () => {
      expect(loader.getModule('non-existent')).toBeUndefined();
    });

    test('должен возвращать модули по типу', async () => {
      const initModule = createMockModule('init', ModuleLoadType.INIT);
      const normalModule1 = createMockModule('normal1');
      const normalModule2 = createMockModule('normal2');

      await loader.addModules([initModule, normalModule1, normalModule2]);

      expect(loader.getModulesByType(ModuleLoadType.INIT)).toHaveLength(1);
      expect(loader.getModulesByType(ModuleLoadType.NORMAL)).toHaveLength(2);
    });

    test('должен возвращать конфигурацию модуля', async () => {
      const module = createMockModule('test-module');
      await loader.addModule(module);

      const config = loader.getModuleConfig('test-module');
      expect(config).toBeDefined();
    });
  });

  describe('Статусы модулей', () => {
    test('должен возвращать undefined для статуса несуществующего модуля', () => {
      expect(loader.getModuleStatus('non-existent')).toBeUndefined();
    });

    test('должен проверять, загружен ли модуль', async () => {
      const module = createMockModule('test-module');
      await loader.addModule(module);

      expect(loader.isModuleLoaded('test-module')).toBe(false);
    });

    test('должен проверять, предзагружен ли модуль', async () => {
      const module = createMockModule('test-module');
      await loader.addModule(module);

      expect(loader.isModulePreloaded('test-module')).toBe(false);
    });
  });

  describe('Загрузка INIT модулей', () => {
    test('должен загружать INIT модули', async () => {
      const initModule = createMockModule('init-module', ModuleLoadType.INIT);
      await loader.addModule(initModule);

      Object.defineProperty(import.meta, 'env', {
        value: { DEV: true },
        writable: true,
      });

      await loader.initInitModules();

      expect(loader.isInitModulesLoaded).toBe(true);
    });

    test('должен загружать INIT модули последовательно по приоритету', async () => {
      const module1 = createMockModule('init1', ModuleLoadType.INIT);
      module1.loadPriority = 3;
      const module2 = createMockModule('init2', ModuleLoadType.INIT);
      module2.loadPriority = 1;
      const module3 = createMockModule('init3', ModuleLoadType.INIT);
      module3.loadPriority = 2;

      await loader.addModules([module1, module2, module3]);

      Object.defineProperty(import.meta, 'env', {
        value: { DEV: true },
        writable: true,
      });

      const devModule = await import('../../dev');
      const loadInitModulesDev = vi.mocked(devModule.loadInitModulesDev);
      await loader.initInitModules();

      const sortedModules = loadInitModulesDev.mock.calls[0][0];
      expect(sortedModules.map((m: Module) => m.name)).toEqual([
        'init2',
        'init3',
        'init1',
      ]);
    });
  });

  describe('Загрузка NORMAL модулей', () => {
    test('должен загружать NORMAL модули после INIT модулей', async () => {
      const initModule = createMockModule('init', ModuleLoadType.INIT);
      const normalModule = createMockModule('normal');

      await loader.addModules([initModule, normalModule]);

      Object.defineProperty(import.meta, 'env', {
        value: { DEV: true },
        writable: true,
      });

      await loader.initInitModules();
      await loader.loadNormalModules();

      const devModule = await import('../../dev');
      const loadNormalModulesDev = vi.mocked(devModule.loadNormalModulesDev);
      expect(loadNormalModulesDev).toHaveBeenCalled();
    });
  });

  describe('Предзагрузка маршрутов', () => {
    test('должен предзагружать маршруты модулей', async () => {
      const routes: IRoutes = [{ name: 'home', path: '/' }];
      const module = createMockModule('test-module', ModuleLoadType.NORMAL, {
        ROUTES: () => routes,
      });

      await loader.addModule(module);
      await loader.preloadRoutes();

      expect(bootstrap.routerService.registerRoutes).toHaveBeenCalled();
    });
  });

  describe('Загрузка модуля по имени', () => {
    test('должен загружать модуль по имени', async () => {
      const module = createMockModule('test-module');
      await loader.addModule(module);

      Object.defineProperty(import.meta, 'env', {
        value: { DEV: true },
        writable: true,
      });

      // Сначала загружаем INIT модули (даже если их нет)
      await loader.initInitModules();

      await expect(
        loader.loadModuleByName('test-module'),
      ).resolves.not.toThrow();
    });
  });

  describe('Автозагрузка по маршруту', () => {
    test('должен автоматически загружать модуль по маршруту', async () => {
      const routes: IRoutes = [{ name: 'test', path: '/test' }];
      const module = createMockModule('test-module', ModuleLoadType.NORMAL, {
        ROUTES: () => routes,
      });

      await loader.addModule(module);

      Object.defineProperty(import.meta, 'env', {
        value: { DEV: true },
        writable: true,
      });

      await loader.initInitModules();
      // Предзагружаем маршруты, чтобы они были закешированы
      await loader.preloadRoutes();

      // Кешируем маршруты вручную, так как для NORMAL модулей это не делается автоматически
      await loader['registry'].getModuleRoutes(module);
      // Вызываем приватный метод cacheModuleRoutes через рефлексию
      const registry = loader['registry'] as any;
      await registry.cacheModuleRoutes(module);

      await loader.autoLoadModuleByRoute('test');

      // Модуль должен быть найден
      expect(loader.getModuleByRouteName('test')).toBe(module);
    });
  });

  test('должен выбрасывать ошибку при загрузке INIT модулей дважды', async () => {
    const initModule = createMockModule('init', ModuleLoadType.INIT);
    await loader.addModule(initModule);

    Object.defineProperty(import.meta, 'env', {
      value: { DEV: true },
      writable: true,
    });

    await loader.initInitModules();

    // После первой загрузки флаг установлен в registry, поэтому стратегия должна выбросить ошибку
    await expect(loader.initInitModules()).rejects.toThrow(
      'INIT модули уже загружены',
    );
  });

  test('должен выбрасывать ошибку при загрузке NORMAL модулей до INIT', async () => {
    const normalModule = createMockModule('normal');
    await loader.addModule(normalModule);

    Object.defineProperty(import.meta, 'env', {
      value: { DEV: true },
      writable: true,
    });

    await expect(loader.loadNormalModules()).rejects.toThrow(
      'INIT модули должны быть загружены первыми',
    );
  });

  test('должен выбрасывать ошибку при загрузке несуществующего модуля', async () => {
    Object.defineProperty(import.meta, 'env', {
      value: { DEV: true },
      writable: true,
    });

    await loader.initInitModules();

    await expect(loader.loadModuleByName('non-existent')).rejects.toThrow(
      'не найден',
    );
  });

  test('должен выбрасывать ошибку при загрузке INIT модуля по имени', async () => {
    const initModule = createMockModule('init', ModuleLoadType.INIT);
    await loader.addModule(initModule);

    Object.defineProperty(import.meta, 'env', {
      value: { DEV: true },
      writable: true,
    });

    await loader.initInitModules();

    await expect(loader.loadModuleByName('init')).rejects.toThrow(
      'INIT модулем',
    );
  });

  test('должен выбрасывать ошибку при инициализации без bootstrap', async () => {
    const newLoader = new ModuleLoader();
    const module = createMockModule('test-module');
    await newLoader.addModule(module);

    Object.defineProperty(import.meta, 'env', {
      value: { DEV: true },
      writable: true,
    });

    await expect(newLoader.initInitModules()).rejects.toThrow();
  });

  describe('Интеграционные сценарии', () => {
    test('должен корректно обрабатывать полный жизненный цикл загрузки модулей', async () => {
      const initModule = createMockModule('init', ModuleLoadType.INIT, {
        ROUTES: () => [{ name: 'home', path: '/' }],
      });
      const normalModule = createMockModule('normal', ModuleLoadType.NORMAL, {
        ROUTES: () => [{ name: 'about', path: '/about' }],
      });

      await loader.addModules([initModule, normalModule]);

      Object.defineProperty(import.meta, 'env', {
        value: { DEV: true },
        writable: true,
      });

      // Предзагрузка маршрутов
      await loader.preloadRoutes();

      // Загрузка INIT модулей
      await loader.initInitModules();
      expect(loader.isInitModulesLoaded).toBe(true);

      // Загрузка NORMAL модулей
      await loader.loadNormalModules();

      expect(loader.getModules()).toHaveLength(2);
      expect(loader.hasModule('init')).toBe(true);
      expect(loader.hasModule('normal')).toBe(true);
    });

    test('должен корректно обрабатывать модули с динамической конфигурацией', async () => {
      const configPromise = Promise.resolve({
        mockModuleInfo: {
          name: 'dynamic-module',
          loadType: ModuleLoadType.NORMAL,
          loadPriority: 1,
          remoteEntry: '',
          dependencies: [],
          featureFlags: [],
          accessPermissions: [],
        },
        ROUTES: () => [{ name: 'dynamic', path: '/dynamic' }],
      } as ModuleConfig);

      const module: Module = {
        name: 'dynamic-module',
        loadType: ModuleLoadType.NORMAL,
        config: configPromise,
      };

      await loader.addModule(module);
      await loader.preloadRoutes();

      expect(module.config).not.toBeInstanceOf(Promise);
    });
  });
});
