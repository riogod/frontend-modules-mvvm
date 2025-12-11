import { LogLevel } from 'libs/core/src/Logger';

// Получаем уровень логирования из переменной окружения LOG_LEVEL
// Поддерживаемые значения: NONE, ERROR, WARN, INFO, DEBUG, TRACE
export const getLogLevelFromEnv = (): LogLevel => {
  // Vite пробрасывает только переменные с префиксом VITE_
  const logLevelEnv =
    import.meta.env.VITE_LOG_LEVEL?.toUpperCase() ||
    import.meta.env.LOG_LEVEL?.toUpperCase();
  // Флаг в localStorage: platform_debug=true/1/on включает DEBUG (удобно в проде)
  let debugFromStorage = false;
  if (typeof window !== 'undefined') {
    const flag = window.localStorage.getItem('platform_debug') || '';
    debugFromStorage = ['true', '1', 'on', 'yes'].includes(flag.toLowerCase());
  }

  if (debugFromStorage) {
    return LogLevel.DEBUG;
  }
  if (!logLevelEnv) {
    return LogLevel.INFO; // Значение по умолчанию
  }

  // Маппинг строковых значений на LogLevel
  const levelMap: Record<string, LogLevel> = {
    NONE: LogLevel.NONE,
    ERROR: LogLevel.ERROR,
    WARN: LogLevel.WARN,
    INFO: LogLevel.INFO,
    DEBUG: LogLevel.DEBUG,
    TRACE: LogLevel.TRACE,
  };
  return levelMap[logLevelEnv] ?? LogLevel.INFO;
};
