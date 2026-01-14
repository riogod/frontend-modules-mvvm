import { type FC } from 'react';
import { Container, Typography, Paper } from '@platform/ui';
import { useTranslation } from 'react-i18next';
import { MarkdownRenderer } from '../../common';

const pageMarkdown = `# Common библиотека (@platform/common)

Библиотека общих сущностей (моделей данных, use cases и т.д.) для работы.

## Подключение

\`\`\`typescript
import {
  AccessControlModel,
  GetFeatureFlagUsecase,
  GetPermissionUsecase,
  AppParamsModel,
  GetParamUsecase,
  GetParamsUsecase,
  SetParamsUsecase,
} from '@platform/common';
\`\`\`

## Use Cases

### Feature Flag Use Cases

| Use Case                    | Описание                      |
| --------------------------- | ----------------------------- |
| \`GetFeatureFlagUsecase\`     | Получить значение одного flag |
| \`GetFeatureFlagsUsecase\`    | Получить значения по enum     |
| \`SetFeatureFlagsUsecase\`    | Установить flags (замена)     |
| \`UpdateFeatureFlagsUsecase\` | Обновить flags (слияние)      |
| \`RemoveFeatureFlagsUsecase\` | Удалить flags                 |

### Использование в модуле

\`\`\`typescript
import { inject, injectable } from 'inversify';
import { IOC_CORE_TOKENS } from '@platform/core';
import type { GetFeatureFlagUsecase } from '@platform/common';

@injectable()
export class MyViewModel {
  constructor(
    @inject(IOC_CORE_TOKENS.USECASE_GET_FEATURE_FLAG)
    private getFeatureFlagUsecase: GetFeatureFlagUsecase,
  ) {}

  get isNewFeatureEnabled(): boolean {
    return this.getFeatureFlagUsecase.execute('my.new.feature');
  }
}
\`\`\`

### Permission Use Cases

| Use Case                   | Описание                            |
| -------------------------- | ----------------------------------- |
| \`GetPermissionUsecase\`     | Получить значение одного permission |
| \`GetPermissionsUsecase\`    | Получить значения по enum           |
| \`SetPermissionsUsecase\`    | Установить permissions (замена)     |
| \`UpdatePermissionsUsecase\` | Обновить permissions (слияние)      |
| \`RemovePermissionsUsecase\` | Удалить permissions                 |

### Использование в модуле

\`\`\`typescript
import { inject, injectable } from 'inversify';
import { IOC_CORE_TOKENS } from '@platform/core';
import type { GetPermissionUsecase } from '@platform/common';

@injectable()
export class MyViewModel {
  constructor(
    @inject(IOC_CORE_TOKENS.USECASE_GET_PERMISSION)
    private getPermissionUsecase: GetPermissionUsecase,
  ) {}

  get canCreateUser(): boolean {
    return this.getPermissionUsecase.execute('user.create');
  }
}
\`\`\`

## Проверка доступа в View

\`\`\`typescript
import { observer } from 'mobx-react-lite';
import { useVM } from '@platform/ui';
import { IOC_CORE_TOKENS } from '@platform/core';
import type { AccessControlModel } from '@platform/common';

const MyComponent: FC = observer(() => {
  const accessControl = useVM<AccessControlModel>(IOC_CORE_TOKENS.MODEL_ACCESS_CONTROL);

  if (!accessControl.getFeatureFlag('my.feature')) {
    return null;
  }

  if (!accessControl.getPermission('action.perform')) {
    return <div>Нет доступа</div>;
  }

  return <div>Контент доступен</div>;
});
\`\`\`

### Server Parameters Use Cases

| Use Case              | Описание                             |
| --------------------- | ------------------------------------ |
| \`GetParamUsecase\`     | Получить значение одного параметра   |
| \`GetParamsUsecase\`    | Получить значения нескольких параметров |
| \`SetParamsUsecase\`    | Установить параметры (замена)        |
| \`UpdateParamsUsecase\` | Обновить параметры (слияние)         |
| \`RemoveParamUsecase\`  | Удалить параметр                     |

### Использование в модуле

\`\`\`typescript
import { inject, injectable } from 'inversify';
import { IOC_CORE_TOKENS } from '@platform/core';
import type { GetParamUsecase } from '@platform/common';

@injectable()
export class MyViewModel {
  constructor(
    @inject(IOC_CORE_TOKENS.USECASE_GET_PARAM)
    private getParamUsecase: GetParamUsecase,
  ) {}

  get apiUrl(): string {
    return this.getParamUsecase.execute<string>('api.module.url') || '';
  }
}
\`\`\`

> **Подробнее:** См. Server Parameters для детального описания работы с серверными параметрами.

## Типы

### AccessControlsType

\`\`\`typescript
type AccessControlsType = Record<string, boolean>;
\`\`\`

---

# Core библиотека (@platform/core)

Базовая библиотека платформы. Содержит фундаментальные инструменты для работы с API, логирования и общие интерфейсы.

## Подключение

\`\`\`typescript
import {
  IOC_CORE_TOKENS,
  APIClient,
  HttpMethod,
  executeWithAbortHandling,
  log,
} from '@platform/core';
\`\`\`

## IOC_CORE_TOKENS

Токены для DI контейнера. Используются для получения общих сервисов платформы.

\`\`\`typescript
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
\`\`\`

### Использование

\`\`\`typescript
import { inject, injectable } from 'inversify';
import { IOC_CORE_TOKENS } from '@platform/core';

@injectable()
export class MyUsecase {
  constructor(
    @inject(IOC_CORE_TOKENS.MODEL_APP)
    private appModel: AppModel,
  ) {}
}
\`\`\`

## APIClient

HTTP клиент на базе axios для работы с API.

### Методы

| Метод                  | Описание                               |
| ---------------------- | -------------------------------------- |
| \`request<Req, Resp>()\` | Выполнить HTTP запрос                  |
| \`abortRequest()\`       | Отменить запрос по URL                 |
| \`abortAllRequests()\`   | Отменить все активные запросы          |
| \`addErrorCb()\`         | Добавить callback для обработки ошибок |

### Использование

\`\`\`typescript
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
\`\`\`

### HttpMethod

\`\`\`typescript
enum HttpMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  DELETE = 'DELETE',
  PATCH = 'PATCH',
}
\`\`\`

## executeWithAbortHandling

Утилита для безопасного выполнения асинхронных запросов с обработкой отмены.

\`\`\`typescript
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
\`\`\`

### Параметры

| Параметр           | Тип                          | Описание                         |
| ------------------ | ---------------------------- | -------------------------------- |
| \`requestFn\`        | \`() => Promise<T>\`           | Функция запроса                  |
| \`getPreviousData\`  | \`() => T | null\`            | Получение предыдущих данных      |
| \`setData\`          | \`(data: T) => void\`          | Установка данных в Model         |
| \`setLoading\`       | \`(loading: boolean) => void\` | Управление состоянием загрузки   |
| \`onError\`          | \`(error: unknown) => void\`   | Обработка ошибок (не для отмены) |
| \`requestIdTracker\` | \`{ current: number }\`        | Трекер актуальности запроса      |

## Logger (log)

Глобальный логгер с поддержкой уровней логирования и мониторинга ошибок.

### Уровни логирования

\`\`\`typescript
enum LogLevel {
  NONE = 0,
  ERROR = 1,
  WARN = 2,
  INFO = 3,
  DEBUG = 4,
  TRACE = 5,
}
\`\`\`

### Использование

\`\`\`typescript
import { log } from '@platform/core';

// Базовое использование
log.info('User logged in');
log.error('Failed to load data', error);
log.debug('Processing item', { id: 123 });

// С префиксом для фильтрации
log.info('Data loaded', { prefix: 'myModule.usecase' });
log.error('API error', { prefix: 'myModule.repository' }, error);
\`\`\`

### Методы

| Метод         | Описание                   |
| ------------- | -------------------------- |
| \`error()\`     | Логирование ошибок         |
| \`warn()\`      | Логирование предупреждений |
| \`info()\`      | Информационные сообщения   |
| \`debug()\`     | Отладочные сообщения       |
| \`trace()\`     | Трассировочные сообщения   |
| \`setLevel()\`  | Установить уровень логов   |
| \`setConfig()\` | Обновить конфигурацию      |

### Конфигурация

\`\`\`typescript
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
\`\`\`

## Типы и интерфейсы

### IBootstrap

Интерфейс Bootstrap объекта для инициализации модулей:

\`\`\`typescript
export interface IBootstrap {
  readonly di: Container;
  readonly getAPIClient: APIClient;
  readonly i18n: ModuleI18n;
}
\`\`\`

### IRoute

Интерфейс маршрута (из Router):

\`\`\`typescript
export interface IRoute {
  name: string;
  path: string;
  pageComponent: LazyExoticComponent<ComponentType>;
  menu?: IMenuItem;
  browserTitle?: string;
  onEnterNode?: (toState, fromState, deps) => Promise<void>;
  onExitNode?: (toState, fromState, deps) => Promise<void>;
}
\`\`\`


---

# Создание своих библиотек

Руководство по созданию и подключению собственных библиотек в платформе.

## Когда создавать библиотеку

| Сценарий                               | Решение           |
| -------------------------------------- | ----------------- |
| Код используется в нескольких модулях  | Библиотека        |
| Код используется только в одном модуле | Оставить в модуле |
| Утилиты общего назначения              | Библиотека        |
| Shared UI компоненты                   | Библиотека        |
| Бизнес-логика конкретного домена       | Модуль            |

## Структура библиотеки

\`\`\`
libs/
└── my-lib/
    ├── src/
    │   ├── index.ts           # Точка входа (экспорты)
    │   ├── MyComponent/
    │   │   ├── index.ts
    │   │   └── MyComponent.tsx
    │   └── utils/
    │       ├── index.ts
    │       └── helper.ts
    ├── package.json
    ├── tsconfig.json
    ├── tsconfig.lib.json
    ├── tsconfig.spec.json
    ├── vite.config.mts
    └── vitest.config.ts
\`\`\`

## Шаг 1: Создание папки

\`\`\`bash
mkdir -p libs/my-lib/src
\`\`\`

## Шаг 2: package.json

\`\`\`json
{
  "name": "@platform/my-lib",
  "description": "Описание библиотеки",
  "keywords": ["my-lib"],
  "version": "0.0.1",
  "main": "./index.js",
  "types": "./index.d.ts",
  "type": "module",
  "exports": {
    ".": {
      "import": "./index.mjs",
      "require": "./index.js"
    }
  }
}
\`\`\`

> Имя библиотеки должно начинаться с \`@platform/\` для единообразия.

## Шаг 3: tsconfig.json

\`\`\`json
{
  "compilerOptions": {
    "jsx": "react-jsx",
    "allowJs": false,
    "esModuleInterop": false,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "types": ["node"],
    "composite": true,
    "declaration": true,
    "declarationMap": true,
    "outDir": "../../dist/out-tsc",
    "baseUrl": "."
  },
  "files": ["src/index.ts"],
  "include": ["src/**/*.ts", "src/**/*.tsx"],
  "exclude": [
    "src/**/*.spec.ts",
    "src/**/*.test.ts",
    "src/**/*.spec.tsx",
    "src/**/*.test.tsx"
  ],
  "references": [
    {
      "path": "./tsconfig.spec.json"
    }
  ],
  "extends": "../../tsconfig.base.json"
}
\`\`\`

## Шаг 4: tsconfig.lib.json

\`\`\`json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "declaration": true,
    "declarationMap": true,
    "types": ["node"]
  },
  "exclude": [
    "src/**/*.spec.ts",
    "src/**/*.test.ts",
    "src/**/*.spec.tsx",
    "src/**/*.test.tsx",
    "**/*.stories.tsx",
    "**/*.stories.ts"
  ]
}
\`\`\`

## Шаг 5: tsconfig.spec.json

\`\`\`json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "outDir": "../../dist/out-tsc",
    "types": ["vitest/globals", "node"]
  },
  "include": [
    "vitest.setup.mts",
    "src/**/*.test.ts",
    "src/**/*.spec.ts",
    "src/**/*.test.tsx",
    "src/**/*.spec.tsx",
    "src/**/*.d.ts"
  ]
}
\`\`\`

## Шаг 6: vite.config.mts

\`\`\`typescript
/// <reference types='vitest' />
import { defineConfig } from 'vite';
import { createViteConfig } from '@platform/vite-config';

export default defineConfig(
  createViteConfig({
    type: 'lib',
    dirname: __dirname,
    libName: 'my-lib',
    // Опционально: путь к локальному конфигу для расширения
    localConfigPath: './vite.config.local.mts',
  }),
);
\`\`\`

## Шаг 7: vitest.config.ts

\`\`\`typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.mts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
  },
});
\`\`\`

## Шаг 8: vitest.setup.mts

\`\`\`typescript
import '@testing-library/jest-dom';
\`\`\`

## Шаг 9: Точка входа (src/index.ts)

\`\`\`typescript
// Экспортируйте всё, что должно быть доступно из библиотеки
export * from './MyComponent';
export * from './utils';
export { MY_CONSTANTS } from './constants';
\`\`\`

## Шаг 10: Регистрация алиаса

Добавьте алиас в \`tsconfig.base.json\`:

\`\`\`json
{
  "compilerOptions": {
    "paths": {
      "@platform/my-lib": ["libs/my-lib/src/index.ts"]
    }
  }
}
\`\`\`

> После изменения \`tsconfig.base.json\` выполните \`npm run sync:tsconfig-paths\` для синхронизации алиасов.

## Шаг 11: Регистрация workspace

Библиотека автоматически подключается через \`workspaces\` в корневом \`package.json\`:

\`\`\`json
{
  "workspaces": ["libs/*"]
}
\`\`\`

## Использование в модулях

После создания библиотеки импортируйте её в модулях:

\`\`\`typescript
import { MyComponent, myHelper } from '@platform/my-lib';
\`\`\`

## Команды для работы с библиотеками

| Команда                      | Описание                    |
| ---------------------------- | --------------------------- |
| \`npm run lint:lib -- my-lib\` | Линтинг библиотеки          |
| \`npm run lint:libs\`          | Линтинг всех библиотек      |
| \`npm run test:lib -- my-lib\` | Тестирование библиотеки     |
| \`npm run test:libs\`          | Тестирование всех библиотек |

## Зависимости между библиотеками

Библиотека может использовать другие библиотеки платформы:

\`\`\`typescript
// libs/my-lib/src/MyComponent.tsx
import { useVM } from '@platform/ui';
import { IOC_CORE_TOKENS } from '@platform/core';
\`\`\`

### Порядок зависимостей

\`\`\`
@platform/core      ← Базовая библиотека (без зависимостей от других @platform/*)
     ↓
@platform/common    ← Зависит от core
     ↓
@platform/ui        ← Зависит от core, common
     ↓
@platform/share     ← Зависит от core, ui
     ↓
@platform/my-lib    ← Ваша библиотека
\`\`\`

> Избегайте циклических зависимостей между библиотеками.

## Шаринг через Module Federation

Чтобы библиотека была доступна remote модулям (MFE), её нужно зарегистрировать в shared scope Module Federation.

### Шаг 1: Добавьте в конфигурацию host

Откройте \`config/vite-config/host.config.js\` и добавьте библиотеку в \`federationShared\`:

\`\`\`javascript
const federationShared = {
  // ... существующие зависимости ...

  // Ваша библиотека
  '@platform/my-lib': { singleton: true, requiredVersion: false, eager: true },
};
\`\`\`

### Шаг 2: Зарегистрируйте в FederationSharedHandler

Откройте \`host/src/bootstrap/handlers/FederationSharedHandler.ts\`:

1. Добавьте импорт:

\`\`\`typescript
import * as platformMyLib from '@platform/my-lib';
\`\`\`

2. Зарегистрируйте в \`initFederationSharedProd()\`:

\`\`\`typescript
private initFederationSharedProd(): void {
  // ... существующий код ...

  registerSharedModule(scope, '@platform/my-lib', platformMyLib);
}
\`\`\`

3. Зарегистрируйте в \`initFederationSharedDev()\`:

\`\`\`typescript
private initFederationSharedDev(): void {
  // ... существующий код ...

  registerSharedModule(
    defaultScope,
    '@platform/my-lib',
    platformMyLib,
    versionKey,
    meta,
  );
}
\`\`\`

### Параметры shared

| Параметр          | Значение | Описание                                |
| ----------------- | -------- | --------------------------------------- |
| \`singleton\`       | \`true\`   | Одна версия библиотеки для всех модулей |
| \`requiredVersion\` | \`false\`  | Не проверять версию                     |
| \`eager\`           | \`true\`   | Загружать немедленно до remote модулей  |

### Когда нужен шаринг

| Сценарий                                    | Нужен шаринг |
| ------------------------------------------- | ------------ |
| Библиотека содержит React контексты         | Да           |
| Библиотека содержит глобальное состояние    | Да           |
| Библиотека используется в remote модулях    | Да           |
| Библиотека используется только в host/local | Нет          |
| Утилиты без состояния                       | Опционально  |

> **Важно:** Если библиотека содержит React контексты (как \`@platform/ui\` с \`DIContext\`), шаринг обязателен. Без этого remote модули получат отдельный экземпляр контекста.

## Типичные ошибки

### ❌ Импорт из src

\`\`\`typescript
// Неправильно — импорт из src
import { MyComponent } from '@platform/my-lib/src/MyComponent';
\`\`\`

### ✅ Импорт через index

\`\`\`typescript
// Правильно — через точку входа
import { MyComponent } from '@platform/my-lib';
\`\`\`

### ❌ Забыли экспорт

\`\`\`typescript
// src/MyComponent.tsx
export const MyComponent = () => <div>Hello</div>;

// src/index.ts — забыли добавить экспорт!
// export * from './MyComponent';
\`\`\`

### ✅ Добавьте экспорт

\`\`\`typescript
// src/index.ts
export * from './MyComponent';
\`\`\`


---

# Share библиотека (@platform/share)

Библиотека общих ресурсов и компонентов, которые используются на уровне приложения.

## Подключение

\`\`\`typescript
import { ThemeSchema } from '@platform/share';
\`\`\`

## ThemeSchema

Компонент для подключения темы приложения с автоматической синхронизацией CSS переменных.

### Назначение

- Подключает светлую или тёмную тему MUI в зависимости от настроек пользователя
- Синхронизирует CSS переменные с темой MUI для использования в CSS Modules
- Реактивно переключает тему через MobX

### Использование

\`\`\`typescript
import { ThemeSchema } from '@platform/share';

const App: FC = () => (
  <ThemeSchema>
    <YourAppContent />
  </ThemeSchema>
);
\`\`\`

### Как это работает

\`\`\`typescript
import { type FC, type ReactNode } from 'react';
import { Observer } from 'mobx-react-lite';
import {
  themeDark,
  themeLight,
  ThemeProvider,
  useVM,
  CssVariablesSync,
} from '@platform/ui';
import { IOC_CORE_TOKENS } from '@platform/core';

const ThemeSchema: FC<{ children?: ReactNode }> = ({ children }) => {
  // Получаем ViewModel с настройками UI
  const ui = useVM<UiSettingsViewModel>(IOC_CORE_TOKENS.VIEW_MODEL_UI_SETTINGS);

  return (
    <Observer>
      {() => (
        // Выбираем тему на основе настроек
        <ThemeProvider theme={ui.themeMode === 'dark' ? themeDark : themeLight}>
          {/* Синхронизируем CSS переменные */}
          <CssVariablesSync />
          {children}
        </ThemeProvider>
      )}
    </Observer>
  );
};
\`\`\`

### Доступные режимы

| Режим   | Описание                                   |
| ------- | ------------------------------------------ |
| \`light\` | Светлая тема                               |
| \`dark\`  | Тёмная тема                                |

### Переключение темы

\`\`\`typescript
import { useVM } from '@platform/ui';
import { IOC_CORE_TOKENS } from '@platform/core';

const ThemeToggle: FC = observer(() => {
  const ui = useVM<UiSettingsViewModel>(IOC_CORE_TOKENS.VIEW_MODEL_UI_SETTINGS);

  const toggleTheme = () => {
    ui.setThemeMode(ui.themeMode === 'dark' ? 'light' : 'dark');
  };

  return (
    <Button onClick={toggleTheme}>
      {ui.themeMode === 'dark' ? 'Светлая тема' : 'Тёмная тема'}
    </Button>
  );
});
\`\`\`

## CSS переменные

После инициализации \`ThemeSchema\` доступны CSS переменные MUI темы:

\`\`\`css
.myComponent {
  background-color: var(--mui-palette-background-paper);
  color: var(--mui-palette-text-primary);
  border: 1px solid var(--mui-palette-divider);
}
\`\`\`

### Доступные переменные

| Переменная                           | Описание               |
| ------------------------------------ | ---------------------- |
| \`--mui-palette-primary-main\`         | Основной цвет          |
| \`--mui-palette-secondary-main\`       | Вторичный цвет         |
| \`--mui-palette-background-default\`   | Фон приложения         |
| \`--mui-palette-background-paper\`     | Фон карточек           |
| \`--mui-palette-text-primary\`         | Основной текст         |
| \`--mui-palette-text-secondary\`       | Вторичный текст        |
| \`--mui-palette-divider\`              | Разделители            |
| \`--mui-palette-error-main\`           | Цвет ошибок            |
| \`--mui-palette-warning-main\`         | Цвет предупреждений    |
| \`--mui-palette-success-main\`         | Цвет успеха            |



---

# UI библиотека (@platform/ui)

Библиотека React компонентов, хуков и провайдеров для построения UI.

## Подключение

\`\`\`typescript
import {
  useVM,
  useSharedComponent,
  DIProvider,
  ThemeProvider,
  themeDark,
  themeLight,
} from '@platform/ui';
\`\`\`

## Хуки

### useVM

Хук для получения зависимостей из DI контейнера.

\`\`\`typescript
import { useVM } from '@platform/ui';
import type { MyViewModel } from '../viewmodels/my.vm';
import { MY_DI_TOKENS } from '../config/di.tokens';

const MyComponent: FC = () => {
  const viewModel = useVM<MyViewModel>(MY_DI_TOKENS.VIEW_MODEL);

  return <div>{viewModel.data}</div>;
};
\`\`\`

### useSharedComponent

Хук для получения shared UI-компонентов из DI контейнера между модулями.

\`\`\`typescript
import { useSharedComponent } from '@platform/ui';
import { Suspense } from 'react';

const MyPage: FC = () => {
  const SharedButton = useSharedComponent<ButtonProps>('SharedButtonComponent', {
    moduleName: 'shared-ui',
    fallback: <button>Fallback</button>,
  });

  return (
    <Suspense fallback={<div>Загрузка...</div>}>
      {SharedButton && <SharedButton onClick={handleClick} />}
    </Suspense>
  );
};
\`\`\`

#### Опции useSharedComponent

| Опция               | Тип         | По умолчанию | Описание                             |
| ------------------- | ----------- | ------------ | ------------------------------------ |
| \`moduleName\`        | \`string\`    | -            | Имя модуля для диагностики ошибок    |
| \`fallback\`          | \`ReactNode\` | -            | Fallback компонент, если не найден   |
| \`suppressErrors\`    | \`boolean\`   | \`true\`       | Подавлять ошибки и возвращать null   |
| \`validateComponent\` | \`boolean\`   | \`true\`       | Валидировать что это React компонент |

## Провайдеры

### DIProvider

Провайдер DI контейнера для React-дерева.

\`\`\`typescript
import { DIProvider } from '@platform/ui';

const App: FC = () => (
  <DIProvider container={bootstrap.di}>
    <MyComponent />
  </DIProvider>
);
\`\`\`

### ThemeProvider

Провайдер темы Material UI.

\`\`\`typescript
import { ThemeProvider, themeDark, themeLight } from '@platform/ui';

const App: FC = () => (
  <ThemeProvider theme={isDark ? themeDark : themeLight}>
    <MyComponent />
  </ThemeProvider>
);
\`\`\`

## Темы

### Доступные темы

| Тема         | Описание     |
| ------------ | ------------ |
| \`themeLight\` | Светлая тема |
| \`themeDark\`  | Тёмная тема  |
| \`theme\`      | Базовая тема |

### CssVariablesSync

Компонент для синхронизации CSS переменных с темой MUI.

\`\`\`typescript
import { CssVariablesSync } from '@platform/ui';

const App: FC = () => (
  <ThemeProvider theme={themeLight}>
    <CssVariablesSync />
    <MyComponent />
  </ThemeProvider>
);
\`\`\`

### Создание кастомной темы

\`\`\`typescript
import { createTheme } from '@platform/ui';

const customTheme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
  },
});
\`\`\`

## Компоненты

### ErrorBoundary

Компонент для перехвата ошибок в React-дереве.

\`\`\`typescript
import { ErrorBoundary } from '@platform/ui';

const App: FC = () => (
  <ErrorBoundary fallback={<div>Что-то пошло не так</div>}>
    <MyComponent />
  </ErrorBoundary>
);
\`\`\`

### IconButton

Кастомный компонент кнопки с иконкой.

\`\`\`typescript
import { IconButton } from '@platform/ui';
import { DeleteIcon } from '@platform/ui';

const MyComponent: FC = () => (
  <IconButton onClick={handleDelete}>
    <DeleteIcon />
  </IconButton>
);
\`\`\`

## MUI компоненты

Библиотека переэкспортирует компоненты Material UI:

\`\`\`typescript
import {
  Box,
  Container,
  Grid,
  Stack,
  Paper,
  TextField,
  Button,
  Typography,
  Card,
  CardContent,
  Dialog,
  Alert,
  Snackbar,
  // ... и многие другие
} from '@platform/ui';
\`\`\`

### Список компонентов

**Layout:** Box, Container, Grid, Stack, Paper

**Inputs:** TextField, Button, Checkbox, Radio, Switch, Slider, Select, Autocomplete

**Navigation:** AppBar, Toolbar, Drawer, Menu, MenuItem, Tabs, Tab, Breadcrumbs, Link

**Feedback:** Alert, Snackbar, Dialog, CircularProgress, LinearProgress, Skeleton

**Data Display:** Typography, Card, Avatar, Chip, Badge, Divider, List, Table, Tooltip

**Transitions:** Collapse, Fade, Grow, Slide, Zoom

## MUI иконки

\`\`\`typescript
import { DeleteIcon, EditIcon, AddIcon } from '@platform/ui';
\`\`\`

## Утилиты

### merge

Утилита для глубокого слияния объектов:

\`\`\`typescript
import { merge } from '@platform/ui';

const result = merge.deepMerge(obj1, obj2);
\`\`\`

### styled

Утилита styled-components от MUI:

\`\`\`typescript
import { styled } from '@platform/ui';

const StyledBox = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  backgroundColor: theme.palette.background.paper,
}));
\`\`\`

## Контексты

### DIContext

Контекст для доступа к DI контейнеру:

\`\`\`typescript
import { DIContext } from '@platform/ui';
import { useContext } from 'react';

const container = useContext(DIContext);
\`\`\`

### setGlobalDIContainer

Установка глобального DI контейнера (fallback для remote модулей):

\`\`\`typescript
import { setGlobalDIContainer } from '@platform/ui';

setGlobalDIContainer(container);
\`\`\`

`;

/**
 * Страница документации: Библиотеки.
 *
 * @component
 */
const LibsPage: FC = () => {
  const { t } = useTranslation('doc-platform');

  return (
    <Container maxWidth={false} sx={{ padding: 0 }}>
      <Typography variant="h4" gutterBottom>
        {t('menu.libs')}
      </Typography>

      <Paper sx={(theme) => ({ width: '100%', p: theme.spacing(6) })}>
        <MarkdownRenderer content={pageMarkdown} />
      </Paper>
    </Container>
  );
};

export default LibsPage;
