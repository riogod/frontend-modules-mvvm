import { LogLevel } from "libs/core/src/Logger";

// Получаем уровень логирования из переменной окружения DEBUG
// Поддерживаемые значения: NONE, ERROR, WARN, INFO, DEBUG, TRACE
export const getLogLevelFromEnv = (): LogLevel => {
  const debugEnv = (import.meta.env.DEBUG as string | undefined)?.toUpperCase();
  if (!debugEnv) {
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

  return levelMap[debugEnv] ?? LogLevel.INFO;
};
