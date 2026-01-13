import { describe, test, expect, beforeEach, vi } from 'vitest';
import { LifecycleManager } from '../LifecycleManager';
import { ModuleRegistry } from '../../core/ModuleRegistry';
import { type Module, ModuleLoadType } from '../../../../../modules/interface';
import type { ModuleConfig } from '../../../../interface';
import type { Bootstrap } from '../../../../index';
import type { IRoutes } from '@platform/core';

// Мокаем logger для подавления вывода
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

describe('LifecycleManager', () => {
  let lifecycleManager: LifecycleManager;
  let registry: ModuleRegistry;
  let bootstrap: Bootstrap;
  let registerRoutesMock: ReturnType<typeof vi.fn>;

  const createMockModule = (
    name: string,
    config?: Partial<ModuleConfig>,
  ): Module => ({
    name,
    loadType: ModuleLoadType.NORMAL,
    config: {
      mockModuleInfo: {
        name,
        loadType: ModuleLoadType.NORMAL,
        loadPriority: 1,
        remoteEntry: '',
        dependencies: [],
        featureFlags: [],
        accessPermissions: [],
      },
      ...config,
    } as ModuleConfig,
  });

  const createMockBootstrap = (): {
    bootstrap: Bootstrap;
    registerRoutesMock: ReturnType<typeof vi.fn>;
  } => {
    const mockRegisterRoutes = vi.fn();
    const mockRouterService = {
      registerRoutes: mockRegisterRoutes,
    };

    const mockI18n = {
      addResourceBundle: vi.fn(),
    };

    return {
      bootstrap: {
        routerService: mockRouterService as any,
        i18n: mockI18n as any,
      } as Bootstrap,
      registerRoutesMock: mockRegisterRoutes,
    };
  };

  beforeEach(() => {
    registry = new ModuleRegistry();
    lifecycleManager = new LifecycleManager(registry);
    const mockBootstrap = createMockBootstrap();
    bootstrap = mockBootstrap.bootstrap;
    registerRoutesMock = mockBootstrap.registerRoutesMock;
  });

  describe('Инициализация модулей', () => {
    test('должен инициализировать модуль с onModuleInit', async () => {
      const onModuleInit = vi.fn();
      const module = createMockModule('test-module', {
        onModuleInit,
      });

      await lifecycleManager.initializeModule(module, bootstrap);

      expect(onModuleInit).toHaveBeenCalledTimes(1);
      expect(onModuleInit).toHaveBeenCalledWith(bootstrap);
      expect(lifecycleManager.isModuleInitialized('test-module')).toBe(true);
    });

    test('должен инициализировать модуль с асинхронным onModuleInit', async () => {
      const onModuleInit = vi.fn(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
      });
      const module = createMockModule('test-module', {
        onModuleInit,
      });

      await lifecycleManager.initializeModule(module, bootstrap);

      expect(onModuleInit).toHaveBeenCalledTimes(1);
      expect(lifecycleManager.isModuleInitialized('test-module')).toBe(true);
    });

    test('должен пропускать onModuleInit при skipOnModuleInit=true', async () => {
      const onModuleInit = vi.fn();
      const module = createMockModule('test-module', {
        onModuleInit,
      });

      await lifecycleManager.initializeModule(module, bootstrap, true);

      expect(onModuleInit).not.toHaveBeenCalled();
      expect(lifecycleManager.isModuleInitialized('test-module')).toBe(false);
    });

    test('должен инициализировать модуль без onModuleInit', async () => {
      const module = createMockModule('test-module');

      await expect(
        lifecycleManager.initializeModule(module, bootstrap),
      ).resolves.not.toThrow();
      expect(lifecycleManager.isModuleInitialized('test-module')).toBe(false);
    });

    test('должен загружать динамическую конфигурацию перед инициализацией', async () => {
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
        onModuleInit: vi.fn(),
      } as ModuleConfig);

      const module: Module = {
        name: 'dynamic-module',
        loadType: ModuleLoadType.NORMAL,
        config: configPromise,
      };

      await lifecycleManager.initializeModule(module, bootstrap);

      expect(module.config).not.toBeInstanceOf(Promise);
      expect(lifecycleManager.isModuleInitialized('dynamic-module')).toBe(true);
    });

    test('не должен вызывать onModuleInit дважды для одного модуля', async () => {
      const onModuleInit = vi.fn();
      const module = createMockModule('test-module', {
        onModuleInit,
      });

      await lifecycleManager.initializeModule(module, bootstrap);
      await lifecycleManager.initializeModule(module, bootstrap);

      expect(onModuleInit).toHaveBeenCalledTimes(1);
    });
  });

  describe('Регистрация маршрутов', () => {
    test('должен регистрировать маршруты модуля', async () => {
      const routes: IRoutes = [
        { name: 'home', path: '/' },
        { name: 'about', path: '/about' },
      ];
      const module = createMockModule('test-module', {
        ROUTES: () => routes,
      });

      await registry.addModule(module);
      await lifecycleManager.registerModuleRoutes(module, bootstrap);

      expect(bootstrap.routerService.registerRoutes).toHaveBeenCalledWith(
        routes,
      );
    });

    test('должен обрабатывать модуль без маршрутов', async () => {
      const module = createMockModule('test-module');

      await registry.addModule(module);
      await lifecycleManager.registerModuleRoutes(module, bootstrap);

      expect(bootstrap.routerService.registerRoutes).not.toHaveBeenCalled();
    });

    test('должен оборачивать маршруты с автозагрузкой для динамических модулей', async () => {
      const routes: IRoutes = [{ name: 'test', path: '/test' }];
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
        ROUTES: () => routes,
      } as ModuleConfig);

      const module: Module = {
        name: 'dynamic-module',
        loadType: ModuleLoadType.NORMAL,
        config: configPromise,
      };

      const autoLoadHandler = vi.fn();
      await registry.addModule(module);
      // НЕ загружаем конфигурацию заранее, так как registerModuleRoutes
      // проверяет module.config instanceof Promise до загрузки
      await lifecycleManager.registerModuleRoutes(
        module,
        bootstrap,
        autoLoadHandler,
      );

      const registeredRoutes = registerRoutesMock.mock.calls[0][0] as IRoutes;
      expect(registeredRoutes).toHaveLength(1);
      expect(registeredRoutes[0].onEnterNode).toBeDefined();
    });
  });

  describe('Регистрация i18n', () => {
    test('должен регистрировать i18n ресурсы модуля', async () => {
      const I18N = vi.fn();
      const module = createMockModule('test-module', {
        I18N,
      });

      await registry.addModule(module);
      await lifecycleManager.registerModuleI18n(module, bootstrap, () => false);

      expect(I18N).toHaveBeenCalledTimes(1);
      expect(I18N).toHaveBeenCalledWith(bootstrap.i18n);
    });

    test('должен пропускать регистрацию i18n для уже загруженного модуля', async () => {
      const I18N = vi.fn();
      const module = createMockModule('test-module', {
        I18N,
      });

      await registry.addModule(module);
      await lifecycleManager.registerModuleI18n(module, bootstrap, () => true);

      expect(I18N).not.toHaveBeenCalled();
    });

    test('должен обрабатывать модуль без I18N', async () => {
      const module = createMockModule('test-module');

      await registry.addModule(module);
      await expect(
        lifecycleManager.registerModuleI18n(module, bootstrap, () => false),
      ).resolves.not.toThrow();
    });
  });

  describe('Регистрация всех ресурсов', () => {
    test('должен регистрировать все ресурсы модуля', async () => {
      const routes: IRoutes = [{ name: 'home', path: '/' }];
      const I18N = vi.fn();
      const module = createMockModule('test-module', {
        ROUTES: () => routes,
        I18N,
      });

      await registry.addModule(module);
      await lifecycleManager.registerModuleResources(
        module,
        bootstrap,
        () => false,
      );

      expect(bootstrap.routerService.registerRoutes).toHaveBeenCalled();
      expect(I18N).toHaveBeenCalled();
    });
  });

  test('должен выбрасывать ошибку при ошибке в onModuleInit', async () => {
    const error = new Error('Init error');
    const onModuleInit = vi.fn(() => {
      throw error;
    });
    const module = createMockModule('test-module', {
      onModuleInit,
    });

    await expect(
      lifecycleManager.initializeModule(module, bootstrap),
    ).rejects.toThrow('Init error');
    expect(lifecycleManager.isModuleInitialized('test-module')).toBe(false);
  });

  test('должен обрабатывать ошибку загрузки динамической конфигурации gracefully', async () => {
    const error = new Error('Config load error');
    const configPromise = Promise.reject(error);

    const module: Module = {
      name: 'error-module',
      loadType: ModuleLoadType.NORMAL,
      config: configPromise,
    };

    // Метод должен успешно завершиться без ошибки
    await expect(
      lifecycleManager.initializeModule(module, bootstrap),
    ).resolves.not.toThrow();

    // Модуль не должен быть инициализирован при ошибке загрузки конфигурации
    expect(lifecycleManager.isModuleInitialized('error-module')).toBe(false);
  });

  test('должен выбрасывать ошибку при отсутствии i18n', async () => {
    const I18N = vi.fn();
    const module = createMockModule('test-module', {
      I18N,
    });

    const bootstrapWithoutI18n = {
      ...bootstrap,
      i18n: null,
    } as any;

    await registry.addModule(module);
    await expect(
      lifecycleManager.registerModuleI18n(
        module,
        bootstrapWithoutI18n,
        () => false,
      ),
    ).rejects.toThrow('bootstrap.i18n не определен');
  });

  test('должен выбрасывать ошибку при отсутствии метода addResourceBundle', async () => {
    const I18N = vi.fn();
    const module = createMockModule('test-module', {
      I18N,
    });

    const bootstrapWithInvalidI18n = {
      ...bootstrap,
      i18n: {},
    } as any;

    await registry.addModule(module);
    await expect(
      lifecycleManager.registerModuleI18n(
        module,
        bootstrapWithInvalidI18n,
        () => false,
      ),
    ).rejects.toThrow('addResourceBundle');
  });

  describe('Интеграционные сценарии', () => {
    test('должен корректно обрабатывать полный жизненный цикл модуля', async () => {
      const routes: IRoutes = [{ name: 'home', path: '/' }];
      const I18N = vi.fn();
      const onModuleInit = vi.fn();
      const module = createMockModule('test-module', {
        ROUTES: () => routes,
        I18N,
        onModuleInit,
      });

      await registry.addModule(module);

      // Инициализация
      await lifecycleManager.initializeModule(module, bootstrap);
      expect(onModuleInit).toHaveBeenCalled();
      expect(lifecycleManager.isModuleInitialized('test-module')).toBe(true);

      // Регистрация ресурсов
      await lifecycleManager.registerModuleResources(
        module,
        bootstrap,
        () => false,
      );
      expect(bootstrap.routerService.registerRoutes).toHaveBeenCalled();
      expect(I18N).toHaveBeenCalled();
    });

    test('должен корректно обрабатывать автозагрузку при переходе по маршруту', async () => {
      const routes: IRoutes = [{ name: 'test', path: '/test' }];
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
        ROUTES: () => routes,
      } as ModuleConfig);

      const module: Module = {
        name: 'dynamic-module',
        loadType: ModuleLoadType.NORMAL,
        config: configPromise,
      };

      const autoLoadHandler = vi.fn();
      await registry.addModule(module);
      // НЕ загружаем конфигурацию заранее, так как registerModuleRoutes
      // проверяет module.config instanceof Promise до загрузки
      await lifecycleManager.registerModuleRoutes(
        module,
        bootstrap,
        autoLoadHandler,
      );

      const registeredRoutes = registerRoutesMock.mock.calls[0][0] as IRoutes;
      const wrappedRoute = registeredRoutes[0];

      // Симулируем переход по маршруту
      await wrappedRoute.onEnterNode?.(
        { name: 'test' } as any,
        null,
        {} as any,
      );

      expect(autoLoadHandler).toHaveBeenCalledWith('test');
    });
  });
});
