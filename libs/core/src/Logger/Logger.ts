import { LogLevel, type ILoggerConfig, type ILogOptions } from './interfaces';

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
 */
const defaultFormatter = (level: LogLevel, message: string, prefix?: string): string => {
    const levelName = LogLevel[level];
    const prefixPart = prefix ? `[${prefix}] ` : '';
    return `${prefixPart}[${levelName}] ${message}`;
};

/**
 * Конфигурация логгера по умолчанию
 */
const defaultConfig: Required<ILoggerConfig> = {
    level: LogLevel.INFO,
    enableInProduction: false,
    formatter: defaultFormatter,
};

// Инициализация глобальной конфигурации
globalConfig = { ...defaultConfig };


/**
 * Вспомогательная функция для извлечения опций из аргументов
 */
const extractOptions = (args: unknown[]): { options?: ILogOptions; remainingArgs: unknown[] } => {
    if (args.length > 0 && typeof args[0] === 'object' && args[0] !== null && 'prefix' in args[0]) {
        return {
            options: args[0] as ILogOptions,
            remainingArgs: args.slice(1),
        };
    }
    return { remainingArgs: args };
};

/**
 * Глобальный объект логгера
 */
export const log = {
    /**
     * Логирование ошибок
     */
    error: (message: string, ...args: unknown[]): void => {
        const { options, remainingArgs } = extractOptions(args);
        logInternal(LogLevel.ERROR, message, options?.prefix, ...remainingArgs);
    },

    /**
     * Логирование предупреждений
     */
    warn: (message: string, ...args: unknown[]): void => {
        const { options, remainingArgs } = extractOptions(args);
        logInternal(LogLevel.WARN, message, options?.prefix, ...remainingArgs);
    },

    /**
     * Логирование информационных сообщений
     */
    info: (message: string, ...args: unknown[]): void => {
        const { options, remainingArgs } = extractOptions(args);
        logInternal(LogLevel.INFO, message, options?.prefix, ...remainingArgs);
    },

    /**
     * Логирование отладочных сообщений
     */
    debug: (message: string, ...args: unknown[]): void => {
        const { options, remainingArgs } = extractOptions(args);
        logInternal(LogLevel.DEBUG, message, options?.prefix, ...remainingArgs);
    },

    /**
     * Логирование трассировочных сообщений
     */
    trace: (message: string, ...args: unknown[]): void => {
        const { options, remainingArgs } = extractOptions(args);
        logInternal(LogLevel.TRACE, message, options?.prefix, ...remainingArgs);
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
const logInternal = (level: LogLevel, message: string, prefix: string | undefined, ...args: unknown[]): void => {
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
    const formattedMessage = globalConfig.formatter(level, message, prefix, ...args);

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
    loggerConfig.formatter = config?.formatter || ((level: LogLevel, message: string, prefix?: string) => {
        const levelName = LogLevel[level];
        const prefixPart = prefix ? `[${prefix}] ` : '';
        return `${prefixPart}[${levelName}] ${message}`;
    });

    const loggerLog = (level: LogLevel, message: string, prefix: string | undefined, ...args: unknown[]): void => {
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

        const formattedMessage = loggerConfig.formatter(level, message, prefix, ...args);

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
        error: (message: string, ...args: unknown[]) => {
            const { options, remainingArgs } = extractOptions(args);
            loggerLog(LogLevel.ERROR, message, options?.prefix, ...remainingArgs);
        },
        warn: (message: string, ...args: unknown[]) => {
            const { options, remainingArgs } = extractOptions(args);
            loggerLog(LogLevel.WARN, message, options?.prefix, ...remainingArgs);
        },
        info: (message: string, ...args: unknown[]) => {
            const { options, remainingArgs } = extractOptions(args);
            loggerLog(LogLevel.INFO, message, options?.prefix, ...remainingArgs);
        },
        debug: (message: string, ...args: unknown[]) => {
            const { options, remainingArgs } = extractOptions(args);
            loggerLog(LogLevel.DEBUG, message, options?.prefix, ...remainingArgs);
        },
        trace: (message: string, ...args: unknown[]) => {
            const { options, remainingArgs } = extractOptions(args);
            loggerLog(LogLevel.TRACE, message, options?.prefix, ...remainingArgs);
        },
        setLevel: (level: LogLevel) => {
            loggerConfig.level = level;
        },
        setConfig: (newConfig: Partial<ILoggerConfig>) => {
            Object.assign(loggerConfig, newConfig);
        },
    };
};
