/**
 * Уровни логирования
 */
export enum LogLevel {
    ERROR = 0,
    WARN = 1,
    INFO = 2,
    DEBUG = 3,
    TRACE = 4,
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
     * Префикс для всех сообщений
     */
    prefix?: string;
    /**
     * Включить ли логирование в production
     * @default false
     */
    enableInProduction?: boolean;
    /**
     * Кастомный форматтер для сообщений
     */
    formatter?: (level: LogLevel, message: string, ...args: unknown[]) => string;
}

/**
 * Интерфейс логгера
 */
export interface ILogger {
    error(message: string, ...args: unknown[]): void;
    warn(message: string, ...args: unknown[]): void;
    info(message: string, ...args: unknown[]): void;
    debug(message: string, ...args: unknown[]): void;
    trace(message: string, ...args: unknown[]): void;
    setLevel(level: LogLevel): void;
    setConfig(config: Partial<ILoggerConfig>): void;
}
