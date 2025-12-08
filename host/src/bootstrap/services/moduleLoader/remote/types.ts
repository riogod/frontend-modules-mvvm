export interface RemoteModuleConfig {
  name: string;
  entry: string;
  scope: string;
}

export interface LoadRemoteModuleOptions {
  /**
   * Количество попыток загрузки
   * @default 3
   */
  retries?: number;

  /**
   * Таймаут загрузки в миллисекундах
   * @default 10000
   */
  timeout?: number;

  /**
   * Задержка между попытками в миллисекундах
   * @default 1000
   */
  retryDelay?: number;
}

export interface RemoteContainer {
  init: (shareScope: Record<string, any>) => Promise<void>;
  get: (module: string) => Promise<() => any>;
}

declare global {
  interface Window {
    [key: string]: RemoteContainer | undefined;
  }
}

