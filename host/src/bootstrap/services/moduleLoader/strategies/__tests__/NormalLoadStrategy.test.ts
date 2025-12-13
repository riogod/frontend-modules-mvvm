import { describe, test, expect, beforeEach, vi } from 'vitest';
import { NormalLoadStrategy } from '../NormalLoadStrategy';
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
  loadNormalModulesDev: vi.fn(),
}));

vi.mock('../../prod', () => ({
  loadNormalModulesProd: vi.fn(),
}));

describe('NormalLoadStrategy', () => {
  let strategy: NormalLoadStrategy;
  let registry: ModuleRegistry;
  let statusTracker: ModuleStatusTracker;
  let lifecycleManager: LifecycleManager;
  let bootstrap: Bootstrap;
  let autoLoadHandler: (routeName: string) => Promise<void>;

  const createMockModule = (
    name: string,
    loadType?: ModuleLoadType,
  ): Module => ({
    name,
    loadType: loadType ?? ModuleLoadType.NORMAL,
    config: {
      mockModuleInfo: {
        name,
        loadType: loadType ?? ModuleLoadType.NORMAL,
        loadPriority: 1,
        remoteEntry: '',
        dependencies: [],
        featureFlags: [],
        accessPermissions: [],
      },
    } as ModuleConfig,
  });

  const createMockBootstrap = (): Bootstrap => ({
    routerService: {} as any,
    i18n: {} as any,
  } as Bootstrap);

  beforeEach(() => {
    registry = new ModuleRegistry();
    statusTracker = new ModuleStatusTracker();
    lifecycleManager = new LifecycleManager(registry);
    bootstrap = createMockBootstrap();
    autoLoadHandler = vi.fn().mockResolvedValue(undefined);

    strategy = new NormalLoadStrategy(
      registry,
      statusTracker,
      lifecycleManager,
      autoLoadHandler,
    );

    vi.clearAllMocks();
  });

  test('должен проверять, что модуль является NORMAL модулем', () => {
      const normalModule = createMockModule('normal-module');
      const initModule = createMockModule('init-module', ModuleLoadType.INIT);

      expect(strategy.isApplicable(normalModule)).toBe(true);
      expect(strategy.isApplicable(initModule)).toBe(false);
    });

    test('должен считать модуль NORMAL, если loadType не указан', () => {
      const module: Module = {
        name: 'default-module',
        config: {
          mockModuleInfo: {
            name: 'default-module',
            loadType: ModuleLoadType.NORMAL,
            loadPriority: 1,
            remoteEntry: '',
            dependencies: [],
            featureFlags: [],
            accessPermissions: [],
          },
        } as ModuleConfig,
      };

      expect(strategy.isApplicable(module)).toBe(true);
    });

    test('должен фильтровать только NORMAL модули', async () => {
      const normalModule1 = createMockModule('normal1');
      const normalModule2 = createMockModule('normal2');
      const initModule = createMockModule('init', ModuleLoadType.INIT);

      registry.setInitModulesLoaded(true);

      const { loadNormalModulesDev } = await import('../../dev');

      Object.defineProperty(import.meta, 'env', {
        value: { DEV: true },
        writable: true,
      });

      await strategy.loadModules(
        [normalModule1, normalModule2, initModule],
        bootstrap,
      );

      expect(loadNormalModulesDev).toHaveBeenCalledWith(
        [normalModule1, normalModule2],
        expect.objectContaining({
          registry,
          statusTracker,
          lifecycleManager,
          bootstrap,
          autoLoadHandler,
        }),
      );
    });

    test('должен сортировать модули по приоритету', async () => {
      const module1 = createMockModule('module1');
      module1.loadPriority = 3;
      const module2 = createMockModule('module2');
      module2.loadPriority = 1;
      const module3 = createMockModule('module3');
      module3.loadPriority = 2;

      registry.setInitModulesLoaded(true);

      const { loadNormalModulesDev } = await import('../../dev');

      Object.defineProperty(import.meta, 'env', {
        value: { DEV: true },
        writable: true,
      });

      await strategy.loadModules([module1, module2, module3], bootstrap);

      const sortedModules = loadNormalModulesDev.mock.calls[0][0];
      expect(sortedModules.map((m: Module) => m.name)).toEqual([
        'module2',
        'module3',
        'module1',
      ]);
    });

  test('должен выбрасывать ошибку, если INIT модули не загружены', async () => {
      const module = createMockModule('normal-module');

      await expect(strategy.loadModules([module], bootstrap)).rejects.toThrow(
        'INIT модули должны быть загружены первыми',
      );
    });

    test('должен обрабатывать пустой массив модулей', async () => {
      registry.setInitModulesLoaded(true);

      const { loadNormalModulesDev } = await import('../../dev');

      Object.defineProperty(import.meta, 'env', {
        value: { DEV: true },
        writable: true,
      });

      await expect(strategy.loadModules([], bootstrap)).resolves.not.toThrow();
      expect(loadNormalModulesDev).toHaveBeenCalledWith(
        [],
        expect.any(Object),
      );
    });

  describe('Интеграционные сценарии', () => {
    test('должен использовать prod загрузчик в production режиме', async () => {
      registry.setInitModulesLoaded(true);

      const prodModule = await import('../../prod');
      const loadNormalModulesProd = vi.mocked(prodModule.loadNormalModulesProd);

      // Используем vi.stubEnv для изменения окружения
      const originalEnv = import.meta.env.DEV;
      vi.stubEnv('DEV', false);
      // Также нужно изменить import.meta.env напрямую
      Object.defineProperty(import.meta, 'env', {
        value: { ...import.meta.env, DEV: false },
        writable: true,
        configurable: true,
      });

      const module = createMockModule('normal-module');
      await strategy.loadModules([module], bootstrap);

      expect(loadNormalModulesProd).toHaveBeenCalledWith(
        [[module]],
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

