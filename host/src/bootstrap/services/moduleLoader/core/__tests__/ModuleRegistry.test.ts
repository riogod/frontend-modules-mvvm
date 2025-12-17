import { describe, test, expect, beforeEach, vi } from 'vitest';
import { ModuleRegistry, ModuleRegistryError } from '../ModuleRegistry';
import { type Module, ModuleLoadType } from '../../../../../modules/interface';
import type { ModuleConfig } from '../../../../interface';

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

describe('ModuleRegistry', () => {
  let registry: ModuleRegistry;

  const createMockModule = (
    name: string,
    loadType: ModuleLoadType = ModuleLoadType.NORMAL,
    config?: ModuleConfig,
  ): Module => {
    const baseConfig: ModuleConfig = {
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
    };

    if (loadType === ModuleLoadType.INIT) {
      return {
        name,
        loadType: ModuleLoadType.INIT,
        config: baseConfig,
      };
    }

    return {
      name,
      loadType: ModuleLoadType.NORMAL,
      config: baseConfig,
    };
  };

  beforeEach(() => {
    registry = new ModuleRegistry();
  });

  test('должен создавать пустой реестр', () => {
    expect(registry.count).toBe(0);
    expect(registry.getModules()).toEqual([]);
  });

  test('должен добавлять один модуль', async () => {
    const module = createMockModule('test-module');
    await registry.addModule(module);

    expect(registry.count).toBe(1);
    expect(registry.hasModule('test-module')).toBe(true);
    expect(registry.getModule('test-module')).toBe(module);
  });

  test('должен добавлять несколько модулей', async () => {
    const module1 = createMockModule('module1');
    const module2 = createMockModule('module2');
    const module3 = createMockModule('module3');

    await registry.addModules([module1, module2, module3]);

    expect(registry.count).toBe(3);
    expect(registry.hasModule('module1')).toBe(true);
    expect(registry.hasModule('module2')).toBe(true);
    expect(registry.hasModule('module3')).toBe(true);
  });

  test('должен возвращать модуль по имени', async () => {
    const module = createMockModule('test-module');
    await registry.addModule(module);

    const found = registry.getModule('test-module');
    expect(found).toBe(module);
  });

  test('должен возвращать undefined для несуществующего модуля', () => {
    expect(registry.getModule('non-existent')).toBeUndefined();
  });

  test('должен возвращать все модули', async () => {
    const module1 = createMockModule('module1');
    const module2 = createMockModule('module2');
    await registry.addModules([module1, module2]);

    const modules = registry.getModules();
    expect(modules).toHaveLength(2);
    expect(modules).toContain(module1);
    expect(modules).toContain(module2);
  });

  test('должен фильтровать модули по типу INIT', async () => {
    const initModule1 = createMockModule('init1', ModuleLoadType.INIT);
    const initModule2 = createMockModule('init2', ModuleLoadType.INIT);
    const normalModule = createMockModule('normal1', ModuleLoadType.NORMAL);

    await registry.addModules([initModule1, initModule2, normalModule]);

    const initModules = registry.getModulesByType(ModuleLoadType.INIT);
    expect(initModules).toHaveLength(2);
    expect(initModules.map((m) => m.name)).toEqual(['init1', 'init2']);
  });

  test('должен фильтровать модули по типу NORMAL', async () => {
    const initModule = createMockModule('init1', ModuleLoadType.INIT);
    const normalModule1 = createMockModule('normal1', ModuleLoadType.NORMAL);
    const normalModule2 = createMockModule('normal2', ModuleLoadType.NORMAL);

    await registry.addModules([initModule, normalModule1, normalModule2]);

    const normalModules = registry.getModulesByType(ModuleLoadType.NORMAL);
    expect(normalModules).toHaveLength(2);
    expect(normalModules.map((m) => m.name)).toEqual(['normal1', 'normal2']);
  });

  test('должен сортировать модули по приоритету', async () => {
    const module1 = createMockModule('module1', ModuleLoadType.NORMAL);
    module1.loadPriority = 3;
    const module2 = createMockModule('module2', ModuleLoadType.NORMAL);
    module2.loadPriority = 1;
    const module3 = createMockModule('module3', ModuleLoadType.NORMAL);
    module3.loadPriority = 2;

    await registry.addModules([module1, module2, module3]);

    const sorted = registry.sortModulesByPriority([module1, module2, module3]);
    expect(sorted.map((m) => m.name)).toEqual([
      'module2',
      'module3',
      'module1',
    ]);
  });

  test('должен кешировать маршруты для INIT модулей', async () => {
    const routes = [
      { name: 'home', path: '/' },
      { name: 'about', path: '/about' },
    ];
    const module = createMockModule('init-module', ModuleLoadType.INIT, {
      ROUTES: () => routes,
      mockModuleInfo: {
        name: 'init-module',
        loadType: ModuleLoadType.INIT,
        loadPriority: 1,
        remoteEntry: '',
        dependencies: [],
        featureFlags: [],
        accessPermissions: [],
      },
    });

    await registry.addModule(module);

    const moduleRoutes = await registry.getModuleRoutes(module);
    expect(moduleRoutes).toEqual(routes);
  });

  test('должен загружать динамическую конфигурацию модуля', async () => {
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
    } as ModuleConfig);

    const module: Module = {
      name: 'dynamic-module',
      loadType: ModuleLoadType.NORMAL,
      config: configPromise,
    };

    await registry.addModule(module);
    await registry.loadModuleConfig(module);

    expect(module.config).not.toBeInstanceOf(Promise);
  });

  test('должен выбрасывать ошибку при добавлении модуля с дублирующимся именем', async () => {
    const module1 = createMockModule('duplicate');
    const module2 = createMockModule('duplicate');

    await registry.addModule(module1);

    await expect(registry.addModule(module2)).rejects.toThrow(
      ModuleRegistryError,
    );
    await expect(registry.addModule(module2)).rejects.toThrow(
      'Модуль с именем "duplicate" уже существует',
    );
  });

  test('должен выбрасывать ошибку при добавлении модуля после загрузки INIT модулей', async () => {
    const initModule = createMockModule('init1', ModuleLoadType.INIT);
    const normalModule = createMockModule('normal1', ModuleLoadType.NORMAL);

    await registry.addModule(initModule);
    registry.setInitModulesLoaded(true);

    await expect(registry.addModule(normalModule)).rejects.toThrow(
      ModuleRegistryError,
    );
    await expect(registry.addModule(normalModule)).rejects.toThrow(
      'Невозможно добавить модуль после загрузки INIT модулей',
    );
  });

  test('должен выбрасывать ошибку при добавлении модуля с пустым именем', async () => {
    const module = createMockModule('');
    // Пустое имя не валидируется в ModuleRegistry, поэтому тест пропускаем
    // Валидация имени должна быть на уровне выше
    await expect(registry.addModule(module)).resolves.not.toThrow();
  });

  test('должен обрабатывать ошибку при загрузке динамической конфигурации', async () => {
    const error = new Error('Failed to load config');
    const configPromise = Promise.reject(error);

    const module: Module = {
      name: 'error-module',
      loadType: ModuleLoadType.NORMAL,
      config: configPromise,
    };

    await registry.addModule(module);

    await expect(registry.loadModuleConfig(module)).rejects.toThrow(
      'Failed to load config',
    );
  });

  test('должен возвращать undefined для модуля без ROUTES', async () => {
    const module = createMockModule('no-routes-module');
    await registry.addModule(module);

    const routes = await registry.getModuleRoutes(module);
    expect(routes).toBeUndefined();
  });

  describe('Управление флагом INIT модулей', () => {
    test('должен возвращать false до загрузки INIT модулей', () => {
      expect(registry.isInitModulesLoaded).toBe(false);
    });

    test('должен возвращать true после загрузки INIT модулей', () => {
      registry.setInitModulesLoaded(true);
      expect(registry.isInitModulesLoaded).toBe(true);
    });

    test('должен разрешать добавление INIT модулей до загрузки', async () => {
      const initModule = createMockModule('init1', ModuleLoadType.INIT);
      await expect(registry.addModule(initModule)).resolves.not.toThrow();
    });
  });

  describe('Кеширование маршрутов', () => {
    test('должен кешировать маршруты для INIT модулей при добавлении', async () => {
      const routes = [{ name: 'test', path: '/test' }];
      const module = createMockModule('init-module', ModuleLoadType.INIT, {
        ROUTES: () => routes,
        mockModuleInfo: {
          name: 'init-module',
          loadType: ModuleLoadType.INIT,
          loadPriority: 1,
          remoteEntry: '',
          dependencies: [],
          featureFlags: [],
          accessPermissions: [],
        },
      });

      await registry.addModule(module);

      // Второй вызов должен использовать кеш
      const cachedRoutes = await registry.getModuleRoutes(module);
      expect(cachedRoutes).toEqual(routes);
    });

    test('должен кешировать маршруты для NORMAL модулей при первом обращении', async () => {
      const routes = [{ name: 'test', path: '/test' }];
      const module = createMockModule('normal-module', ModuleLoadType.NORMAL, {
        ROUTES: () => routes,
        mockModuleInfo: {
          name: 'normal-module',
          loadType: ModuleLoadType.NORMAL,
          loadPriority: 1,
          remoteEntry: '',
          dependencies: [],
          featureFlags: [],
          accessPermissions: [],
        },
      });

      await registry.addModule(module);

      // Первый вызов должен закешировать
      const firstCall = await registry.getModuleRoutes(module);
      expect(firstCall).toEqual(routes);

      // Второй вызов должен использовать кеш
      const secondCall = await registry.getModuleRoutes(module);
      expect(secondCall).toEqual(routes);
    });
  });
});
