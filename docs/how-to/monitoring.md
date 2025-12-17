# Мониторинг ошибок

Руководство по интеграции системы мониторинга ошибок в приложение.

---

## Обзор

Платформа предоставляет встроенный механизм для отправки ошибок во внешние системы мониторинга (Sentry, Rollbar, LogRocket и др.). Механизм автоматически перехватывает:

- Необработанные исключения (`window.onerror`)
- Необработанные промисы (`unhandledrejection`)
- Ошибки, логируемые через `log.error()`

---

## Подключение

Откройте файл `host/src/main.tsx` и раскомментируйте `errorMonitoringCallback`:

```typescript
log.setConfig({
  level: getLogLevelFromEnv(),
  errorMonitoringCallback: (error, errorInfo) => {
    // Отправка ошибки в систему мониторинга
    // Пример для Sentry:
    // Sentry.captureException(error, { extra: errorInfo });
  },
});
```

---

## Интерфейс callback

```typescript
interface IErrorMonitoringCallback {
  (
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
  ): void;
}
```

| Поле                   | Описание                           |
| ---------------------- | ---------------------------------- |
| `error`                | Объект ошибки                      |
| `message`              | Текст сообщения об ошибке          |
| `source`               | Источник ошибки (URL файла)        |
| `lineno`               | Номер строки                       |
| `colno`                | Номер колонки                      |
| `stack`                | Stack trace                        |
| `filename`             | Имя файла                          |
| `isUnhandledRejection` | Флаг необработанного промиса       |
| `prefix`               | Префикс логгера (модуль/компонент) |

---

## Пример с Sentry

```typescript
import * as Sentry from '@sentry/browser';

Sentry.init({
  dsn: 'https://your-dsn@sentry.io/project',
  environment: import.meta.env.MODE,
});

log.setConfig({
  level: getLogLevelFromEnv(),
  errorMonitoringCallback: (error, errorInfo) => {
    Sentry.captureException(error, {
      extra: {
        ...errorInfo,
        userAgent: navigator.userAgent,
      },
    });
  },
});
```

---

## Пример с Rollbar

```typescript
import Rollbar from 'rollbar';

const rollbar = new Rollbar({
  accessToken: 'your-token',
  environment: import.meta.env.MODE,
});

log.setConfig({
  level: getLogLevelFromEnv(),
  errorMonitoringCallback: (error, errorInfo) => {
    rollbar.error(error, errorInfo);
  },
});
```

---

## Дедупликация

Logger автоматически предотвращает дублирование ошибок:

- Каждая ошибка отправляется в мониторинг только один раз
- Кэш обработанных ошибок автоматически очищается (максимум 20 записей)

---

## Игнорирование ошибок

Отменённые запросы (AbortError) автоматически игнорируются и не отправляются в мониторинг.

Для фильтрации других ошибок добавьте проверку в callback:

```typescript
errorMonitoringCallback: (error, errorInfo) => {
  // Игнорировать ошибки сети
  if (error.name === 'NetworkError') return;

  // Игнорировать ошибки из внешних скриптов
  if (errorInfo?.source?.includes('external-script')) return;

  Sentry.captureException(error);
},
```

---

## Связанные разделы

- [Debug режим в Production](./prom-debug-mode.md) — расширенное логирование
- [Подготовка к продакшену](../deployment/production.md) — настройка LOG_LEVEL
- [Core библиотека](../libs/core.md) — Logger API
