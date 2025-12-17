# Core библиотека (@platform/core)

Базовая библиотека платформы. Содержит фундаментальные инструменты для работы с API, логирования и общие интерфейсы.

## Подключение

```typescript
import {
  IOC_CORE_TOKENS,
  APIClient,
  HttpMethod,
  executeWithAbortHandling,
  log,
} from '@platform/core';
```

## IOC_CORE_TOKENS

Токены для DI контейнера. Используются для получения общих сервисов платформы.

```typescript
export const IOC_CORE_TOKENS = {
  // API клиент
  APIClient: Symbol.for('APIClient'),

  // Repositories
  REPOSITORY_APP_START: Symbol.for('AppStartRepository'),
  REPOSITORY_LOCAL_STORAGE: Symbol.for('LocalStorageRepository'),

  // Models
  MODEL_ACCESS_CONTROL: Symbol.for('AccessControlModel'),
  MODEL_APP: Symbol.for('AppModel'),
  MODEL_APP_PARAMS: Symbol.for('AppParamsModel'),

  // Feature Flags Usecases
  USECASE_GET_FEATURE_FLAG: Symbol.for('GetFeatureFlagUsecase'),
  USECASE_GET_FEATURE_FLAGS: Symbol.for('GetFeatureFlagsUsecase'),
  USECASE_SET_FEATURE_FLAGS: Symbol.for('SetFeatureFlagsUsecase'),
  USECASE_UPDATE_FEATURE_FLAGS: Symbol.for('UpdateFeatureFlagsUsecase'),
  USECASE_REMOVE_FEATURE_FLAGS: Symbol.for('RemoveFeatureFlagsUsecase'),

  // Permissions Usecases
  USECASE_GET_PERMISSION: Symbol.for('GetPermissionUsecase'),
  USECASE_GET_PERMISSIONS: Symbol.for('GetPermissionsUsecase'),
  USECASE_SET_PERMISSIONS: Symbol.for('SetPermissionsUsecase'),
  USECASE_UPDATE_PERMISSIONS: Symbol.for('UpdatePermissionsUsecase'),
  USECASE_REMOVE_PERMISSIONS: Symbol.for('RemovePermissionsUsecase'),

  // Server Parameters Usecases
  USECASE_GET_PARAM: Symbol.for('GetParamUsecase'),
  USECASE_GET_PARAMS: Symbol.for('GetParamsUsecase'),
  USECASE_SET_PARAMS: Symbol.for('SetParamsUsecase'),
  USECASE_UPDATE_PARAMS: Symbol.for('UpdateParamsUsecase'),
  USECASE_REMOVE_PARAM: Symbol.for('RemoveParamUsecase'),

  // ViewModels
  VIEW_MODEL_APP_SETTINGS: Symbol.for('AppSettingsViewModel'),
  VIEW_MODEL_UI_SETTINGS: Symbol.for('UiSettingsViewModel'),
} as const;
```

### Использование

```typescript
import { inject, injectable } from 'inversify';
import { IOC_CORE_TOKENS } from '@platform/core';

@injectable()
export class MyUsecase {
  constructor(
    @inject(IOC_CORE_TOKENS.MODEL_APP)
    private appModel: AppModel,
  ) {}
}
```

## APIClient

HTTP клиент на базе axios для работы с API.

### Методы

| Метод                  | Описание                               |
| ---------------------- | -------------------------------------- |
| `request<Req, Resp>()` | Выполнить HTTP запрос                  |
| `abortRequest()`       | Отменить запрос по URL                 |
| `abortAllRequests()`   | Отменить все активные запросы          |
| `addErrorCb()`         | Добавить callback для обработки ошибок |

### Использование

```typescript
import { APIClient, HttpMethod } from '@platform/core';

const response = await this.apiClient.request<RequestDTO, ResponseDTO>({
  route: '/api/users',
  method: HttpMethod.GET,
  requestObj: { limit: 10 },
  validationSchema: {
    response: userResponseSchema, // Zod схема
  },
  useAbortController: true, // Автоматическая отмена дублей
});
```

### HttpMethod

```typescript
enum HttpMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  DELETE = 'DELETE',
  PATCH = 'PATCH',
}
```

## executeWithAbortHandling

Утилита для безопасного выполнения асинхронных запросов с обработкой отмены.

```typescript
import { executeWithAbortHandling } from '@platform/core';

private requestIdTracker = { current: 0 };

async execute(): Promise<void> {
  await executeWithAbortHandling({
    requestFn: async () => {
      return await this.repository.getData();
    },
    getPreviousData: () => this.model.data,
    setData: (data) => this.model.setData(data),
    setLoading: (loading) => { this.model.loading = loading; },
    onError: (error) => {
      if (error instanceof Error) {
        this.appModel.notification = error.message;
      }
    },
    requestIdTracker: this.requestIdTracker,
  });
}
```

### Параметры

| Параметр           | Тип                          | Описание                         |
| ------------------ | ---------------------------- | -------------------------------- |
| `requestFn`        | `() => Promise<T>`           | Функция запроса                  |
| `getPreviousData`  | `() => T \| null`            | Получение предыдущих данных      |
| `setData`          | `(data: T) => void`          | Установка данных в Model         |
| `setLoading`       | `(loading: boolean) => void` | Управление состоянием загрузки   |
| `onError`          | `(error: unknown) => void`   | Обработка ошибок (не для отмены) |
| `requestIdTracker` | `{ current: number }`        | Трекер актуальности запроса      |

## Logger (log)

Глобальный логгер с поддержкой уровней логирования и мониторинга ошибок.

### Уровни логирования

```typescript
enum LogLevel {
  NONE = 0,
  ERROR = 1,
  WARN = 2,
  INFO = 3,
  DEBUG = 4,
  TRACE = 5,
}
```

### Использование

```typescript
import { log } from '@platform/core';

// Базовое использование
log.info('User logged in');
log.error('Failed to load data', error);
log.debug('Processing item', { id: 123 });

// С префиксом для фильтрации
log.info('Data loaded', { prefix: 'myModule.usecase' });
log.error('API error', { prefix: 'myModule.repository' }, error);
```

### Методы

| Метод         | Описание                   |
| ------------- | -------------------------- |
| `error()`     | Логирование ошибок         |
| `warn()`      | Логирование предупреждений |
| `info()`      | Информационные сообщения   |
| `debug()`     | Отладочные сообщения       |
| `trace()`     | Трассировочные сообщения   |
| `setLevel()`  | Установить уровень логов   |
| `setConfig()` | Обновить конфигурацию      |

### Конфигурация

```typescript
import { log, LogLevel } from '@platform/core';

// Установить уровень логирования
log.setLevel(LogLevel.DEBUG);

// Установить callback для мониторинга ошибок
log.setConfig({
  level: LogLevel.DEBUG,
  errorMonitoringCallback: (error, details) => {
    // Отправка в Sentry, DataDog и т.д.
    sendToMonitoring(error, details);
  },
});
```

## Типы и интерфейсы

### IBootstrap

Интерфейс Bootstrap объекта для инициализации модулей:

```typescript
export interface IBootstrap {
  readonly di: Container;
  readonly getAPIClient: APIClient;
  readonly i18n: ModuleI18n;
}
```

### IRoute

Интерфейс маршрута (из Router):

```typescript
export interface IRoute {
  name: string;
  path: string;
  pageComponent: LazyExoticComponent<ComponentType>;
  menu?: IMenuItem;
  browserTitle?: string;
  onEnterNode?: (toState, fromState, deps) => Promise<void>;
  onExitNode?: (toState, fromState, deps) => Promise<void>;
}
```

## Связанные разделы

- [Common библиотека](./common.md)
- [UI библиотека](./ui.md)
- [Межмодульное взаимодействие](../modules/inter-module-communication.md)
