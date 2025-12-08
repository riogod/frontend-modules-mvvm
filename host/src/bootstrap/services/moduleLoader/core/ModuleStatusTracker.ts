/**
 * Трекер статусов модулей.
 *
 * Отвечает за:
 * - Хранение и управление статусами загрузки модулей
 * - Синхронизацию параллельных операций через Promise-механизм
 * - Предоставление информации о текущем состоянии модулей
 *
 * @module core/ModuleStatusTracker
 */

import { log } from '@platform/core';
import type { Module } from '../../../../modules/interface';
import {
  ModuleLoadStatus,
  type LoadedModule,
  type ModuleStatusSummary,
  type StatusChangeHandler,
  type ModuleStatusChangeEvent,
} from '../types/status.types';

/** Префикс для логирования */
const LOG_PREFIX = 'moduleLoader.statusTracker';

/**
 * Класс для отслеживания статусов загрузки модулей.
 *
 * Реализует паттерн Observer для уведомления об изменениях статусов.
 * Обеспечивает потокобезопасность через Map с Promise для параллельных операций.
 */
export class ModuleStatusTracker {
  /** Хранилище информации о загруженных модулях */
  private readonly loadedModules = new Map<string, LoadedModule>();

  /** Хранилище Promise для синхронизации параллельных операций предзагрузки */
  private readonly preloadingPromises = new Map<string, Promise<void>>();

  /** Обработчики изменения статусов */
  private readonly statusChangeHandlers: StatusChangeHandler[] = [];

  constructor() {
    log.debug('ModuleStatusTracker: инициализация', { prefix: LOG_PREFIX });
  }

  // ============================================
  // Публичные методы: Установка статусов
  // ============================================

  /**
   * Устанавливает статус "загружается" для модуля.
   *
   * @param module - Модуль для обновления статуса
   */
  public markAsLoading(module: Module): void {
    this.setStatus(module, ModuleLoadStatus.LOADING);
    log.debug(`Модуль "${module.name}" помечен как загружающийся`, {
      prefix: LOG_PREFIX,
    });
  }

  /**
   * Устанавливает статус "предзагружен" для модуля.
   *
   * @param module - Модуль для обновления статуса
   */
  public markAsPreloaded(module: Module): void {
    this.setStatus(module, ModuleLoadStatus.PRELOADED);
    log.debug(`Модуль "${module.name}" помечен как предзагруженный`, {
      prefix: LOG_PREFIX,
    });
  }

  /**
   * Устанавливает статус "загружен" для модуля.
   *
   * @param module - Модуль для обновления статуса
   */
  public markAsLoaded(module: Module): void {
    this.setStatus(module, ModuleLoadStatus.LOADED);
    log.debug(`Модуль "${module.name}" помечен как загруженный`, {
      prefix: LOG_PREFIX,
    });
  }

  /**
   * Устанавливает статус "ошибка" для модуля.
   *
   * @param module - Модуль для обновления статуса
   * @param error - Ошибка загрузки
   */
  public markAsFailed(module: Module, error: unknown): void {
    const normalizedError =
      error instanceof Error ? error : new Error(String(error));

    this.setStatus(module, ModuleLoadStatus.FAILED, normalizedError);

    log.error(`Модуль "${module.name}" помечен как неудавшийся`, {
      prefix: LOG_PREFIX,
      error: normalizedError.message,
    });
  }

  // ============================================
  // Публичные методы: Проверка статусов
  // ============================================

  /**
   * Проверяет, загружен ли модуль полностью.
   *
   * @param moduleName - Имя модуля
   * @returns true, если модуль полностью загружен
   */
  public isLoaded(moduleName: string): boolean {
    return this.getStatus(moduleName) === ModuleLoadStatus.LOADED;
  }

  /**
   * Проверяет, предзагружен ли модуль.
   *
   * @param moduleName - Имя модуля
   * @returns true, если модуль предзагружен
   */
  public isPreloaded(moduleName: string): boolean {
    return this.getStatus(moduleName) === ModuleLoadStatus.PRELOADED;
  }

  /**
   * Проверяет, предзагружен или загружен ли модуль.
   *
   * @param moduleName - Имя модуля
   * @returns true, если модуль предзагружен или загружен
   */
  public isPreloadedOrLoaded(moduleName: string): boolean {
    const status = this.getStatus(moduleName);
    return (
      status === ModuleLoadStatus.PRELOADED ||
      status === ModuleLoadStatus.LOADED
    );
  }

  /**
   * Проверяет, загружается ли модуль в данный момент.
   *
   * @param moduleName - Имя модуля
   * @returns true, если модуль в процессе загрузки
   */
  public isLoading(moduleName: string): boolean {
    return this.getStatus(moduleName) === ModuleLoadStatus.LOADING;
  }

  /**
   * Проверяет, загружен ли модуль или загружается.
   *
   * @param moduleName - Имя модуля
   * @returns true, если модуль загружен или загружается
   */
  public isLoadedOrLoading(moduleName: string): boolean {
    const status = this.getStatus(moduleName);
    return (
      status === ModuleLoadStatus.LOADED || status === ModuleLoadStatus.LOADING
    );
  }

  /**
   * Возвращает текущий статус модуля.
   *
   * @param moduleName - Имя модуля
   * @returns Статус модуля или undefined, если модуль не отслеживается
   */
  public getStatus(moduleName: string): ModuleLoadStatus | undefined {
    return this.loadedModules.get(moduleName)?.status;
  }

  /**
   * Возвращает информацию о загруженном модуле.
   *
   * @param moduleName - Имя модуля
   * @returns Информация о модуле или undefined
   */
  public getModuleInfo(moduleName: string): LoadedModule | undefined {
    return this.loadedModules.get(moduleName);
  }

  // ============================================
  // Публичные методы: Синхронизация предзагрузки
  // ============================================

  /**
   * Регистрирует Promise предзагрузки для модуля.
   * Используется для синхронизации параллельных операций.
   *
   * @param moduleName - Имя модуля
   * @param promise - Promise предзагрузки
   */
  public setPreloadingPromise(
    moduleName: string,
    promise: Promise<void>,
  ): void {
    this.preloadingPromises.set(moduleName, promise);
    log.debug(`Promise предзагрузки установлен для "${moduleName}"`, {
      prefix: LOG_PREFIX,
    });
  }

  /**
   * Атомарно получает существующий Promise или создает новый.
   *
   * Устраняет race condition при параллельных вызовах preloadModule:
   * - Если Promise уже существует, возвращает его
   * - Если нет, создает новый через factory и сохраняет его
   *
   * @param moduleName - Имя модуля
   * @param factory - Функция для создания нового Promise (вызывается только если Promise не существует)
   * @returns Существующий или новый Promise
   */
  public getOrCreatePreloadingPromise(
    moduleName: string,
    factory: () => Promise<void>,
  ): Promise<void> {
    // Атомарная проверка и создание
    const existingPromise = this.preloadingPromises.get(moduleName);

    if (existingPromise) {
      log.debug(
        `Используется существующий Promise предзагрузки для "${moduleName}"`,
        {
          prefix: LOG_PREFIX,
        },
      );
      return existingPromise;
    }

    // Создаем новый Promise
    const newPromise = factory();
    this.preloadingPromises.set(moduleName, newPromise);

    log.debug(`Создан новый Promise предзагрузки для "${moduleName}"`, {
      prefix: LOG_PREFIX,
    });

    return newPromise;
  }

  /**
   * Возвращает Promise предзагрузки для модуля.
   *
   * @param moduleName - Имя модуля
   * @returns Promise предзагрузки или undefined
   */
  public getPreloadingPromise(moduleName: string): Promise<void> | undefined {
    return this.preloadingPromises.get(moduleName);
  }

  /**
   * Проверяет, есть ли активный Promise предзагрузки.
   *
   * @param moduleName - Имя модуля
   * @returns true, если есть активный Promise
   */
  public hasPreloadingPromise(moduleName: string): boolean {
    return this.preloadingPromises.has(moduleName);
  }

  /**
   * Удаляет Promise предзагрузки для модуля.
   *
   * @param moduleName - Имя модуля
   */
  public removePreloadingPromise(moduleName: string): void {
    this.preloadingPromises.delete(moduleName);
    log.debug(`Promise предзагрузки удален для "${moduleName}"`, {
      prefix: LOG_PREFIX,
    });
  }

  /**
   * Ожидает завершения предзагрузки модуля, если она выполняется.
   *
   * @param moduleName - Имя модуля
   * @returns Promise, который завершается после окончания предзагрузки
   */
  public async waitForPreloading(moduleName: string): Promise<void> {
    const existingPromise = this.preloadingPromises.get(moduleName);
    if (existingPromise) {
      log.debug(`Ожидание завершения предзагрузки "${moduleName}"`, {
        prefix: LOG_PREFIX,
      });
      try {
        await existingPromise;
      } catch {
        // Игнорируем ошибку, она будет обработана в месте создания Promise
        log.debug(`Предзагрузка "${moduleName}" завершилась с ошибкой`, {
          prefix: LOG_PREFIX,
        });
      }
    }
  }

  // ============================================
  // Публичные методы: Подписка на события
  // ============================================

  /**
   * Подписывается на изменения статусов модулей.
   *
   * **ВАЖНО: Необходимо вызывать функцию отписки!**
   * Если не отписаться, обработчик будет накапливаться в памяти и вызываться
   * при каждом изменении статуса модуля в течение всего жизненного цикла приложения.
   * Это может привести к утечке памяти и неожиданному поведению.
   *
   * @param handler - Обработчик изменения статуса
   * @returns Функция для отписки. **Обязательно вызовите её при размонтировании компонента или завершении использования.**
   *
   * @example
   * ```typescript
   * const unsubscribe = statusTracker.onStatusChange((event) => {
   *   console.log(`Модуль ${event.moduleName} изменил статус`);
   * });
   *
   * // При размонтировании компонента или завершении использования:
   * unsubscribe();
   * ```
   */
  public onStatusChange(handler: StatusChangeHandler): () => void {
    this.statusChangeHandlers.push(handler);

    return () => {
      const index = this.statusChangeHandlers.indexOf(handler);
      if (index > -1) {
        this.statusChangeHandlers.splice(index, 1);
        log.debug(
          `Обработчик изменения статуса отписан (осталось ${this.statusChangeHandlers.length})`,
          { prefix: LOG_PREFIX },
        );
      }
    };
  }

  // ============================================
  // Публичные методы: Статистика и сводка
  // ============================================

  /**
   * Возвращает сводную информацию о статусах всех модулей.
   *
   * @returns Сводка статусов
   */
  public getSummary(): ModuleStatusSummary {
    const summary: ModuleStatusSummary = {
      total: this.loadedModules.size,
      byStatus: {
        [ModuleLoadStatus.PENDING]: 0,
        [ModuleLoadStatus.LOADING]: 0,
        [ModuleLoadStatus.PRELOADED]: 0,
        [ModuleLoadStatus.LOADED]: 0,
        [ModuleLoadStatus.FAILED]: 0,
      },
      failedModules: [],
    };

    for (const [name, info] of this.loadedModules) {
      summary.byStatus[info.status]++;
      if (info.status === ModuleLoadStatus.FAILED) {
        summary.failedModules.push(name);
      }
    }

    return summary;
  }

  /**
   * Возвращает список всех отслеживаемых модулей.
   *
   * @returns Массив имен модулей
   */
  public getTrackedModuleNames(): string[] {
    return Array.from(this.loadedModules.keys());
  }

  /**
   * Возвращает количество активных подписчиков на изменения статусов.
   *
   * Полезно для отладки и мониторинга потенциальных утечек памяти.
   *
   * @returns Количество активных обработчиков
   */
  public getActiveHandlersCount(): number {
    return this.statusChangeHandlers.length;
  }

  /**
   * Очищает информацию о модуле.
   *
   * @param moduleName - Имя модуля
   */
  public clear(moduleName: string): void {
    this.loadedModules.delete(moduleName);
    this.preloadingPromises.delete(moduleName);
    log.debug(`Информация о модуле "${moduleName}" очищена`, {
      prefix: LOG_PREFIX,
    });
  }

  /**
   * Полностью очищает трекер.
   *
   * Очищает все данные трекера, включая:
   * - Информацию о загруженных модулях
   * - Promise предзагрузки
   * - Все подписки на изменения статусов
   *
   * **Внимание:** После вызова этого метода все подписчики будут удалены
   * и больше не будут получать уведомления об изменениях статусов.
   */
  public clearAll(): void {
    const modulesCount = this.loadedModules.size;
    const promisesCount = this.preloadingPromises.size;
    const handlersCount = this.statusChangeHandlers.length;

    this.loadedModules.clear();
    this.preloadingPromises.clear();
    this.statusChangeHandlers.length = 0; // Очищаем массив обработчиков

    log.debug(
      `Трекер очищен (удалено ${modulesCount} модулей, ${promisesCount} Promise, ${handlersCount} обработчиков)`,
      {
        prefix: LOG_PREFIX,
      },
    );
  }

  // ============================================
  // Приватные методы
  // ============================================

  /**
   * Устанавливает статус модуля и уведомляет подписчиков.
   *
   * @param module - Модуль
   * @param status - Новый статус
   * @param error - Ошибка (опционально)
   */
  private setStatus(
    module: Module,
    status: ModuleLoadStatus,
    error?: Error,
  ): void {
    const previousStatus = this.loadedModules.get(module.name)?.status ?? null;
    const timestamp = Date.now();

    this.loadedModules.set(module.name, {
      module,
      status,
      error,
      updatedAt: timestamp,
    });

    // Уведомляем подписчиков
    this.notifyStatusChange({
      moduleName: module.name,
      previousStatus,
      newStatus: status,
      timestamp,
      error,
    });
  }

  /**
   * Уведомляет всех подписчиков об изменении статуса.
   *
   * @param event - Событие изменения статуса
   */
  private notifyStatusChange(event: ModuleStatusChangeEvent): void {
    for (const handler of this.statusChangeHandlers) {
      try {
        handler(event);
      } catch (error) {
        log.error('Ошибка в обработчике изменения статуса', {
          prefix: LOG_PREFIX,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  }
}
