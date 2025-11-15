import { LogLevel, type ILoggerConfig } from './interfaces';

/**
 * Глобальная конфигурация логгера
 */
let globalConfig: Required<ILoggerConfig>;

/**
 * Проверка, является ли окружение production
 */
const isProduction = (): boolean => process.env.NODE_ENV === 'production';

/**
 * Форматтер по умолчанию с поддержкой префикса
 * Использует актуальный globalConfig для получения префикса
 */
const defaultFormatter = (level: LogLevel, message: string): string => {
    const levelName = LogLevel[level];
    return `[${levelName}] ${message}`;
};

/**
 * Конфигурация логгера по умолчанию
 */
const defaultConfig: Required<ILoggerConfig> = {
    level: LogLevel.INFO,
    prefix: '',
    enableInProduction: false,
    formatter: defaultFormatter,
};

// Инициализация глобальной конфигурации
globalConfig = { ...defaultConfig };


/**
 * Глобальный объект логгера
 */
export const log = {
    /**
     * Логирование ошибок
     */
    error: (message: string, ...args: unknown[]): void => {
        logInternal(LogLevel.ERROR, message, ...args);
    },

    /**
     * Логирование предупреждений
     */
    warn: (message: string, ...args: unknown[]): void => {
        logInternal(LogLevel.WARN, message, ...args);
    },

    /**
     * Логирование информационных сообщений
     */
    info: (message: string, ...args: unknown[]): void => {
        logInternal(LogLevel.INFO, message, ...args);
    },

    /**
     * Логирование отладочных сообщений
     */
    debug: (message: string, ...args: unknown[]): void => {
        logInternal(LogLevel.DEBUG, message, ...args);
    },

    /**
     * Логирование трассировочных сообщений
     */
    trace: (message: string, ...args: unknown[]): void => {
        logInternal(LogLevel.TRACE, message, ...args);
    },

    /**
     * Установить уровень логирования
     */
    setLevel: (level: LogLevel): void => {
        globalConfig.level = level;
    },

    /**
     * Обновить конфигурацию логгера
     */
    setConfig: (config: Partial<ILoggerConfig>): void => {
        globalConfig = {
            ...globalConfig,
            ...config,
            formatter: config.formatter || defaultFormatter,
        };
    },
};

/**
 * Внутренняя функция логирования (переименована из log для избежания конфликта)
 */
const logInternal = (level: LogLevel, message: string, ...args: unknown[]): void => {
    // Пропускаем логирование в production, если не включено явно
    if (isProduction() && !globalConfig.enableInProduction) {
        return;
    }

    // Пропускаем сообщения, если уровень логирования установлен в NONE
    if (globalConfig.level === LogLevel.NONE) {
        return;
    }

    // Пропускаем сообщения ниже установленного уровня
    if (level > globalConfig.level) {
        return;
    }

    // Форматируем сообщение
    const formattedMessage = globalConfig.formatter(level, message, ...args);

    // Выводим в консоль в зависимости от уровня
    switch (level) {
        case LogLevel.NONE:
            // NONE не должен достигать этого места, но на всякий случай
            return;
        case LogLevel.ERROR:
            console.error(formattedMessage, ...args);
            break;
        case LogLevel.WARN:
            console.warn(formattedMessage, ...args);
            break;
        case LogLevel.INFO:
            console.info(formattedMessage, ...args);
            break;
        case LogLevel.DEBUG:
            console.debug(formattedMessage, ...args);
            break;
        case LogLevel.TRACE:
            console.trace(formattedMessage, ...args);
            break;
    }
};

/**
 * Создать логгер с кастомной конфигурацией
 * Возвращает объект с функциями логирования, использующими переданную конфигурацию
 */
export const createLogger = (config?: ILoggerConfig) => {
    const loggerConfig: Required<ILoggerConfig> = {
        ...defaultConfig,
        ...config,
    };

    // Создаем форматтер, который использует актуальный loggerConfig
    loggerConfig.formatter = config?.formatter || ((level: LogLevel, message: string) => {
        const levelName = LogLevel[level];
        return `[${levelName}] ${message}`;
    });

    const loggerLog = (level: LogLevel, message: string, ...args: unknown[]): void => {
        if (isProduction() && !loggerConfig.enableInProduction) {
            return;
        }

        // Пропускаем сообщения, если уровень логирования установлен в NONE
        if (loggerConfig.level === LogLevel.NONE) {
            return;
        }

        if (level > loggerConfig.level) {
            return;
        }

        const formattedMessage = loggerConfig.formatter(level, message, ...args);

        switch (level) {
            case LogLevel.NONE:
                // NONE не должен достигать этого места, но на всякий случай
                return;
            case LogLevel.ERROR:
                console.error(formattedMessage, ...args);
                break;
            case LogLevel.WARN:
                console.warn(formattedMessage, ...args);
                break;
            case LogLevel.INFO:
                console.info(formattedMessage, ...args);
                break;
            case LogLevel.DEBUG:
                console.debug(formattedMessage, ...args);
                break;
            case LogLevel.TRACE:
                console.trace(formattedMessage, ...args);
                break;
        }
    };

    return {
        error: (message: string, ...args: unknown[]) => loggerLog(LogLevel.ERROR, message, ...args),
        warn: (message: string, ...args: unknown[]) => loggerLog(LogLevel.WARN, message, ...args),
        info: (message: string, ...args: unknown[]) => loggerLog(LogLevel.INFO, message, ...args),
        debug: (message: string, ...args: unknown[]) => loggerLog(LogLevel.DEBUG, message, ...args),
        trace: (message: string, ...args: unknown[]) => loggerLog(LogLevel.TRACE, message, ...args),
        setLevel: (level: LogLevel) => {
            loggerConfig.level = level;
        },
        setConfig: (newConfig: Partial<ILoggerConfig>) => {
            Object.assign(loggerConfig, newConfig);
        },
    };
};
