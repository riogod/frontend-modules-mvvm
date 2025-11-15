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
 * Цвета для разных префиксов moduleLoader
 */
const getPrefixColor = (prefix?: string): string => {
    if (!prefix) return '';
    
    // Цвета для компонентов moduleLoader
    const colorMap: Record<string, string> = {
        'bootstrap.moduleLoader': 'color: #4A90E2; font-weight: bold;', 
        'bootstrap.moduleLoader.registry': 'color: #50C878; font-weight: bold;',
        'bootstrap.moduleLoader.conditionValidator': 'color: #FFD700; font-weight: bold;',
        'bootstrap.moduleLoader.dependencyResolver': 'color: #9B59B6; font-weight: bold;',
        'bootstrap.moduleLoader.lifecycleManager': 'color: #1ABC9C; font-weight: bold;', 
        'bootstrap.routerService': 'color: #E74C3C; font-weight: bold;', 
        'bootstrap.handlers': 'color: #3498DB; font-weight: bold;', 
        'bootstrap': 'color: #2C3E50; font-weight: bold;', 
    };
    
    return colorMap[prefix] || '';
};

/**
 * Цвета для уровней логирования
 */
const getLevelColor = (level: LogLevel): string => {
    switch (level) {
        case LogLevel.ERROR:
            return 'color: #E74C3C; font-weight: bold;'; // Красный
        case LogLevel.WARN:
            return 'color: #F39C12; font-weight: bold;'; // Оранжевый
        case LogLevel.INFO:
            return 'color: #3498DB; font-weight: bold;'; // Синий
        case LogLevel.DEBUG:
            return 'color: #95A5A6; font-weight: normal;'; // Серый
        case LogLevel.TRACE:
            return 'color: #7F8C8D; font-weight: normal;'; // Темно-серый
        default:
            return '';
    }
};

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

    // Определяем, нужно ли использовать цветной вывод (для moduleLoader и routerService)
    const useColors = prefix && (
        prefix.startsWith('bootstrap.moduleLoader') || 
        prefix.startsWith('bootstrap.routerService') ||
        prefix === 'bootstrap.handlers' ||
        prefix === 'bootstrap'
    );

    // Выводим в консоль в зависимости от уровня
    switch (level) {
        case LogLevel.NONE:
            // NONE не должен достигать этого места, но на всякий случай
            return;
        case LogLevel.ERROR:
            if (useColors) {
                const prefixColor = getPrefixColor(prefix);
                const levelColor = getLevelColor(level);
                const prefixPart = prefix ? `[${prefix}] ` : '';
                const levelPart = `[${LogLevel[level]}] `;
                console.error(
                    `%c${prefixPart}%c${levelPart}%c${message}`,
                    prefixColor,
                    levelColor,
                    '',
                    ...args
                );
            } else {
                console.error(formattedMessage, ...args);
            }
            break;
        case LogLevel.WARN:
            if (useColors) {
                const prefixColor = getPrefixColor(prefix);
                const levelColor = getLevelColor(level);
                const prefixPart = prefix ? `[${prefix}] ` : '';
                const levelPart = `[${LogLevel[level]}] `;
                console.warn(
                    `%c${prefixPart}%c${levelPart}%c${message}`,
                    prefixColor,
                    levelColor,
                    '',
                    ...args
                );
            } else {
                console.warn(formattedMessage, ...args);
            }
            break;
        case LogLevel.INFO:
            if (useColors) {
                const prefixColor = getPrefixColor(prefix);
                const levelColor = getLevelColor(level);
                const prefixPart = prefix ? `[${prefix}] ` : '';
                const levelPart = `[${LogLevel[level]}] `;
                console.info(
                    `%c${prefixPart}%c${levelPart}%c${message}`,
                    prefixColor,
                    levelColor,
                    '',
                    ...args
                );
            } else {
                console.info(formattedMessage, ...args);
            }
            break;
        case LogLevel.DEBUG:
            // Используем console.log вместо console.debug, так как многие браузеры скрывают debug по умолчанию
            if (useColors) {
                const prefixColor = getPrefixColor(prefix);
                const levelColor = getLevelColor(level);
                const prefixPart = prefix ? `[${prefix}] ` : '';
                const levelPart = `[${LogLevel[level]}] `;
                console.log(
                    `%c${prefixPart}%c${levelPart}%c${message}`,
                    prefixColor,
                    levelColor,
                    '',
                    ...args
                );
            } else {
                console.log(formattedMessage, ...args);
            }
            break;
        case LogLevel.TRACE:
            if (useColors) {
                const prefixColor = getPrefixColor(prefix);
                const levelColor = getLevelColor(level);
                const prefixPart = prefix ? `[${prefix}] ` : '';
                const levelPart = `[${LogLevel[level]}] `;
                console.trace(
                    `%c${prefixPart}%c${levelPart}%c${message}`,
                    prefixColor,
                    levelColor,
                    '',
                    ...args
                );
            } else {
                console.trace(formattedMessage, ...args);
            }
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

        // Определяем, нужно ли использовать цветной вывод (для moduleLoader и routerService)
        const useColors = prefix && (
            prefix.startsWith('bootstrap.moduleLoader') || 
            prefix.startsWith('bootstrap.routerService') ||
            prefix === 'bootstrap.handlers' ||
            prefix === 'bootstrap'
        );

        switch (level) {
            case LogLevel.NONE:
                // NONE не должен достигать этого места, но на всякий случай
                return;
            case LogLevel.ERROR:
                if (useColors) {
                    const prefixColor = getPrefixColor(prefix);
                    const levelColor = getLevelColor(level);
                    const prefixPart = prefix ? `[${prefix}] ` : '';
                    const levelPart = `[${LogLevel[level]}] `;
                    console.error(
                        `%c${prefixPart}%c${levelPart}%c${message}`,
                        prefixColor,
                        levelColor,
                        '',
                        ...args
                    );
                } else {
                    console.error(formattedMessage, ...args);
                }
                break;
            case LogLevel.WARN:
                if (useColors) {
                    const prefixColor = getPrefixColor(prefix);
                    const levelColor = getLevelColor(level);
                    const prefixPart = prefix ? `[${prefix}] ` : '';
                    const levelPart = `[${LogLevel[level]}] `;
                    console.warn(
                        `%c${prefixPart}%c${levelPart}%c${message}`,
                        prefixColor,
                        levelColor,
                        '',
                        ...args
                    );
                } else {
                    console.warn(formattedMessage, ...args);
                }
                break;
            case LogLevel.INFO:
                if (useColors) {
                    const prefixColor = getPrefixColor(prefix);
                    const levelColor = getLevelColor(level);
                    const prefixPart = prefix ? `[${prefix}] ` : '';
                    const levelPart = `[${LogLevel[level]}] `;
                    console.info(
                        `%c${prefixPart}%c${levelPart}%c${message}`,
                        prefixColor,
                        levelColor,
                        '',
                        ...args
                    );
                } else {
                    console.info(formattedMessage, ...args);
                }
                break;
            case LogLevel.DEBUG:
                if (useColors) {
                    const prefixColor = getPrefixColor(prefix);
                    const levelColor = getLevelColor(level);
                    const prefixPart = prefix ? `[${prefix}] ` : '';
                    const levelPart = `[${LogLevel[level]}] `;
                    console.log(
                        `%c${prefixPart}%c${levelPart}%c${message}`,
                        prefixColor,
                        levelColor,
                        '',
                        ...args
                    );
                } else {
                    console.log(formattedMessage, ...args);
                }
                break;
            case LogLevel.TRACE:
                if (useColors) {
                    const prefixColor = getPrefixColor(prefix);
                    const levelColor = getLevelColor(level);
                    const prefixPart = prefix ? `[${prefix}] ` : '';
                    const levelPart = `[${LogLevel[level]}] `;
                    console.trace(
                        `%c${prefixPart}%c${levelPart}%c${message}`,
                        prefixColor,
                        levelColor,
                        '',
                        ...args
                    );
                } else {
                    console.trace(formattedMessage, ...args);
                }
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
