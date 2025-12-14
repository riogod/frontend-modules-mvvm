import {
  LogLevel,
  type ILoggerConfig,
  type ILogOptions,
  type IErrorMonitoringCallback,
} from './interfaces';

/**
 * Глобальная конфигурация логгера
 */
let globalConfig: Required<Omit<ILoggerConfig, 'errorMonitoringCallback'>>;

/**
 * Callback для отправки ошибок в мониторинг
 */
let errorMonitoringCallback: IErrorMonitoringCallback | null = null;

/**
 * Флаг инициализации глобальных обработчиков ошибок
 */
let globalErrorHandlersInitialized = false;

/**
 * Map для отслеживания уже обработанных ошибок (предотвращение дублирования)
 * Ключ - объект Error, значение - временная метка обработки
 */
const processedErrors = new Map<Error, number>();

/**
 * Максимальное количество ошибок в кэше (для предотвращения утечек памяти)
 */
const MAX_PROCESSED_ERRORS = 20;

/**
 * Кэшированная проверка production окружения (вычисляется один раз при загрузке)
 */
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

/**
 * Кэш для цветов префиксов
 */
const prefixColorCache = new Map<string, string>();

/**
 * Цвета для разных префиксов moduleLoader (с кэшированием)
 */
const getPrefixColor = (prefix?: string): string => {
  if (!prefix) return '';

  // Проверяем кэш
  const cached = prefixColorCache.get(prefix);
  if (cached !== undefined) {
    return cached;
  }

  // Цвета для компонентов moduleLoader
  const colorMap: Record<string, string> = {
    'bootstrap.moduleLoader': 'color: #4A90E2; font-weight: bold;',
    'bootstrap.moduleLoader.registry': 'color: #50C878; font-weight: bold;',
    'bootstrap.moduleLoader.conditionValidator':
      'color: #FFD700; font-weight: bold;',
    'bootstrap.moduleLoader.dependencyResolver':
      'color: #9B59B6; font-weight: bold;',
    'bootstrap.moduleLoader.lifecycleManager':
      'color: #1ABC9C; font-weight: bold;',
    'bootstrap.routerService': 'color: #E74C3C; font-weight: bold;',
    'bootstrap.handlers': 'color: #3498DB; font-weight: bold;',
    bootstrap: 'color: #2C3E50; font-weight: bold;',
    'bootstrap.mockService': 'color: #9B59B6; font-weight: bold;',
  };

  const color = colorMap[prefix] || '';
  prefixColorCache.set(prefix, color);
  return color;
};

/**
 * Кэш для цветов уровней логирования
 */
const levelColorCache = new Map<LogLevel, string>();

/**
 * Цвета для уровней логирования (с кэшированием)
 */
const getLevelColor = (level: LogLevel): string => {
  // Проверяем кэш
  const cached = levelColorCache.get(level);
  if (cached !== undefined) {
    return cached;
  }

  let color: string;
  switch (level) {
    case LogLevel.ERROR:
      color = 'color: #E74C3C; font-weight: bold;'; // Красный
      break;
    case LogLevel.WARN:
      color = 'color: #F39C12; font-weight: bold;'; // Оранжевый
      break;
    case LogLevel.INFO:
      color = 'color: #3498DB; font-weight: bold;'; // Синий
      break;
    case LogLevel.DEBUG:
      color = 'color: #95A5A6; font-weight: normal;'; // Серый
      break;
    case LogLevel.TRACE:
      color = 'color: #7F8C8D; font-weight: normal;'; // Темно-серый
      break;
    default:
      color = '';
  }

  levelColorCache.set(level, color);
  return color;
};

/**
 * Set для быстрой проверки префиксов с цветным выводом
 */
const COLORED_PREFIXES = new Set(['bootstrap.handlers', 'bootstrap']);

/**
 * Проверка, нужно ли использовать цветной вывод для префикса
 */
const shouldUseColors = (prefix?: string): boolean => {
  if (!prefix) return false;
  return (
    COLORED_PREFIXES.has(prefix) ||
    prefix.startsWith('bootstrap.moduleLoader') ||
    prefix.startsWith('bootstrap.routerService')
  );
};

/**
 * Форматтер по умолчанию с поддержкой префикса
 */
const defaultFormatter = (
  level: LogLevel,
  message: string,
  prefix?: string,
): string => {
  const levelName = LogLevel[level];
  const prefixPart = prefix ? `[${prefix}] ` : '';
  return `${prefixPart}[${levelName}] ${message}`;
};

/**
 * Конфигурация логгера по умолчанию
 */
const defaultConfig: Required<Omit<ILoggerConfig, 'errorMonitoringCallback'>> =
  {
    level: LogLevel.INFO,
    formatter: defaultFormatter,
  };

// Инициализация глобальной конфигурации
globalConfig = { ...defaultConfig };

/**
 * Вспомогательная функция для извлечения опций из аргументов
 * Оптимизирована: возвращает индекс начала вместо создания нового массива
 */
const extractOptions = (
  args: unknown[],
): { options?: ILogOptions; startIndex: number } => {
  if (
    args.length > 0 &&
    typeof args[0] === 'object' &&
    args[0] !== null &&
    'prefix' in args[0]
  ) {
    return {
      options: args[0] as ILogOptions,
      startIndex: 1,
    };
  }
  return { startIndex: 0 };
};

/**
 * Глобальный объект логгера
 */
export const log = {
  /**
   * Логирование ошибок
   */
  error: (message: string, ...args: unknown[]): void => {
    const { options, startIndex } = extractOptions(args);
    logInternal(LogLevel.ERROR, message, options?.prefix, startIndex, ...args);
  },

  /**
   * Логирование предупреждений
   */
  warn: (message: string, ...args: unknown[]): void => {
    const { options, startIndex } = extractOptions(args);
    logInternal(LogLevel.WARN, message, options?.prefix, startIndex, ...args);
  },

  /**
   * Логирование информационных сообщений
   */
  info: (message: string, ...args: unknown[]): void => {
    const { options, startIndex } = extractOptions(args);
    logInternal(LogLevel.INFO, message, options?.prefix, startIndex, ...args);
  },

  /**
   * Логирование отладочных сообщений
   */
  debug: (message: string, ...args: unknown[]): void => {
    const { options, startIndex } = extractOptions(args);
    logInternal(LogLevel.DEBUG, message, options?.prefix, startIndex, ...args);
  },

  /**
   * Логирование трассировочных сообщений
   */
  trace: (message: string, ...args: unknown[]): void => {
    const { options, startIndex } = extractOptions(args);
    logInternal(LogLevel.TRACE, message, options?.prefix, startIndex, ...args);
  },

  /**
   * Установить уровень логирования
   */
  setLevel: (level: LogLevel): void => {
    globalConfig.level = level;
  },

  /**
   * Обновить конфигурацию логгера
   * Автоматически инициализирует глобальные обработчики ошибок при первом вызове
   */
  setConfig: (config: Partial<ILoggerConfig>): void => {
    // Устанавливаем callback для мониторинга, если он передан
    if (config.errorMonitoringCallback !== undefined) {
      errorMonitoringCallback = config.errorMonitoringCallback ?? null;
      console.debug(
        '[Logger] errorMonitoringCallback',
        errorMonitoringCallback ? 'set' : 'cleared',
      );
    }

    // Обновляем конфигурацию
    globalConfig = {
      ...globalConfig,
      ...config,
      formatter: config.formatter || defaultFormatter,
    };

    // Автоматически инициализируем глобальные обработчики ошибок при первом вызове setConfig
    if (!globalErrorHandlersInitialized) {
      initGlobalErrorHandlers();
      globalErrorHandlersInitialized = true;
    }
  },
};

/**
 * Обработка ошибки с отправкой в мониторинг (без вывода в консоль)
 * Ошибка уже выводится браузером, поэтому не дублируем через console.error
 */
const handleUnhandledError = (
  error: unknown,
  errorInfo?: {
    message?: string;
    source?: string;
    lineno?: number;
    colno?: number;
    stack?: string;
    filename?: string;
    isUnhandledRejection?: boolean;
  },
): void => {
  // Преобразуем ошибку в Error объект, если это не Error
  let errorObj: Error;
  if (error instanceof Error) {
    errorObj = error;
  } else if (typeof error === 'string') {
    errorObj = new Error(error);
  } else {
    errorObj = new Error(String(error));
  }

  // Проверяем, не обрабатывали ли мы уже эту ошибку
  if (processedErrors.has(errorObj)) {
    console.debug(
      '[Logger] Error already processed, skipping duplicate handling',
    );
    return;
  }

  // Извлекаем дополнительную информацию из Error объекта (если она была добавлена)
  const additionalInfo: Record<string, unknown> = {};
  if (errorObj instanceof Error) {
    const errorWithExtras = errorObj as Error & Record<string, unknown>;
    Object.keys(errorWithExtras).forEach((key) => {
      if (
        key !== 'name' &&
        key !== 'message' &&
        key !== 'stack' &&
        key !== 'cause'
      ) {
        additionalInfo[key] = errorWithExtras[key];
      }
    });
  }

  // Формируем детали ошибки для мониторинга
  const errorDetails = {
    name: errorObj.name,
    message: errorObj.message,
    stack: errorObj.stack || errorInfo?.stack,
    ...errorInfo,
    ...additionalInfo, // Добавляем дополнительную информацию из Error объекта
    prefix: 'logger.globalErrorHandler',
  };

  // Отправляем только в мониторинг, НЕ выводим в консоль
  // (ошибка уже выводится браузером автоматически)
  sendToMonitoring(errorObj, errorDetails);
};

/**
 * Инициализация глобальных обработчиков ошибок
 * Перехватывает все необработанные ошибки и промисы для логирования и мониторинга
 *
 * Автоматически вызывается при первом вызове log.setConfig().
 * Все необработанные ошибки будут логироваться через log.error и отправляться
 * в мониторинг через установленный callback (если он был установлен через setConfig).
 *
 * Перехватывает:
 * - Синхронные ошибки (window.onerror, window.addEventListener('error'))
 * - Необработанные промисы (window.onunhandledrejection, window.addEventListener('unhandledrejection'))
 *
 * @internal Используется внутри setConfig
 */
const initGlobalErrorHandlers = (): void => {
  // Проверяем, что мы в браузерном окружении
  if (typeof window === 'undefined') {
    return;
  }

  // Обработчик синхронных ошибок
  const handleError = (
    event: ErrorEvent | Event,
    source?: string,
    lineno?: number,
    colno?: number,
    error?: Error,
  ): void => {
    // Для ErrorEvent
    if (event instanceof ErrorEvent) {
      handleUnhandledError(error || event.error || new Error(event.message), {
        message: event.message,
        source: event.filename || source,
        lineno: event.lineno || lineno,
        colno: event.colno || colno,
        filename: event.filename,
        isUnhandledRejection: false,
      });
    } else {
      // Для обычных событий
      handleUnhandledError(error || new Error('Unknown error'), {
        source,
        lineno,
        colno,
        isUnhandledRejection: false,
      });
    }
  };

  // Обработчик необработанных промисов
  const handleUnhandledRejection = (event: PromiseRejectionEvent): void => {
    const reason = event.reason;

    // Игнорируем отмененные запросы (AbortError, CanceledError, ERR_CANCELED)
    const isAborted =
      (reason instanceof Error &&
        (reason.name === 'AbortError' || reason.name === 'CanceledError')) ||
      (reason &&
        typeof reason === 'object' &&
        'code' in reason &&
        reason.code === 'ERR_CANCELED');

    if (isAborted) {
      // Не обрабатываем отмененные запросы
      return;
    }

    handleUnhandledError(reason, {
      message: reason instanceof Error ? reason.message : String(reason),
      stack: reason instanceof Error ? reason.stack : undefined,
      isUnhandledRejection: true,
    });
  };

  // Сохраняем оригинальные обработчики для вызова после нашей обработки
  const originalOnError = window.onerror;
  const originalOnUnhandledRejection = window.onunhandledrejection;

  // Устанавливаем обработчики через addEventListener (более современный и надежный подход)
  window.addEventListener('error', (event) => {
    const error = event.error instanceof Error ? event.error : undefined;
    handleError(event, undefined, undefined, undefined, error);

    // Вызываем оригинальный обработчик, если он был
    if (originalOnError && typeof originalOnError === 'function') {
      originalOnError.call(
        window,
        event.message,
        event.filename,
        event.lineno,
        event.colno,
        error,
      );
    }
  });

  window.addEventListener('unhandledrejection', (event) => {
    handleUnhandledRejection(event);
    // Предотвращаем вывод ошибки в консоль браузера после обработки
    event.preventDefault();

    // Вызываем оригинальный обработчик, если он был
    if (
      originalOnUnhandledRejection &&
      typeof originalOnUnhandledRejection === 'function'
    ) {
      originalOnUnhandledRejection.call(window, event);
    }
  });

  // Также устанавливаем обработчики через onerror для совместимости со старым кодом
  // (onerror может быть установлен до addEventListener)
  if (!originalOnError) {
    window.onerror = (
      message: string | Event,
      source?: string,
      lineno?: number,
      colno?: number,
      error?: Error,
    ): boolean => {
      if (typeof message === 'string') {
        handleError(
          new Error(message) as unknown as Event,
          source,
          lineno,
          colno,
          error,
        );
      } else {
        handleError(message, source, lineno, colno, error);
      }
      return false;
    };
  }

  // onunhandledrejection не устанавливаем, так как addEventListener более надежен
  // и предотвращает дублирование обработки
};

/**
 * Очистка старых записей об ошибках из кэша
 * Удаляет самые старые записи, если кэш превышает MAX_PROCESSED_ERRORS
 * Оптимизировано: удаляем только необходимое количество записей
 */
const cleanupProcessedErrors = (): void => {
  if (processedErrors.size <= MAX_PROCESSED_ERRORS) {
    return;
  }

  // Сортируем записи по времени обработки (старые первыми)
  const sortedEntries = Array.from(processedErrors.entries()).sort(
    (a, b) => a[1] - b[1],
  );

  // Удаляем только необходимое количество самых старых записей
  const toRemove = sortedEntries.length - MAX_PROCESSED_ERRORS;
  for (let i = 0; i < toRemove; i++) {
    processedErrors.delete(sortedEntries[i][0]);
  }
};

/**
 * Отправка ошибки в мониторинг (если callback установлен)
 * @returns true если ошибка была отправлена, false если уже была отправлена ранее
 */
const sendToMonitoring = (
  error: Error,
  errorInfo?: {
    message?: string;
    source?: string;
    lineno?: number;
    colno?: number;
    stack?: string;
    filename?: string;
    isUnhandledRejection?: boolean;
    prefix?: string;
  },
): boolean => {
  if (!errorMonitoringCallback) {
    return false;
  }

  // Проверяем, не отправляли ли мы уже эту ошибку в мониторинг
  if (processedErrors.has(error)) {
    return false;
  }

  // Если кэш переполнен, очищаем старые записи
  if (processedErrors.size >= MAX_PROCESSED_ERRORS) {
    cleanupProcessedErrors();
  }

  try {
    const errorDetails = {
      name: error.name,
      message: error.message,
      stack: error.stack || errorInfo?.stack,
      ...errorInfo,
    };

    errorMonitoringCallback(error, errorDetails);
    // Помечаем ошибку как обработанную с временной меткой
    processedErrors.set(error, Date.now());
    return true;
  } catch (monitoringError) {
    // Если сам callback выбросил ошибку, логируем её, но не бросаем дальше
    console.error('Error in monitoring callback:', monitoringError);
    return false;
  }
};

/**
 * Извлечение объекта Error из аргументов log.error
 * Оптимизировано: ранний выход для наиболее частого случая
 */
const extractErrorFromArgs = (
  args: unknown[],
  startIndex: number,
): Error | null => {
  // Проверяем первый аргумент (наиболее частый случай)
  const firstArg = args[startIndex];
  if (firstArg instanceof Error) {
    return firstArg;
  }

  // Проверяем остальные аргументы
  for (let i = startIndex; i < args.length; i++) {
    const arg = args[i];
    if (arg instanceof Error) {
      return arg;
    }
    // Проверяем вложенные объекты
    if (typeof arg === 'object' && arg !== null) {
      if ('error' in arg && arg.error instanceof Error) {
        return arg.error;
      }
      if ('err' in arg && arg.err instanceof Error) {
        return arg.err;
      }
    }
  }
  return null;
};

/**
 * Внутренняя функция логирования (переименована из log для избежания конфликта)
 * Оптимизировано: ранний выход, ленивое форматирование, кэширование
 */
const logInternal = (
  level: LogLevel,
  message: string,
  prefix: string | undefined,
  startIndex: number,
  ...args: unknown[]
): void => {
  // Fast path: объединенные проверки для раннего выхода
  // В production пропускаем все логи, кроме ERROR
  // ERROR логи всегда проходят через логгер для будущей интеграции с мониторингом
  if (
    (IS_PRODUCTION && level !== LogLevel.ERROR) ||
    globalConfig.level === LogLevel.NONE ||
    level > globalConfig.level
  ) {
    return;
  }

  // Для ERROR уровня - извлекаем ошибку и отправляем в мониторинг (до форматирования)
  if (level === LogLevel.ERROR) {
    const error = extractErrorFromArgs(args, startIndex);
    if (error) {
      // Извлекаем дополнительную информацию из аргументов
      // Ищем объект, который содержит Error и дополнительные поля
      const additionalInfo: Record<string, unknown> = {};
      for (let i = startIndex; i < args.length; i++) {
        const arg = args[i];
        if (typeof arg === 'object' && arg !== null) {
          // Если это объект с Error и дополнительными полями
          if (arg instanceof Error) {
            // Если сам Error имеет дополнительные поля (расширенный объект)
            const errorObj = arg as Error & Record<string, unknown>;
            // Копируем все нестандартные поля Error
            Object.keys(errorObj).forEach((key) => {
              if (
                key !== 'name' &&
                key !== 'message' &&
                key !== 'stack' &&
                key !== 'cause'
              ) {
                additionalInfo[key] = errorObj[key];
              }
            });
          } else if ('error' in arg && arg.error instanceof Error) {
            // Если Error вложен в объект, копируем остальные поля
            Object.keys(arg).forEach((key) => {
              if (key !== 'error' && key !== 'err') {
                additionalInfo[key] = (arg as Record<string, unknown>)[key];
              }
            });
          } else if ('err' in arg && arg.err instanceof Error) {
            // Аналогично для поля 'err'
            Object.keys(arg).forEach((key) => {
              if (key !== 'error' && key !== 'err') {
                additionalInfo[key] = (arg as Record<string, unknown>)[key];
              }
            });
          } else {
            // Если это объект, который содержит Error как часть расширенного объекта
            // (например, {...errorObj, status: 500})
            const hasErrorFields =
              'name' in arg &&
              'message' in arg &&
              (arg.name === 'Error' ||
                arg.name === 'AxiosError' ||
                arg.name === 'TypeError' ||
                arg.name === 'ReferenceError' ||
                arg.name === 'SyntaxError');
            if (hasErrorFields) {
              // Копируем все поля, кроме стандартных полей Error
              Object.keys(arg).forEach((key) => {
                if (
                  key !== 'name' &&
                  key !== 'message' &&
                  key !== 'stack' &&
                  key !== 'cause'
                ) {
                  additionalInfo[key] = (arg as Record<string, unknown>)[key];
                }
              });
            }
          }
        }
      }

      sendToMonitoring(error, {
        message,
        prefix,
        stack: error.stack,
        ...additionalInfo,
      });
    } else {
      // Если ошибка не найдена в args, создаем новую на основе сообщения
      const errorObj = new Error(message);
      sendToMonitoring(errorObj, {
        message,
        prefix,
        stack: errorObj.stack,
      });
    }
  }

  // Ленивое форматирование: форматируем только если лог пройдет все проверки
  const formattedMessage = globalConfig.formatter(
    level,
    message,
    prefix,
    ...args.slice(startIndex),
  );

  // Определяем, нужно ли использовать цветной вывод (оптимизированная проверка)
  const useColors = shouldUseColors(prefix);

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
          ...args,
        );
      } else {
        console.error(formattedMessage, ...args.slice(startIndex));
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
          ...args,
        );
      } else {
        console.warn(formattedMessage, ...args.slice(startIndex));
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
          ...args,
        );
      } else {
        console.info(formattedMessage, ...args.slice(startIndex));
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
          ...args,
        );
      } else {
        console.log(formattedMessage, ...args.slice(startIndex));
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
          ...args,
        );
      } else {
        console.trace(formattedMessage, ...args.slice(startIndex));
      }
      break;
  }
};

/**
 * Создать логгер с кастомной конфигурацией
 * Возвращает объект с функциями логирования, использующими переданную конфигурацию
 */
export const createLogger = (config?: ILoggerConfig) => {
  const loggerConfig: Required<Omit<ILoggerConfig, 'errorMonitoringCallback'>> =
    {
      ...defaultConfig,
      level: config?.level ?? defaultConfig.level,
      formatter: config?.formatter ?? defaultConfig.formatter,
    };

  // Создаем форматтер, который использует актуальный loggerConfig
  loggerConfig.formatter =
    config?.formatter ||
    ((level: LogLevel, message: string, prefix?: string) => {
      const levelName = LogLevel[level];
      const prefixPart = prefix ? `[${prefix}] ` : '';
      return `${prefixPart}[${levelName}] ${message}`;
    });

  const loggerLog = (
    level: LogLevel,
    message: string,
    prefix: string | undefined,
    startIndex: number,
    ...args: unknown[]
  ): void => {
    // Fast path: объединенные проверки для раннего выхода
    if (
      (IS_PRODUCTION && level !== LogLevel.ERROR) ||
      loggerConfig.level === LogLevel.NONE ||
      level > loggerConfig.level
    ) {
      return;
    }

    // Ленивое форматирование
    const formattedMessage = loggerConfig.formatter(
      level,
      message,
      prefix,
      ...args.slice(startIndex),
    );

    // Оптимизированная проверка цветов
    const useColors = shouldUseColors(prefix);

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
            ...args,
          );
        } else {
          console.error(formattedMessage, ...args.slice(startIndex));
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
            ...args,
          );
        } else {
          console.warn(formattedMessage, ...args.slice(startIndex));
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
            ...args,
          );
        } else {
          console.info(formattedMessage, ...args.slice(startIndex));
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
            ...args,
          );
        } else {
          console.log(formattedMessage, ...args.slice(startIndex));
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
            ...args,
          );
        } else {
          console.trace(formattedMessage, ...args.slice(startIndex));
        }
        break;
    }
  };

  return {
    error: (message: string, ...args: unknown[]) => {
      const { options, startIndex } = extractOptions(args);
      loggerLog(LogLevel.ERROR, message, options?.prefix, startIndex, ...args);
    },
    warn: (message: string, ...args: unknown[]) => {
      const { options, startIndex } = extractOptions(args);
      loggerLog(LogLevel.WARN, message, options?.prefix, startIndex, ...args);
    },
    info: (message: string, ...args: unknown[]) => {
      const { options, startIndex } = extractOptions(args);
      loggerLog(LogLevel.INFO, message, options?.prefix, startIndex, ...args);
    },
    debug: (message: string, ...args: unknown[]) => {
      const { options, startIndex } = extractOptions(args);
      loggerLog(LogLevel.DEBUG, message, options?.prefix, startIndex, ...args);
    },
    trace: (message: string, ...args: unknown[]) => {
      const { options, startIndex } = extractOptions(args);
      loggerLog(LogLevel.TRACE, message, options?.prefix, startIndex, ...args);
    },
    setLevel: (level: LogLevel) => {
      loggerConfig.level = level;
    },
    setConfig: (newConfig: Partial<ILoggerConfig>) => {
      Object.assign(loggerConfig, newConfig);
    },
  };
};
