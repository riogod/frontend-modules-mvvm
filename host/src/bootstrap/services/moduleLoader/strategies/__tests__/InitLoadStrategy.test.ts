import { describe, test, expect, beforeEach, vi } from 'vitest';
import { InitLoadStrategy } from '../InitLoadStrategy';
import { ModuleRegistry } from '../../core/ModuleRegistry';
import { ModuleStatusTracker } from '../../core/ModuleStatusTracker';
import { LifecycleManager } from '../../services/LifecycleManager';
import { type Module, ModuleLoadType } from '../../../../../modules/interface';
import type { Bootstrap } from '../../../../index';
import type { ModuleConfig } from '../../../../interface';

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
vi.mock('../../dev', () => ({
  loadInitModulesDev: vi.fn(),
}));

vi.mock('../../prod', () => ({
  loadInitModulesProd: vi.fn(),
}));

describe('InitLoadStrategy', () => {
  let strategy: InitLoadStrategy;
  let registry: ModuleRegistry;
  let statusTracker: ModuleStatusTracker;
  let lifecycleManager: LifecycleManager;
  let bootstrap: Bootstrap;

  const createMockModule = (
    name: string,
    loadType: ModuleLoadType = ModuleLoadType.INIT,
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
    } as ModuleConfig,
  });

  const createMockBootstrap = (): Bootstrap =>
    ({
      routerService: {} as any,
      i18n: {} as any,
    }) as Bootstrap;

  beforeEach(() => {
    registry = new ModuleRegistry();
    statusTracker = new ModuleStatusTracker();
    lifecycleManager = new LifecycleManager(registry);
    bootstrap = createMockBootstrap();
    strategy = new InitLoadStrategy(registry, statusTracker, lifecycleManager);

    vi.clearAllMocks();
  });

  test('должен проверять, что модуль является INIT модулем', () => {
    const initModule = createMockModule('init-module', ModuleLoadType.INIT);
    const normalModule = createMockModule(
      'normal-module',
      ModuleLoadType.NORMAL,
    );

    expect(strategy.isApplicable(initModule)).toBe(true);
    expect(strategy.isApplicable(normalModule)).toBe(false);
  });

  test('должен фильтровать только INIT модули', async () => {
    const initModule1 = createMockModule('init1', ModuleLoadType.INIT);
    const initModule2 = createMockModule('init2', ModuleLoadType.INIT);
    const normalModule = createMockModule('normal', ModuleLoadType.NORMAL);

    const devModule = await import('../../dev');
    const loadInitModulesDev = vi.mocked(devModule.loadInitModulesDev);

    // Мокаем окружение как DEV
    Object.defineProperty(import.meta, 'env', {
      value: { DEV: true },
      writable: true,
    });

    await strategy.loadModules(
      [initModule1, initModule2, normalModule],
      bootstrap,
    );

    // В DEV режиме должен вызываться loadInitModulesDev
    expect(loadInitModulesDev).toHaveBeenCalledWith(
      [initModule1, initModule2],
      expect.objectContaining({
        registry,
        statusTracker,
        lifecycleManager,
        bootstrap,
      }),
    );
  });

  test('должен сортировать модули по приоритету', async () => {
    const module1 = createMockModule('module1', ModuleLoadType.INIT);
    module1.loadPriority = 3;
    const module2 = createMockModule('module2', ModuleLoadType.INIT);
    module2.loadPriority = 1;
    const module3 = createMockModule('module3', ModuleLoadType.INIT);
    module3.loadPriority = 2;

    const devModule = await import('../../dev');
    const loadInitModulesDev = vi.mocked(devModule.loadInitModulesDev);

    Object.defineProperty(import.meta, 'env', {
      value: { DEV: true },
      writable: true,
    });

    await strategy.loadModules([module1, module2, module3], bootstrap);

    const sortedModules = loadInitModulesDev.mock.calls[0][0];
    expect(sortedModules.map((m: Module) => m.name)).toEqual([
      'module2',
      'module3',
      'module1',
    ]);
  });

  test('должен выбрасывать ошибку, если INIT модули уже загружены', async () => {
    registry.setInitModulesLoaded(true);

    const module = createMockModule('init-module', ModuleLoadType.INIT);

    await expect(strategy.loadModules([module], bootstrap)).rejects.toThrow(
      'INIT модули уже загружены',
    );
  });

  test('должен обрабатывать пустой массив модулей', async () => {
    const devModule = await import('../../dev');
    const loadInitModulesDev = vi.mocked(devModule.loadInitModulesDev);

    Object.defineProperty(import.meta, 'env', {
      value: { DEV: true },
      writable: true,
    });

    await expect(strategy.loadModules([], bootstrap)).resolves.not.toThrow();
    expect(loadInitModulesDev).toHaveBeenCalledWith([], expect.any(Object));
  });

  describe('Интеграционные сценарии', () => {
    test('должен использовать prod загрузчик в production режиме', async () => {
      const prodModule = await import('../../prod');
      const loadInitModulesProd = vi.mocked(prodModule.loadInitModulesProd);

      // Используем vi.stubEnv для изменения окружения
      const originalEnv = import.meta.env.DEV;
      vi.stubEnv('DEV', false);
      // Также нужно изменить import.meta.env напрямую
      Object.defineProperty(import.meta, 'env', {
        value: { ...import.meta.env, DEV: false },
        writable: true,
        configurable: true,
      });

      const module = createMockModule('init-module', ModuleLoadType.INIT);
      await strategy.loadModules([module], bootstrap);

      expect(loadInitModulesProd).toHaveBeenCalledWith(
        [module],
        expect.objectContaining({
          registry,
          statusTracker,
          lifecycleManager,
          bootstrap,
        }),
      );

      // Восстанавливаем окружение
      Object.defineProperty(import.meta, 'env', {
        value: { ...import.meta.env, DEV: originalEnv },
        writable: true,
        configurable: true,
      });
    });
  });
});
