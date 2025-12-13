/**
 * Уровни логирования
 */
export enum LogLevel {
  /**
   * Отключить все логирование
   */
  NONE = 0,
  ERROR = 1,
  WARN = 2,
  INFO = 3,
  DEBUG = 4,
  TRACE = 5,
}

/**
 * Опции для вызова логирования
 */
export interface ILogOptions {
  /**
   * Префикс для конкретного сообщения
   */
  prefix?: string;
}

/**
 * Конфигурация логгера
 */
export interface ILoggerConfig {
  /**
   * Минимальный уровень логирования
   * Сообщения ниже этого уровня не будут выводиться
   */
  level?: LogLevel;
  /**
   * Кастомный форматтер для сообщений
   */
  formatter?: (
    level: LogLevel,
    message: string,
    prefix?: string,
    ...args: unknown[]
  ) => string;
  /**
   * Callback для отправки ошибок в мониторинг
   * Автоматически инициализирует глобальные обработчики ошибок при установке
   */
  errorMonitoringCallback?: IErrorMonitoringCallback | null;
}

/**
 * Интерфейс для отправки ошибок в мониторинг
 */
export interface IErrorMonitoringCallback {
  /**
   * Вызывается при обнаружении необработанной ошибки
   * @param error - Объект ошибки
   * @param errorInfo - Дополнительная информация об ошибке (стек, источник и т.д.)
   */
  (
    error: Error | unknown,
    errorInfo?: {
      message?: string;
      source?: string;
      lineno?: number;
      colno?: number;
      stack?: string;
      filename?: string;
      isUnhandledRejection?: boolean;
    },
  ): void;
}

/**
 * Интерфейс логгера
 */
export interface ILogger {
  error(message: string, ...args: unknown[]): void;
  error(message: string, options: ILogOptions, ...args: unknown[]): void;
  warn(message: string, ...args: unknown[]): void;
  warn(message: string, options: ILogOptions, ...args: unknown[]): void;
  info(message: string, ...args: unknown[]): void;
  info(message: string, options: ILogOptions, ...args: unknown[]): void;
  debug(message: string, ...args: unknown[]): void;
  debug(message: string, options: ILogOptions, ...args: unknown[]): void;
  trace(message: string, ...args: unknown[]): void;
  trace(message: string, options: ILogOptions, ...args: unknown[]): void;
  setLevel(level: LogLevel): void;
  setConfig(config: Partial<ILoggerConfig>): void;
}
