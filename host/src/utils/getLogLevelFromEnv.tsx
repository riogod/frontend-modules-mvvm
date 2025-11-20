import { LogLevel } from "libs/core/src/Logger";

// Получаем уровень логирования из переменной окружения LOG_LEVEL
// Поддерживаемые значения: NONE, ERROR, WARN, INFO, DEBUG, TRACE
export const getLogLevelFromEnv = (): LogLevel => {
  const logLevelEnv = import.meta.env.LOG_LEVEL?.toUpperCase();
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
