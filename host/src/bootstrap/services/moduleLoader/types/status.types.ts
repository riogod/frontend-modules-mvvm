/**
 * Типы, связанные со статусами модулей.
 * @module types/status
 */

import type { Module } from '../../../../modules/interface';

/**
 * Возможные статусы загрузки модуля.
 */
export enum ModuleLoadStatus {
  /** Ожидает загрузки */
  PENDING = 'pending',
  /** В процессе загрузки */
  LOADING = 'loading',
  /** Предзагружен (ресурсы зарегистрированы, onModuleInit вызван для NORMAL) */
  PRELOADED = 'preloaded',
  /** Полностью загружен */
  LOADED = 'loaded',
  /** Ошибка загрузки */
  FAILED = 'failed',
}

/**
 * Информация о загруженном модуле с его статусом.
 */
export interface LoadedModule {
  /** Модуль */
  module: Module;
  /** Статус загрузки */
  status: ModuleLoadStatus;
  /** Ошибка загрузки (если status === FAILED) */
  error?: Error;
  /** Время изменения статуса */
  updatedAt?: number;
}

/**
 * Событие изменения статуса модуля.
 */
export interface ModuleStatusChangeEvent {
  /** Имя модуля */
  moduleName: string;
  /** Предыдущий статус */
  previousStatus: ModuleLoadStatus | null;
  /** Новый статус */
  newStatus: ModuleLoadStatus;
  /** Время события */
  timestamp: number;
  /** Ошибка (если новый статус FAILED) */
  error?: Error;
}

/**
 * Тип для обработчика изменения статуса.
 */
export type StatusChangeHandler = (event: ModuleStatusChangeEvent) => void;

/**
 * Сводка статусов всех модулей.
 */
export interface ModuleStatusSummary {
  /** Общее количество модулей */
  total: number;
  /** Количество по статусам */
  byStatus: Record<ModuleLoadStatus, number>;
  /** Модули с ошибками */
  failedModules: string[];
}

