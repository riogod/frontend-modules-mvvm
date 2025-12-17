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

```
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
```

## Шаг 1: Создание папки

```bash
mkdir -p libs/my-lib/src
```

## Шаг 2: package.json

```json
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
```

> Имя библиотеки должно начинаться с `@platform/` для единообразия.

## Шаг 3: tsconfig.json

```json
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
```

## Шаг 4: tsconfig.lib.json

```json
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
```

## Шаг 5: tsconfig.spec.json

```json
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
```

## Шаг 6: vite.config.mts

```typescript
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
```

## Шаг 7: vitest.config.ts

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.mts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
  },
});
```

## Шаг 8: vitest.setup.mts

```typescript
import '@testing-library/jest-dom';
```

## Шаг 9: Точка входа (src/index.ts)

```typescript
// Экспортируйте всё, что должно быть доступно из библиотеки
export * from './MyComponent';
export * from './utils';
export { MY_CONSTANTS } from './constants';
```

## Шаг 10: Регистрация алиаса

Добавьте алиас в `tsconfig.base.json`:

```json
{
  "compilerOptions": {
    "paths": {
      "@platform/my-lib": ["libs/my-lib/src/index.ts"]
    }
  }
}
```

> После изменения `tsconfig.base.json` выполните `npm run sync:tsconfig-paths` для синхронизации алиасов.

## Шаг 11: Регистрация workspace

Библиотека автоматически подключается через `workspaces` в корневом `package.json`:

```json
{
  "workspaces": ["libs/*"]
}
```

## Использование в модулях

После создания библиотеки импортируйте её в модулях:

```typescript
import { MyComponent, myHelper } from '@platform/my-lib';
```

## Команды для работы с библиотеками

| Команда                      | Описание                    |
| ---------------------------- | --------------------------- |
| `npm run lint:lib -- my-lib` | Линтинг библиотеки          |
| `npm run lint:libs`          | Линтинг всех библиотек      |
| `npm run test:lib -- my-lib` | Тестирование библиотеки     |
| `npm run test:libs`          | Тестирование всех библиотек |

## Зависимости между библиотеками

Библиотека может использовать другие библиотеки платформы:

```typescript
// libs/my-lib/src/MyComponent.tsx
import { useVM } from '@platform/ui';
import { IOC_CORE_TOKENS } from '@platform/core';
```

### Порядок зависимостей

```
@platform/core      ← Базовая библиотека (без зависимостей от других @platform/*)
     ↓
@platform/common    ← Зависит от core
     ↓
@platform/ui        ← Зависит от core, common
     ↓
@platform/share     ← Зависит от core, ui
     ↓
@platform/my-lib    ← Ваша библиотека
```

> Избегайте циклических зависимостей между библиотеками.

## Шаринг через Module Federation

Чтобы библиотека была доступна remote модулям (MFE), её нужно зарегистрировать в shared scope Module Federation.

### Шаг 1: Добавьте в конфигурацию host

Откройте `config/vite-config/host.config.js` и добавьте библиотеку в `federationShared`:

```javascript
const federationShared = {
  // ... существующие зависимости ...

  // Ваша библиотека
  '@platform/my-lib': { singleton: true, requiredVersion: false, eager: true },
};
```

### Шаг 2: Зарегистрируйте в FederationSharedHandler

Откройте `host/src/bootstrap/handlers/FederationSharedHandler.ts`:

1. Добавьте импорт:

```typescript
import * as platformMyLib from '@platform/my-lib';
```

2. Зарегистрируйте в `initFederationSharedProd()`:

```typescript
private initFederationSharedProd(): void {
  // ... существующий код ...

  registerSharedModule(scope, '@platform/my-lib', platformMyLib);
}
```

3. Зарегистрируйте в `initFederationSharedDev()`:

```typescript
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
```

### Параметры shared

| Параметр          | Значение | Описание                                |
| ----------------- | -------- | --------------------------------------- |
| `singleton`       | `true`   | Одна версия библиотеки для всех модулей |
| `requiredVersion` | `false`  | Не проверять версию                     |
| `eager`           | `true`   | Загружать немедленно до remote модулей  |

### Когда нужен шаринг

| Сценарий                                    | Нужен шаринг |
| ------------------------------------------- | ------------ |
| Библиотека содержит React контексты         | Да           |
| Библиотека содержит глобальное состояние    | Да           |
| Библиотека используется в remote модулях    | Да           |
| Библиотека используется только в host/local | Нет          |
| Утилиты без состояния                       | Опционально  |

> **Важно:** Если библиотека содержит React контексты (как `@platform/ui` с `DIContext`), шаринг обязателен. Без этого remote модули получат отдельный экземпляр контекста.

## Типичные ошибки

### ❌ Импорт из src

```typescript
// Неправильно — импорт из src
import { MyComponent } from '@platform/my-lib/src/MyComponent';
```

### ✅ Импорт через index

```typescript
// Правильно — через точку входа
import { MyComponent } from '@platform/my-lib';
```

### ❌ Забыли экспорт

```typescript
// src/MyComponent.tsx
export const MyComponent = () => <div>Hello</div>;

// src/index.ts — забыли добавить экспорт!
// export * from './MyComponent';
```

### ✅ Добавьте экспорт

```typescript
// src/index.ts
export * from './MyComponent';
```

## Связанные разделы

- [Core библиотека](./core.md)
- [UI библиотека](./ui.md)
- [Common библиотека](./common.md)
- [Share библиотека](./share.md)
- [Структура проекта](../project-structure.md)
