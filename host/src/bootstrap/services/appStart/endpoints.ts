/**
 * Получает эндпоинт стартового манифеста из переменной окружения или использует значение по умолчанию
 */
export function getAppStartEndpoint(): string {
  return (
    import.meta.env.VITE_APP_START_ENDPOINT ||
    import.meta.env.APP_START_ENDPOINT ||
    '/app/start'
  );
}
