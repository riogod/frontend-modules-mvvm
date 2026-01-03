/**
 * Получает эндпоинт стартового манифеста из переменной окружения или использует значение по умолчанию
 * Работает как в браузере (через import.meta.env), так и в Node.js (через process.env)
 */
export function getAppStartEndpoint(): string {
  // В браузере используем import.meta.env
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return (
      import.meta.env.VITE_APP_START_ENDPOINT ||
      import.meta.env.APP_START_ENDPOINT ||
      '/app/start'
    );
  }

  // В Node.js используем process.env
  if (typeof process !== 'undefined' && process.env) {
    return (
      process.env.VITE_APP_START_ENDPOINT ||
      process.env.APP_START_ENDPOINT ||
      '/app/start'
    );
  }

  // Fallback
  return '/app/start';
}
