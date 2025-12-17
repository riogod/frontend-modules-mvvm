/**
 * Типы для работы с удаленными (remote) модулями через Module Federation.
 * @module types/remote
 */

/**
 * Конфигурация удаленного модуля.
 */
export interface RemoteModuleConfig {
  /** Имя модуля */
  name: string;
  /** URL точки входа (remoteEntry.js) */
  entry: string;
  /** Scope имя в Module Federation */
  scope: string;
}

/**
 * Опции загрузки удаленного модуля.
 */
export interface LoadRemoteModuleOptions {
  /**
   * Количество попыток загрузки.
   * @default 3
   */
  retries?: number;

  /**
   * Таймаут загрузки в миллисекундах.
   * @default 10000
   */
  timeout?: number;

  /**
   * Задержка между попытками в миллисекундах.
   * @default 1000
   */
  retryDelay?: number;
}

/**
 * Интерфейс контейнера Module Federation.
 */
export interface RemoteContainer {
  /**
   * Инициализирует контейнер с shared scope.
   * @param shareScope - Объект с shared модулями
   */
  init: (shareScope: Record<string, unknown>) => Promise<void>;
  
  /**
   * Получает модуль из контейнера.
   * @param module - Путь к модулю (например, './Config')
   * @returns Фабричная функция для получения модуля
   */
  get: (module: string) => Promise<() => unknown>;
}

/**
 * Расширение глобального объекта Window для Module Federation.
 */
declare global {
  interface Window {
    [key: string]: RemoteContainer | undefined;
  }
}

