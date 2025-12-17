# Server Parameters (Серверные параметры)

Server Parameters — это механизм передачи серверных конфигурационных данных в клиентское приложение при старте.

## Что такое server parameters?

Server Parameters (серверные параметры) — это произвольные конфигурационные данные, передаваемые с сервера при инициализации приложения. В отличие от [фича-флагов](./feature-toggles.md) (булевые переключатели) и [permissions](./permissions.md) (разрешения), параметры могут содержать любые типы значений:

- Строки (`string`)
- Числа (`number`)
- Булевы значения (`boolean`)
- Объекты (`object`)
- Массивы (`array`)

## Для чего используются

| Сценарий                   | Описание                                             |
| -------------------------- | ---------------------------------------------------- |
| **Конфигурация модулей**   | Настройки, специфичные для конкретного модуля        |
| **URL-адреса и endpoints** | Динамические адреса API, CDN, внешних сервисов       |
| **Лимиты и ограничения**   | Максимальное количество элементов, размеры, таймауты |
| **Текстовые значения**     | Сообщения, заголовки, описания, настраиваемые тексты |
| **Настройки UI**           | Количество элементов на странице, размеры, стили     |
| **Интеграции**             | идентификаторы внешних сервисов                      |

## Архитектура

```
┌─────────────────────────────────────────────────────────────┐
│                        Backend/API                          │
│   (params: { "api.url": "https://...", "perPage": 10 })    │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    OnAppStartHandler                        │
│              appParamsModel.setParams(...)                   │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                      AppParamsModel                          │
│    _params: { "api.url": "https://...", "perPage": 10 }    │
│                                                             │
│  • getParam<T>(key)                                         │
│  • getParamsByKeys<T>(keys[])                               │
│  • hasParams(keys)                                          │
└─────────────────────────┬───────────────────────────────────┘
                          │
       ┌──────────────────┼──────────────────┐
       │                  │                  │
       ▼                  ▼                  ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  ViewModel  │    │   UseCase   │    │    View     │
│             │    │             │    │             │
│ Конфигурация│    │ Бизнес-     │    │ Условный    │
│ модуля      │    │ логика      │    │ рендеринг   │
└─────────────┘    └─────────────┘    └─────────────┘
```

## Загрузка параметров

Параметры загружаются при старте приложения в `OnAppStartHandler`:

```typescript
// host/src/bootstrap/handlers/OnAppStartHandler.ts
export class OnAppStartHandler extends AbstractInitHandler {
  async handle(bootstrap: Bootstrap): Promise<Bootstrap> {
    // ... инициализация DI ...

    const appParamsModel = bootstrap.di.get<AppParamsModel>(
      IOC_CORE_TOKENS.MODEL_APP_PARAMS,
    );

    // Загрузка из манифеста или API
    const manifest = bootstrap.getAppStartManifest();

    if (manifest && manifest.data) {
      appParamsModel.setParams(manifest.data.params);
    }

    return await super.handle(bootstrap);
  }
}
```

## Доступные Use Cases

Платформа предоставляет готовые use cases для работы с параметрами:

| Use Case              | Описание                             | Токен DI                                |
| --------------------- | ------------------------------------ | --------------------------------------- |
| `GetParamUsecase`     | Получить значение одного параметра   | `IOC_CORE_TOKENS.USECASE_GET_PARAM`     |
| `GetParamsUsecase`    | Получить значения по массиву ключей  | `IOC_CORE_TOKENS.USECASE_GET_PARAMS`    |
| `SetParamsUsecase`    | Установить параметры (полная замена) | `IOC_CORE_TOKENS.USECASE_SET_PARAMS`    |
| `UpdateParamsUsecase` | Обновить параметры (слияние)         | `IOC_CORE_TOKENS.USECASE_UPDATE_PARAMS` |
| `RemoveParamUsecase`  | Удалить параметр                     | `IOC_CORE_TOKENS.USECASE_REMOVE_PARAM`  |

---

## Использование на уровне ViewModel

ViewModel предоставляет реактивные свойства для работы с параметрами:

```typescript
import { makeAutoObservable } from 'mobx';
import { inject, injectable } from 'inversify';
import { IOC_CORE_TOKENS } from '@platform/core';
import type { GetParamUsecase, GetParamsUsecase } from '@platform/common';

@injectable()
export class JokeViewModel {
  constructor(
    @inject(IOC_CORE_TOKENS.USECASE_GET_PARAM)
    private getParamUsecase: GetParamUsecase,
    @inject(IOC_CORE_TOKENS.USECASE_GET_PARAMS)
    private getParamsUsecase: GetParamsUsecase,
  ) {
    makeAutoObservable(this);
  }

  // Реактивный геттер для одного параметра с типизацией
  get apiUrl(): string {
    return this.getParamUsecase.execute<string>('api.module.url') || '';
  }

  // Реактивный геттер для параметра с дефолтным значением
  get itemsPerPage(): number {
    return this.getParamUsecase.execute<number>('todo.perPage') || 10;
  }

  // Реактивный геттер для группы параметров
  get config(): Record<string, unknown> {
    return this.getParamsUsecase.execute<unknown>([
      'api.module.url',
      'api.module.timeout',
      'api.module.retries',
    ]);
  }

  // Вычисляемое свойство на основе параметров
  get requestConfig() {
    const config = this.config;
    return {
      url: config['api.module.url'] as string,
      timeout: (config['api.module.timeout'] as number) || 5000,
      retries: (config['api.module.retries'] as number) || 3,
    };
  }
}
```

> **Примечание**: Благодаря MobX реактивности, UI автоматически обновится при изменении параметров.

---

## Использование на уровне View

### Через ViewModel (рекомендуется)

Получайте параметры через ViewModel — это обеспечивает разделение ответственности:

```tsx
import { type FC } from 'react';
import { observer } from 'mobx-react-lite';
import { useVM, Box, Typography } from '@platform/ui';
import type { JokeViewModel } from '../viewmodels/joke.vm';
import { JOKE_DI_TOKENS } from '../config/di.tokens';

const JokeMessage: FC = observer(() => {
  const vm = useVM<JokeViewModel>(JOKE_DI_TOKENS.VIEW_MODEL_JOKE);

  return (
    <Box>
      {/* Отображение параметра из сервера */}
      <Typography variant="body2">Параметр: {vm.paramValue}</Typography>

      {/* Использование параметра в логике */}
      {vm.itemsPerPage > 20 && (
        <Typography variant="caption">
          Большой размер страницы: {vm.itemsPerPage}
        </Typography>
      )}

      {/* Использование конфигурации */}
      <ApiClient config={vm.requestConfig} />
    </Box>
  );
});

export default JokeMessage;
```

### Прямой доступ к AppParamsModel

Можно получить параметры напрямую:

```tsx
import { type FC } from 'react';
import { observer } from 'mobx-react-lite';
import { useVM } from '@platform/ui';
import { IOC_CORE_TOKENS } from '@platform/core';
import type { AppParamsModel } from '@platform/common';

const ConfigDisplay: FC = observer(() => {
  const appParams = useVM<AppParamsModel>(IOC_CORE_TOKENS.MODEL_APP_PARAMS);

  // Получение одного параметра с типизацией
  const apiUrl = appParams.getParamTyped<string>('api.module.url');
  const timeout = appParams.getParamTyped<number>('api.module.timeout') || 5000;

  // Проверка наличия параметров
  const hasConfig = appParams.hasParams([
    'api.module.url',
    'api.module.timeout',
  ]);

  if (!hasConfig) {
    return <div>Конфигурация не загружена</div>;
  }

  return (
    <div>
      <p>API URL: {apiUrl}</p>
      <p>Timeout: {timeout}ms</p>
    </div>
  );
});

export default ConfigDisplay;
```

> **Важно**: Оборачивайте компонент в `observer()` из `mobx-react-lite` для реактивных обновлений.

---

## Типизация параметров

### Использование дженериков

Все методы получения параметров поддерживают типизацию через дженерики:

```typescript
// Строковый параметр
const apiUrl = getParamUsecase.execute<string>('api.module.url');

// Числовой параметр
const perPage = getParamUsecase.execute<number>('todo.perPage');

// Булев параметр
const enabled = getParamUsecase.execute<boolean>('feature.enabled');

// Объект
interface Config {
  url: string;
  timeout: number;
}
const config = getParamUsecase.execute<Config>('api.config');

// Массив
const items = getParamUsecase.execute<string[]>('menu.items');
```

### Получение нескольких параметров

Для получения группы параметров используйте `GetParamsUsecase`:

```typescript
// Получение нескольких параметров одного типа
const stringParams = getParamsUsecase.execute<string>([
  'api.module.url',
  'api.module.version',
  'api.module.environment',
]);

// Результат: { "api.module.url": string | undefined, ... }

// Использование с разными типами
const url = getParamUsecase.execute<string>('api.module.url');
const timeout = getParamUsecase.execute<number>('api.module.timeout');
const enabled = getParamUsecase.execute<boolean>('api.module.enabled');
```

---

## Именование параметров

### Формат ключей

Ключи параметров должны следовать единому формату для обеспечения уникальности и читаемости:

**Формат:** `<module>.<feature>.<property>`

| Часть      | Описание                      | Пример                        |
| ---------- | ----------------------------- | ----------------------------- |
| `module`   | Название модуля или домена    | `api`, `todo`, `core`, `ui`   |
| `feature`  | Название функции или сущности | `module`, `request`, `export` |
| `property` | Конкретное свойство           | `url`, `timeout`, `perPage`   |

### Примеры

```typescript
// Параметры для модуля API
'api.module.url'; // URL API сервера
'api.module.timeout'; // Таймаут запросов
'api.module.retries'; // Количество повторов

// Параметры для модуля задач
'todo.perPage'; // Элементов на странице
'todo.maxItems'; // Максимальное количество задач
'todo.exportFormats'; // Доступные форматы экспорта

// Параметры для ядра приложения
'core.apiUrl'; // Базовый URL API
'core.cdnUrl'; // URL CDN для статики
'core.environment'; // Окружение (dev, staging, prod)

// Параметры для UI
'ui.theme.default'; // Тема по умолчанию
'ui.pagination.size'; // Размер пагинации
'ui.notifications.duration'; // Длительность уведомлений
```

---

## Примеры использования

### Конфигурация API клиента

```typescript
@injectable()
export class ApiClientViewModel {
  constructor(
    @inject(IOC_CORE_TOKENS.USECASE_GET_PARAM)
    private getParamUsecase: GetParamUsecase,
  ) {
    makeAutoObservable(this);
  }

  get apiConfig() {
    return {
      baseUrl:
        this.getParamUsecase.execute<string>('api.module.url') ||
        'https://api.example.com',
      timeout:
        this.getParamUsecase.execute<number>('api.module.timeout') || 5000,
      retries: this.getParamUsecase.execute<number>('api.module.retries') || 3,
    };
  }
}
```

---

## Лучшие практики

### ✅ Правильно

```typescript
// Используйте типизацию для безопасности типов
const apiUrl = getParamUsecase.execute<string>('api.module.url');

// Предоставляйте дефолтные значения
const timeout = getParamUsecase.execute<number>('api.module.timeout') || 5000;

// Используйте осмысленные имена с namespace
const perPage = getParamUsecase.execute<number>('todo.perPage');

// Группируйте связанные параметры
const config = getParamsUsecase.execute<unknown>([
  'api.module.url',
  'api.module.timeout',
]);

// Проверяйте наличие параметров перед использованием
if (appParams.hasParams(['api.module.url'])) {
  const url = appParams.getParamTyped<string>('api.module.url');
}
```

### ❌ Неправильно

```typescript
// Хардкод значений в коде — используйте параметры
const apiUrl = 'https://api.example.com'; // ❌

// Отсутствие типизации — может привести к ошибкам
const timeout = getParamUsecase.execute('api.module.timeout'); // ❌

// Слишком общие имена без namespace
const url = getParamUsecase.execute<string>('url'); // ❌

// Игнорирование отсутствующих параметров
const url = getParamUsecase.execute<string>('api.module.url');
url.toUpperCase(); // ❌ Может быть undefined

// Использование параметров для бизнес-логики
// Параметры — для конфигурации, не для условий
if (getParamUsecase.execute<boolean>('user.canDelete')) {
  // ❌
  // Это должно быть permission, а не parameter
}
```

## Связанные разделы

- [Конфигурация модуля](../modules/module-config.md) — настройка параметров в манифесте
- [Common библиотека](../libs/common.md) — модели и use cases
- [MVVM паттерн](../modules/mvvm-pattern.md) — архитектура слоёв
- [Создание сервиса манифестов](../how-to/create-mainifest-service.md) — структура AppStartDTO
