import { LogLevel } from 'libs/core/src/Logger';

// Получаем уровень логирования из переменной окружения LOG_LEVEL
// Поддерживаемые значения: NONE, ERROR, WARN, INFO, DEBUG, TRACE
export const getLogLevelFromEnv = (): LogLevel => {
  // Vite пробрасывает только переменные с префиксом VITE_
  const logLevelEnv =
    import.meta.env.VITE_LOG_LEVEL?.toUpperCase() ||
    import.meta.env.LOG_LEVEL?.toUpperCase();
  // Флаг в localStorage: platform_debug=true/1/on включает DEBUG (удобно в проде)
  // platform_debug=false/0/off отключает все логи кроме ERROR в production
  let debugFromStorage: boolean | null = null;
  if (typeof window !== 'undefined') {
    const flag = window.localStorage.getItem('platform_debug') || '';
    const flagLower = flag.toLowerCase();
    if (['true', '1', 'on', 'yes'].includes(flagLower)) {
      debugFromStorage = true;
    } else if (['false', '0', 'off', 'no'].includes(flagLower)) {
      debugFromStorage = false;
    }
  }

  // Если platform_debug явно установлен в true, включаем DEBUG
  if (debugFromStorage === true) {
    return LogLevel.DEBUG;
  }

  // Если platform_debug явно установлен в false, в production возвращаем только ERROR
  if (debugFromStorage === false && process.env.NODE_ENV === 'production') {
    return LogLevel.ERROR;
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
