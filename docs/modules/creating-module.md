# Создание модуля

Модули в MFP бывают двух видов:

- **MFE модули** — независимые пакеты в `packages/`, могут быть локальными или удаленными
- **Локальные модули** — расположены в `host/src/modules/`, всегда загружаются локально

## Способы создания

| Способ                      | Для чего         | Сложность                |
| --------------------------- | ---------------- | ------------------------ |
| Лаунчер                     | MFE модули       | Простой (рекомендуется)  |
| Вручную                     | Локальные модули | Средний                  |
| Копирование MFE → локальный | Локальные модули | Простой (быстрый способ) |

## Создание MFE модуля через Лаунчер

> Рекомендуемый способ. Лаунчер создает всю структуру и настройки автоматически.

### Шаг 1. Запустите лаунчер

```bash
npm start
```

### Шаг 2. Выберите "Создать новый MFE модуль"

### Шаг 3. Введите название модуля

```
Введите название модуля (kebab-case): my-feature
```

Лаунчер создаст модуль в `packages/my-feature/` с готовой структурой:

```
packages/my-feature/
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.mts
├── vite.config.local.mts
└── src/
    ├── config/
    │   ├── module_config.ts    # Конфигурация модуля
    │   ├── routes.ts           # Маршруты
    │   ├── di.config.ts        # DI конфигурация
    │   ├── di.tokens.ts        # DI токены
    │   └── i18n/               # Переводы
    │       ├── en_my-feature.json
    │       └── ru_my-feature.json
    ├── models/                 # Модели данных
    ├── viewmodels/             # ViewModels
    ├── usecases/               # Use Cases
    ├── view/                   # React компоненты
    │   └── pages/
    │       └── HomePage.tsx
    └── vite-env.d.ts
```

### Шаг 4. Добавьте модуль в конфигурацию лаунчера

1. Запустите `npm start`
2. Выберите конфигурацию → "Редактировать модули"
3. Найдите `my-feature` и выберите источник (LOCAL)

Готово! Модуль доступен по адресу `/my-feature`.

### Автоматическая регистрация MFE модулей

MFE модули **не нужно** добавлять в `host/src/modules/modules.ts`. Они регистрируются автоматически:

| Режим | Источник регистрации                             |
| ----- | ------------------------------------------------ |
| DEV   | Конфигурация лаунчера (`.launcher/configs.json`) |
| PROD  | Манифест с сервера                               |

Параметры модуля (loadType, loadPriority, featureFlags, permissions) берутся из `module_config.ts`:

```typescript
// packages/my-feature/src/config/module_config.ts
export default {
  // ... ROUTES, onModuleInit, I18N

  // Эти данные используются для регистрации модуля
  mockModuleInfo: {
    name: 'my-feature',
    loadType: 'normal',
    loadPriority: 1,
    dependencies: [],
    featureFlags: ['my-feature.module.load.feature'],
    accessPermissions: ['my-feature.module.load.permission'],
  },
} as ModuleConfig;
```

## Создание локального модуля

Локальные модули размещаются в `host/src/modules/`. Они всегда загружаются из бандла хоста.

### Быстрый способ: копирование MFE модуля

1. Создайте MFE модуль через лаунчер
2. Скопируйте `packages/my-feature/src/` в `host/src/modules/my-feature/`
3. Удалите `packages/my-feature/`
4. Зарегистрируйте как локальный модуль

### Ручное создание

#### Шаг 1. Создайте структуру папок

```bash
mkdir -p host/src/modules/my-local-module/config/i18n
mkdir -p host/src/modules/my-local-module/view/pages
mkdir -p host/src/modules/my-local-module/viewmodels
mkdir -p host/src/modules/my-local-module/models
mkdir -p host/src/modules/my-local-module/usecases
```

#### Шаг 2. Создайте конфигурацию модуля

```typescript
// host/src/modules/my-local-module/config/module_config.ts
import { type ModuleConfig } from '@platform/core';
import { routes } from './routes';
import { log } from '@platform/core';
import { DI_CONFIG } from './di.config';

import en from './i18n/en_my-local-module.json';
import ru from './i18n/ru_my-local-module.json';

export default {
  ROUTES: () => routes,

  onModuleInit: (bootstrap) => {
    DI_CONFIG(bootstrap.di);
    log.debug('initialized', { prefix: 'module.my-local-module' });
  },

  I18N: (i18n) => {
    i18n.addResourceBundle('en', 'my-local-module', en);
    i18n.addResourceBundle('ru', 'my-local-module', ru);
  },
} as ModuleConfig;
```

#### Шаг 3. Создайте маршруты

```typescript
// host/src/modules/my-local-module/config/routes.ts
import { type IRoutes } from '@platform/core';
import { lazy } from 'react';

export const MY_LOCAL_MODULE_ROUTES = {
  HOME: 'my-local-module',
};

export const routes: IRoutes = [
  {
    name: 'my-local-module',
    path: '/my-local-module',
    menu: {
      text: 'my-local-module:menu.title',
    },
    browserTitle: 'My Local Module',
    pageComponent: lazy(() => import('../view/pages/HomePage')),
  },
];
```

#### Шаг 4. Создайте DI конфигурацию

```typescript
// host/src/modules/my-local-module/config/di.tokens.ts
export const IOC_TOKENS = {
  VIEW_MODEL: Symbol.for('MyLocalModule.ViewModel'),
};
```

```typescript
// host/src/modules/my-local-module/config/di.config.ts
import { type Container } from 'inversify';
import { IOC_TOKENS } from './di.tokens';
import { MyViewModel } from '../viewmodels/my.vm';

export function DI_CONFIG(container: Container): void {
  container.bind(IOC_TOKENS.VIEW_MODEL).to(MyViewModel).inSingletonScope();
}
```

#### Шаг 5. Создайте страницу

```typescript
// host/src/modules/my-local-module/view/pages/HomePage.tsx
import { observer } from 'mobx-react-lite';
import { useTranslation } from 'react-i18next';
import { Typography, Box } from '@platform/ui';

const HomePage = observer(() => {
  const { t } = useTranslation('my-local-module');

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4">{t('title')}</Typography>
    </Box>
  );
});

export default HomePage;
```

#### Шаг 6. Создайте файлы переводов

```json
// host/src/modules/my-local-module/config/i18n/en_my-local-module.json
{
  "title": "My Local Module",
  "menu": {
    "title": "My Module"
  }
}
```

```json
// host/src/modules/my-local-module/config/i18n/ru_my-local-module.json
{
  "title": "Мой локальный модуль",
  "menu": {
    "title": "Мой модуль"
  }
}
```

#### Шаг 7. Зарегистрируйте модуль

```typescript
// host/src/modules/modules.ts
import { type Module, ModuleLoadType } from './interface';
import MyLocalModuleConfig from './my-local-module/config/module_config';

export const app_modules: Module[] = [
  // ... другие модули

  {
    name: 'my-local-module',
    description: 'Локальный модуль',
    config: MyLocalModuleConfig, // Синхронный импорт
    loadType: ModuleLoadType.NORMAL,
    loadPriority: 5,
    loadCondition: {
      featureFlags: ['my-local-module.load.feature'],
      accessPermissions: ['my-local-module.load.permission'],
    },
  },
];
```

## Различия MFE и локальных модулей

| Характеристика    | MFE модуль                       | Локальный модуль       |
| ----------------- | -------------------------------- | ---------------------- |
| Расположение      | `packages/`                      | `host/src/modules/`    |
| Регистрация       | Автоматически (лаунчер/манифест) | Вручную в `modules.ts` |
| Импорт конфига    | Динамический (`import()`)        | Синхронный             |
| Может быть remote | Да                               | Нет                    |
| Отдельная сборка  | Да                               | Нет (часть хоста)      |
| Hot Reload        | Через Vite                       | Часть хоста            |

## Типы модулей по загрузке

### INIT модули

Загружаются при старте, до рендера UI:

```typescript
{
  name: 'core',
  loadType: ModuleLoadType.INIT,
  loadPriority: 0,  // Меньше = раньше
  config: CoreConfig,
  // loadCondition НЕ поддерживается
}
```

### NORMAL модули

Загружаются после рендера UI:

```typescript
{
  name: 'my-feature',
  loadType: ModuleLoadType.NORMAL,
  loadPriority: 10,
  config: import('@mfe/my-feature/config').then((m) => m.default),
  loadCondition: {
    featureFlags: ['my-feature.enabled'],
    accessPermissions: ['my-feature.view'],
    dependencies: ['auth'],  // Другие модули
  },
}
```

## Проверка модуля

После создания:

1. Запустите приложение: `npm start`
2. Откройте в браузере: `http://localhost:4200/my-feature`
3. Проверьте консоль на ошибки
4. Убедитесь, что модуль появился в меню (если настроено)

## Частые ошибки

### Модуль не загружается

- Проверьте `loadCondition` — feature flags и permissions должны быть в манифесте
- Проверьте, добавлен ли модуль в `modules.ts`
- Проверьте консоль на ошибки

### Роуты не работают

- Убедитесь, что `ROUTES` возвращает функцию: `ROUTES: () => routes`
- Проверьте уникальность имен маршрутов

### Переводы не загружаются

- Проверьте namespace в `useTranslation('my-module')`
- Убедитесь, что `I18N` функция вызывается в `module_config.ts`
