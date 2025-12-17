import { describe, test, expect, beforeEach, vi } from 'vitest';
import { ModuleStatusTracker } from '../ModuleStatusTracker';
import { type Module, ModuleLoadType } from '../../../../../modules/interface';
import { ModuleLoadStatus } from '../../types/status.types';
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

describe('ModuleStatusTracker', () => {
  let tracker: ModuleStatusTracker;

  const createMockModule = (name: string): Module => ({
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
    } as ModuleConfig,
  });

  beforeEach(() => {
    tracker = new ModuleStatusTracker();
  });

  describe('Установка статусов', () => {
    test('должен устанавливать статус LOADING', () => {
      const module = createMockModule('test-module');
      tracker.markAsLoading(module);

      expect(tracker.getStatus('test-module')).toBe(ModuleLoadStatus.LOADING);
      expect(tracker.isLoading('test-module')).toBe(true);
    });

    test('должен устанавливать статус PRELOADED', () => {
      const module = createMockModule('test-module');
      tracker.markAsPreloaded(module);

      expect(tracker.getStatus('test-module')).toBe(
        ModuleLoadStatus.PRELOADED,
      );
      expect(tracker.isPreloaded('test-module')).toBe(true);
    });

    test('должен устанавливать статус LOADED', () => {
      const module = createMockModule('test-module');
      tracker.markAsLoaded(module);

      expect(tracker.getStatus('test-module')).toBe(ModuleLoadStatus.LOADED);
      expect(tracker.isLoaded('test-module')).toBe(true);
    });

    test('должен устанавливать статус FAILED с ошибкой', () => {
      const module = createMockModule('test-module');
      const error = new Error('Test error');
      tracker.markAsFailed(module, error);

      expect(tracker.getStatus('test-module')).toBe(ModuleLoadStatus.FAILED);
      const info = tracker.getModuleInfo('test-module');
      expect(info?.error).toBe(error);
    });

    test('должен нормализовать не-Error ошибки', () => {
      const module = createMockModule('test-module');
      tracker.markAsFailed(module, 'String error');

      const info = tracker.getModuleInfo('test-module');
      expect(info?.error).toBeInstanceOf(Error);
      expect(info?.error?.message).toBe('String error');
    });

    test('должен обновлять статус модуля', () => {
      const module = createMockModule('test-module');
      tracker.markAsLoading(module);
      expect(tracker.getStatus('test-module')).toBe(ModuleLoadStatus.LOADING);

      tracker.markAsLoaded(module);
      expect(tracker.getStatus('test-module')).toBe(ModuleLoadStatus.LOADED);
    });
  });

  describe('Проверка статусов', () => {
    test('должен возвращать undefined для неотслеживаемого модуля', () => {
      expect(tracker.getStatus('non-existent')).toBeUndefined();
      expect(tracker.isLoaded('non-existent')).toBe(false);
      expect(tracker.isPreloaded('non-existent')).toBe(false);
      expect(tracker.isLoading('non-existent')).toBe(false);
    });

    test('должен корректно проверять isPreloadedOrLoaded', () => {
      const module1 = createMockModule('preloaded');
      const module2 = createMockModule('loaded');
      const module3 = createMockModule('pending');

      tracker.markAsPreloaded(module1);
      tracker.markAsLoaded(module2);

      expect(tracker.isPreloadedOrLoaded('preloaded')).toBe(true);
      expect(tracker.isPreloadedOrLoaded('loaded')).toBe(true);
      expect(tracker.isPreloadedOrLoaded('pending')).toBe(false);
    });

    test('должен корректно проверять isLoadedOrLoading', () => {
      const module1 = createMockModule('loading');
      const module2 = createMockModule('loaded');
      const module3 = createMockModule('pending');

      tracker.markAsLoading(module1);
      tracker.markAsLoaded(module2);

      expect(tracker.isLoadedOrLoading('loading')).toBe(true);
      expect(tracker.isLoadedOrLoading('loaded')).toBe(true);
      expect(tracker.isLoadedOrLoading('pending')).toBe(false);
    });

    test('должен возвращать информацию о модуле', () => {
      const module = createMockModule('test-module');
      tracker.markAsLoaded(module);

      const info = tracker.getModuleInfo('test-module');
      expect(info).toBeDefined();
      expect(info?.module).toBe(module);
      expect(info?.status).toBe(ModuleLoadStatus.LOADED);
      expect(info?.updatedAt).toBeTypeOf('number');
    });
  });

  describe('Управление Promise предзагрузки', () => {
    test('должен устанавливать Promise предзагрузки', () => {
      const promise = Promise.resolve();
      tracker.setPreloadingPromise('test-module', promise);

      expect(tracker.hasPreloadingPromise('test-module')).toBe(true);
      expect(tracker.getPreloadingPromise('test-module')).toBe(promise);
    });

    test('должен возвращать существующий Promise при getOrCreatePreloadingPromise', () => {
      const existingPromise = Promise.resolve();
      tracker.setPreloadingPromise('test-module', existingPromise);

      let factoryCalled = false;
      const newPromise = tracker.getOrCreatePreloadingPromise(
        'test-module',
        () => {
          factoryCalled = true;
          return Promise.resolve();
        },
      );

      expect(newPromise).toBe(existingPromise);
      expect(factoryCalled).toBe(false);
    });

    test('должен создавать новый Promise при getOrCreatePreloadingPromise, если его нет', () => {
      let factoryCalled = false;
      const newPromise = tracker.getOrCreatePreloadingPromise(
        'test-module',
        () => {
          factoryCalled = true;
          return Promise.resolve();
        },
      );

      expect(factoryCalled).toBe(true);
      expect(newPromise).toBeInstanceOf(Promise);
      expect(tracker.hasPreloadingPromise('test-module')).toBe(true);
    });

    test('должен удалять Promise предзагрузки', () => {
      const promise = Promise.resolve();
      tracker.setPreloadingPromise('test-module', promise);
      expect(tracker.hasPreloadingPromise('test-module')).toBe(true);

      tracker.removePreloadingPromise('test-module');
      expect(tracker.hasPreloadingPromise('test-module')).toBe(false);
    });

    test('должен ожидать завершения предзагрузки', async () => {
      let resolved = false;
      const promise = new Promise<void>((resolve) => {
        setTimeout(() => {
          resolved = true;
          resolve();
        }, 10);
      });

      tracker.setPreloadingPromise('test-module', promise);
      await tracker.waitForPreloading('test-module');

      expect(resolved).toBe(true);
    });

    test('должен игнорировать ошибки при ожидании предзагрузки', async () => {
      const promise = Promise.reject(new Error('Test error'));
      tracker.setPreloadingPromise('test-module', promise);

      await expect(tracker.waitForPreloading('test-module')).resolves.not.toThrow();
    });
  });

  describe('Подписка на события', () => {
    test('должен вызывать обработчик при изменении статуса', () => {
      const module = createMockModule('test-module');
      const handler = vi.fn();
      tracker.onStatusChange(handler);

      tracker.markAsLoaded(module);

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          moduleName: 'test-module',
          newStatus: ModuleLoadStatus.LOADED,
        }),
      );
    });

    test('должен вызывать несколько обработчиков', () => {
      const module = createMockModule('test-module');
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      tracker.onStatusChange(handler1);
      tracker.onStatusChange(handler2);

      tracker.markAsLoaded(module);

      expect(handler1).toHaveBeenCalledTimes(1);
      expect(handler2).toHaveBeenCalledTimes(1);
    });

    test('должен отписывать обработчик', () => {
      const module = createMockModule('test-module');
      const handler = vi.fn();
      const unsubscribe = tracker.onStatusChange(handler);

      tracker.markAsLoaded(module);
      expect(handler).toHaveBeenCalledTimes(1);

      unsubscribe();
      tracker.markAsPreloaded(module);
      expect(handler).toHaveBeenCalledTimes(1); // Не должен вызываться снова
    });

    test('должен передавать предыдущий статус в событии', () => {
      const module = createMockModule('test-module');
      const handler = vi.fn();
      tracker.onStatusChange(handler);

      tracker.markAsLoading(module);
      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          previousStatus: null,
          newStatus: ModuleLoadStatus.LOADING,
        }),
      );

      tracker.markAsLoaded(module);
      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          previousStatus: ModuleLoadStatus.LOADING,
          newStatus: ModuleLoadStatus.LOADED,
        }),
      );
    });

    test('должен обрабатывать ошибки в обработчиках', () => {
      const module = createMockModule('test-module');
      const errorHandler = vi.fn(() => {
        throw new Error('Handler error');
      });
      const normalHandler = vi.fn();

      tracker.onStatusChange(errorHandler);
      tracker.onStatusChange(normalHandler);

      tracker.markAsLoaded(module);

      // Оба обработчика должны быть вызваны, несмотря на ошибку в одном
      expect(errorHandler).toHaveBeenCalledTimes(1);
      expect(normalHandler).toHaveBeenCalledTimes(1);
    });
  });

  describe('Статистика и сводка', () => {
    test('должен возвращать сводку статусов', () => {
      const module1 = createMockModule('module1');
      const module2 = createMockModule('module2');
      const module3 = createMockModule('module3');
      const module4 = createMockModule('module4');

      tracker.markAsLoading(module1);
      tracker.markAsPreloaded(module2);
      tracker.markAsLoaded(module3);
      tracker.markAsFailed(module4, new Error('Failed'));

      const summary = tracker.getSummary();

      expect(summary.total).toBe(4);
      expect(summary.byStatus[ModuleLoadStatus.LOADING]).toBe(1);
      expect(summary.byStatus[ModuleLoadStatus.PRELOADED]).toBe(1);
      expect(summary.byStatus[ModuleLoadStatus.LOADED]).toBe(1);
      expect(summary.byStatus[ModuleLoadStatus.FAILED]).toBe(1);
      expect(summary.failedModules).toEqual(['module4']);
    });

    test('должен возвращать список отслеживаемых модулей', () => {
      const module1 = createMockModule('module1');
      const module2 = createMockModule('module2');

      tracker.markAsLoaded(module1);
      tracker.markAsLoaded(module2);

      const names = tracker.getTrackedModuleNames();
      expect(names).toHaveLength(2);
      expect(names).toContain('module1');
      expect(names).toContain('module2');
    });

    test('должен возвращать количество активных обработчиков', () => {
      expect(tracker.getActiveHandlersCount()).toBe(0);

      const handler1 = vi.fn();
      const handler2 = vi.fn();
      tracker.onStatusChange(handler1);
      tracker.onStatusChange(handler2);

      expect(tracker.getActiveHandlersCount()).toBe(2);

      const unsubscribe = tracker.onStatusChange(vi.fn());
      expect(tracker.getActiveHandlersCount()).toBe(3);

      unsubscribe();
      expect(tracker.getActiveHandlersCount()).toBe(2);
    });
  });

  describe('Очистка', () => {
    test('должен очищать информацию о модуле', () => {
      const module = createMockModule('test-module');
      tracker.markAsLoaded(module);
      tracker.setPreloadingPromise('test-module', Promise.resolve());

      expect(tracker.getStatus('test-module')).toBeDefined();
      expect(tracker.hasPreloadingPromise('test-module')).toBe(true);

      tracker.clear('test-module');

      expect(tracker.getStatus('test-module')).toBeUndefined();
      expect(tracker.hasPreloadingPromise('test-module')).toBe(false);
    });

    test('должен полностью очищать трекер', () => {
      const module1 = createMockModule('module1');
      const module2 = createMockModule('module2');
      const handler = vi.fn();

      tracker.markAsLoaded(module1);
      tracker.markAsLoaded(module2);
      tracker.setPreloadingPromise('module1', Promise.resolve());
      tracker.onStatusChange(handler);

      expect(tracker.getTrackedModuleNames()).toHaveLength(2);
      expect(tracker.getActiveHandlersCount()).toBe(1);

      tracker.clearAll();

      expect(tracker.getTrackedModuleNames()).toHaveLength(0);
      expect(tracker.getActiveHandlersCount()).toBe(0);
      expect(tracker.hasPreloadingPromise('module1')).toBe(false);
    });
  });

  test('должен возвращать undefined для Promise несуществующего модуля', () => {
      expect(tracker.getPreloadingPromise('non-existent')).toBeUndefined();
    });

  test('должен возвращать пустую сводку для пустого трекера', () => {
      const summary = tracker.getSummary();

      expect(summary.total).toBe(0);
      expect(summary.byStatus[ModuleLoadStatus.PENDING]).toBe(0);
      expect(summary.byStatus[ModuleLoadStatus.LOADING]).toBe(0);
      expect(summary.byStatus[ModuleLoadStatus.PRELOADED]).toBe(0);
      expect(summary.byStatus[ModuleLoadStatus.LOADED]).toBe(0);
      expect(summary.byStatus[ModuleLoadStatus.FAILED]).toBe(0);
      expect(summary.failedModules).toEqual([]);
    });

  test('должен корректно обрабатывать множественные отписки одного обработчика', () => {
      const module = createMockModule('test-module');
      const handler = vi.fn();
      const unsubscribe1 = tracker.onStatusChange(handler);
      const unsubscribe2 = tracker.onStatusChange(handler);

      tracker.markAsLoaded(module);
      expect(handler).toHaveBeenCalledTimes(2); // Обработчик добавлен дважды

      unsubscribe1();
      tracker.markAsPreloaded(module);
      expect(handler).toHaveBeenCalledTimes(3); // Один обработчик удален

      unsubscribe2();
      tracker.markAsLoading(module);
      expect(handler).toHaveBeenCalledTimes(3); // Оба обработчика удалены
    });

  describe('Интеграционные сценарии', () => {
    test('должен корректно отслеживать полный жизненный цикл модуля', () => {
      const module = createMockModule('test-module');
      const events: string[] = [];

      tracker.onStatusChange((event) => {
        events.push(`${event.moduleName}: ${event.previousStatus} -> ${event.newStatus}`);
      });

      tracker.markAsLoading(module);
      tracker.markAsPreloaded(module);
      tracker.markAsLoaded(module);

      expect(events).toEqual([
        'test-module: null -> loading',
        'test-module: loading -> preloaded',
        'test-module: preloaded -> loaded',
      ]);
    });

    test('должен синхронизировать параллельные операции предзагрузки', async () => {
      let factoryCallCount = 0;
      const factory = () => {
        factoryCallCount++;
        return Promise.resolve();
      };

      // Симулируем параллельные вызовы
      const promise1 = tracker.getOrCreatePreloadingPromise('test-module', factory);
      const promise2 = tracker.getOrCreatePreloadingPromise('test-module', factory);
      const promise3 = tracker.getOrCreatePreloadingPromise('test-module', factory);

      expect(promise1).toBe(promise2);
      expect(promise2).toBe(promise3);
      expect(factoryCallCount).toBe(1); // Factory должен быть вызван только один раз
    });
  });
});

