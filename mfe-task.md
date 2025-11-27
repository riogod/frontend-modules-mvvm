# План реализации MFE (Micro-Frontends) Architecture

## Цель

Трансформировать текущий модульный монолит в гибридную MFE архитектуру с "Zero-Config" DX.
Обеспечить бесшовную работу в режиме монорепозитория с возможностью независимого деплоя модулей.

---

## 🎯 Как это работает (High-Level Overview)

### Developer Experience (DX):

1. **Разработчик запускает** `npm start`
2. **CLI Runner показывает меню** с сохраненными конфигурациями:
   - "Development" (все локально)
   - "Staging Hybrid" (todo локально, api remote)
   - "Production Test" (все remote)
   - → Создать новую
   - → Настройки

3. **Разработчик выбирает** или создает конфигурацию:
   - Для каждого NORMAL модуля выбирает источник:
     - 🟢 LOCAL (packages/todo/src) - с HMR для разработки
     - 🔵 REMOTE (https://staging.com/...) - загрузка с сервера
   - INIT модули (core, core.layout) всегда локальные - не показываются
   - Опция REMOTE доступна только если настроен Remote Server URL

4. **CLI Runner генерирует** манифест `.launcher/current-manifest.json`:

   ```json
   {
     "modules": [
       { "name": "todo", "remoteEntry": "" }, // LOCAL
       { "name": "api", "remoteEntry": "https://..." } // REMOTE
     ]
   }
   ```

5. **Vite стартует** и читает манифест:
   - Создает алиасы для LOCAL модулей (`@platform/module-todo` → `packages/todo/src`)
   - Настраивает middleware для `/app/start` endpoint
   - Включает HMR для локальных модулей ✅

6. **Host приложение запускается**:
   - `ModulesDiscoveryHandler` загружает манифест с `/app/start`
   - Для LOCAL модулей: импорт через алиас (нативный ESM)
   - Для REMOTE модулей: загрузка через Module Federation
   - `ModuleLoader` инициализирует все модули
   - Приложение работает! 🚀

### Production Build & Deploy:

1. **Сборка модулей**: `npm run build:module -- --name=todo`
   - Каждый модуль собирается независимо
   - Генерируется `remoteEntry.js` + assets
   - Складывается в `dist/modules/todo/`

2. **Деплой**:
   - Host → `/` (корень)
   - Модули → `/modules/{name}/` (подпапки)
   - Backend отдает манифест `/app/start` с URL модулей

3. **Runtime загрузка**:
   - Host загружает манифест
   - Модули загружаются по требованию (lazy)
   - Shared dependencies (React, MobX) - singleton

---

## ✅ Текущее состояние (Реализовано)

### Архитектура проекта

- Монорепозиторий с npm workspaces: `config/*`, `libs/*`
- Host приложение: `host/` (вместо `app/`)
- Библиотеки: `libs/core`, `libs/ui`, `libs/common`, `libs/share`
- Конфигурации: `config/vite-config`, `config/eslint-config`

### Типы модулей и способы их загрузки

**По времени загрузки:**

- **INIT модули** - загружаются синхронно при старте (core, core.layout)
  - Всегда локальные, всегда из `host/src/modules/`
  - Не могут быть Remote
- **NORMAL модули** - загружаются асинхронно (todo, api_example)
  - Могут быть Local, Remote или Local Build
  - Выбор источника через CLI Runner

**По источнику (только для NORMAL модулей):**

1. **LOCAL** (`remoteEntry: ""`)
   - Разработка с HMR из исходников
   - Импорт через Vite алиас: `@platform/module-{name}` → `packages/{name}/src`
   - Пример: `import('@platform/module-todo')`
   - Используется для активной разработки модуля
2. **REMOTE** (`remoteEntry: "https://..."`)
   - Загрузка с удаленного сервера (staging/production)
   - Использует Module Federation
   - Пример: `https://staging.com/modules/todo/1.2.3/remoteEntry.js`
   - Используется когда модуль не разрабатывается, но нужен в приложении

### Bootstrap система (Chain of Responsibility)

Реализована полная цепочка инициализации:

1. `APIClientHandler` - инициализация HTTP клиента
2. `RouterHandler` - создание роутера
3. `DIHandler` - настройка DI контейнера (Inversify)
4. `InitI18nHandler` - инициализация i18next
5. `MockServiceHandler` - запуск MSW (для dev режима)
6. `AccessControlHandler` - настройка прав и feature flags
7. `ModulesHandler` - загрузка INIT модулей
8. `RouterPostHandler` - предзагрузка роутов
9. `HTTPErrorHandler` - обработка ошибок

### ModuleLoader (Продвинутая система загрузки модулей)

Реализовано:

- **ModuleRegistry** - реестр модулей с кешем
- **ModuleDependencyResolver** - разрешение зависимостей между модулями
- **ModuleConditionValidator** - проверка условий загрузки (featureFlags, permissions)
- **ModuleLifecycleManager** - управление жизненным циклом модулей
- **Типы модулей**:
  - `INIT` - загружаются синхронно при старте (core, core.layout)
  - `NORMAL` - загружаются асинхронно после старта (todo, api_example)
- **Условия загрузки**: `featureFlags`, `accessPermissions`, `dependencies`
- **Динамическая загрузка конфигов**: поддержка `Promise<ModuleConfig>`
- **Предзагрузка (preload)**: регистрация роутов и i18n без вызова `onModuleInit`
- **Параллельная загрузка**: группировка модулей по уровням зависимостей

### Vite & Build конфигурация

- Централизованная конфигурация через `@platform/vite-config`
- Типы конфигов: `host`, `lib`, `module` (для MFE модулей)
- Поддержка динамических импортов и code splitting
- Встроенная поддержка TypeScript paths через `vite-tsconfig-paths`
- Локальная настройка Federation через `vite.config.local.mts` в каждом модуле

---

## Этап 1: Реструктуризация проекта (Monorepo Setup)

**Статус**: 🟡 Частично выполнено

### Что осталось сделать:

1. **Изменение структуры папок**:
   - Создать директорию `packages/` в корне
   - Перенести **только бизнес-модули** из `host/src/modules/*` в `packages/*`:
     - `host/src/modules/todo` → `packages/todo`
     - `host/src/modules/api_example` → `packages/api_example`
   - **Core модули остаются в `host/src/modules/`** (являются частью Host):
     - `core` - базовые функции, permissions, feature flags
     - `core.layout` - основной Layout приложения
   - `host/` остается как Host Application (Shell)
   - `libs/` уже существуют как Shared Kernel

2. **Настройка Workspaces**:
   - Обновить корневой `package.json`:
     ```json
     "workspaces": [
       "host",
       "packages/*",
       "config/*",
       "libs/*"
     ]
     ```
   - В каждый модуль (например, `packages/todo`) добавить `package.json`:
     ```json
     {
       "name": "@platform/module-todo",
       "version": "1.0.0",
       "type": "module",
       "main": "src/config/module_config.ts",
       "scripts": {
         "dev": "vite",
         "build": "vite build",
         "preview": "vite preview"
       },
       "peerDependencies": {
         "react": "^19.0.0",
         "@platform/core": "workspace:*",
         "@platform/ui": "workspace:*"
       },
       "devDependencies": {
         "@platform/vite-config": "workspace:*",
         "@originjs/vite-plugin-federation": "^1.4.1",
         "vite": "^7.2.1"
       }
     }
     ```
   - Структура каждого MFE модуля:
     ```
     packages/todo/
       ├── package.json
       ├── vite.config.mts           # Основная конфигурация (использует @platform/vite-config)
       ├── vite.config.local.mts     # Локальные настройки Federation (exposes, shared, remotes)
       ├── tsconfig.json
       └── src/
           ├── config/
           │   └── module_config.ts  # Экспортируется как ./Config через Federation
           ├── models/
           ├── usecases/
           ├── view/
           └── viewmodels/
     ```

3. **Обновление импортов и конфигураций**:
   - Обновить `tsconfig.base.json` для резолва путей к модулям
   - Обновить `host/src/modules/modules.ts` для импорта из `packages/*`
   - Создать `vite.config.mts` в каждом модуле (использует `@platform/vite-config`)
   - Создать `vite.config.local.mts` в каждом модуле (настройки Federation)
   - Настроить Vite aliases для локальной разработки

### ✅ Уже реализовано:

- npm workspaces для `config/*` и `libs/*`
- Единая версия зависимостей через корневой `package-lock.json`
- TypeScript монорепо с `tsconfig.base.json` и path mapping

---

## Этап 2: Создание CLI Orchestrator (The Runner)

**Статус**: ⚪ Не начат

Интерактивный инструмент для запуска проекта с гибким управлением конфигурациями модулей.

### Требования к UX:

#### 1. Главное меню (при `npm start`):

```
🚀 Frontend MFE Launcher

Сохраненные конфигурации:
  1. 🔷 Development (все локально)          [используется: 15 раз]
  2. 🟢 Staging (todo локально, остальное remote)
  3. 🟠 Production Test (все remote)

Действия:
  → Выбрать конфигурацию
  → Создать новую конфигурацию
  → Создать новый MFE модуль
  → Общие настройки проекта
  → Выход
```

#### 2. При выборе существующей конфигурации:

```
Конфигурация: "Development"
  - todo: LOCAL (packages/todo)
  - api_example: LOCAL (packages/api_example)

Что сделать?
  → Запустить
  → Редактировать
  → Удалить
  → Назад
```

#### 3. При создании/редактировании конфигурации:

**Если Remote Server URL настроен:**

```
Настройка модулей:

INIT модули (загружаются всегда локально):
  ✓ core
  ✓ core.layout

NORMAL модули (выберите источник для каждого):

  📦 todo
    ◉ LOCAL (packages/todo/src) - разработка с HMR
    ◯ REMOTE (https://staging.com/modules/todo)

  📦 api_example
    ◯ LOCAL (packages/api_example/src) - разработка с HMR
    ◉ REMOTE (https://staging.com/modules/api_example)

Действия:
  → Запустить без сохранения
  → Сохранить и запустить (ввести имя конфигурации)
  → Отмена
```

**Если Remote Server URL НЕ настроен:**

```
Настройка модулей:

INIT модули (загружаются всегда локально):
  ✓ core
  ✓ core.layout

NORMAL модули (только LOCAL доступен):

  📦 todo
    ◉ LOCAL (packages/todo/src) - разработка с HMR
    🔒 REMOTE (недоступно - настройте Remote Server URL)

  📦 api_example
    ◉ LOCAL (packages/api_example/src) - разработка с HMR
    🔒 REMOTE (недоступно - настройте Remote Server URL)

⚠️  Чтобы использовать REMOTE модули, настройте Remote Server URL в общих настройках

Действия:
  → Запустить (только с LOCAL модулями)
  → Перейти к настройкам
  → Отмена
```

#### 4. Общие настройки проекта:

**Если URL настроен:**

```
⚙️ Настройки проекта

Remote Server URL:
  ✓ Настроен: https://staging.example.com

  → Изменить URL
  → Очистить URL (отключить REMOTE модули)
  → Назад

Дополнительные настройки:
  → Очистить кеш конфигураций
  → Показать все URL модулей
  → Экспорт/Импорт конфигураций
```

**Если URL НЕ настроен:**

```
⚙️ Настройки проекта

Remote Server URL:
  ⚠️  Не настроен - REMOTE модули недоступны

  → Настроить URL (https://...)
  → Назад

Дополнительные настройки:
  → Очистить кеш конфигураций
  → Экспорт/Импорт конфигураций

💡 Совет: После настройки URL вы сможете загружать модули с удаленного сервера
```

#### 5. При создании нового MFE модуля:

```
🆕 Создание нового MFE модуля

Основная информация:
  Название модуля (kebab-case): [todo-list]
  Описание: [Todo List Management Module]
  Автор: [Your Name]

Настройки Federation:
  Remote scope name: [module-todo-list]
  Base URL (production): [/modules/todo-list/]

Создать модуль?
  → Да, создать
  → Нет, отмена
```

**После создания:**

```
✅ Модуль 'todo-list' успешно создан!

📁 Путь: packages/todo-list/

Создана структура:
  ✓ MVVM архитектура (models, usecases, view, viewmodels)
  ✓ Конфигурационные файлы (package.json, vite.config, tsconfig)
  ✓ Module Federation настройки
  ✓ Базовый роут и компонент
  ✓ README.md с инструкциями

Следующие шаги:
  1. Зависимости установлены автоматически ✓
  2. Добавить роуты в src/config/routes.ts
  3. Реализовать бизнес-логику в src/usecases/
  4. Создать view-модели в src/viewmodels/
  5. Добавить модуль в конфигурацию запуска (npm start)

Открыть папку в редакторе?
  → Да (откроет VSCode/Cursor)
  → Нет
```

### Технические задачи:

1. **Инструментарий**:

   ```json
   {
     "devDependencies": {
       "prompts": "^2.4.2",
       "chalk": "^5.3.0",
       "ora": "^6.3.1",
       "dotenv": "^16.3.1"
     }
   }
   ```

   Создать файлы:
   - `scripts/dev-runner.mjs` - главный скрипт
   - `scripts/launcher/` - модули launcher'а:
     - `config-manager.mjs` - управление конфигурациями
     - `module-discovery.mjs` - сканирование модулей
     - `manifest-generator.mjs` - генерация /app/start
     - `vite-launcher.mjs` - запуск Vite
     - `module-generator.mjs` - 🆕 генерация новых MFE модулей
   - `scripts/templates/` - 🆕 шаблоны для генерации:
     - `module/` - шаблон MFE модуля

2. **Структура данных конфигураций**:

   Файл `.launcher/configs.json`:

   ```json
   {
     "version": "1.0.0",
     "lastUsed": "development",
     "remoteServerUrl": "", // Пустая строка = не настроен
     "configurations": {
       "development": {
         "name": "Development",
         "description": "Все модули локально с HMR",
         "createdAt": "2024-01-15T10:00:00Z",
         "usageCount": 15,
         "modules": {
           "todo": {
             "source": "local",
             "path": "packages/todo"
           },
           "api_example": {
             "source": "local",
             "path": "packages/api_example"
           }
         }
       },
       "staging-hybrid": {
         "name": "Staging Hybrid",
         "modules": {
           "todo": {
             "source": "local",
             "path": "packages/todo"
           },
           "api_example": {
             "source": "remote",
             "url": "https://staging.example.com/modules/api_example/remoteEntry.js"
           }
         }
       }
     }
   }
   ```

3. **Логика работы Runner**:

   **Module Discovery** (сканирование):

   ```javascript
   // Автоматически находит все модули
   const modules = {
     init: ['core', 'core.layout'],
     normal: await scanPackages('packages/*'),
   };
   ```

   **Configuration Manager** (управление конфигурациями):

   ```javascript
   class ConfigManager {
     load()           // Загрузить .launcher/configs.json
     save(config)     // Сохранить конфигурацию
     delete(name)     // Удалить конфигурацию
     getList()        // Список всех конфигураций
     updateUsage()    // Увеличить счетчик использования
   }
   ```

   **Manifest Generator** (генерация манифеста):

   ```javascript
   class ManifestGenerator {
     generate(config) {
       // На основе выбранной конфигурации создает JSON для /app/start
       return {
         modules: [
           {
             name: 'todo',
             version: '1.0.0',
             loadType: 'normal',
             // Если source: 'local' → remoteEntry: ''
             // Если source: 'remote' → remoteEntry: config.modules.todo.url
             // Если source: 'local-build' → remoteEntry: '/local/todo/remoteEntry.js'
             remoteEntry: config.modules.todo.source === 'local' ? '' : '...',
           },
         ],
       };
     }
   }
   ```

   **Vite Launcher**:

   ```javascript
   class ViteLauncher {
     async start(config) {
       // 1. Создать Vite middleware для /app/start
       const manifest = manifestGenerator.generate(config);

       // 2. Установить ENV переменные
       const localModules = Object.entries(config.modules)
         .filter(([_, m]) => m.source === 'local')
         .map(([name]) => name);

       process.env.VITE_LOCAL_MODULES = localModules.join(',');

       // 3. Создать middleware для mock /app/start
       this.createManifestMiddleware(manifest);

       // 4. Запустить Vite dev server
       await spawn('vite', ['--config', 'host/vite.config.mts']);
     }
   }
   ```

   **Module Generator** (генерация новых MFE модулей):

   ```javascript
   // scripts/launcher/module-generator.mjs
   import fs from 'fs';
   import path from 'path';
   import prompts from 'prompts';
   import { execSync } from 'child_process';

   class ModuleGenerator {
     constructor() {
       this.templatesDir = path.resolve(__dirname, '../templates/module');
       this.packagesDir = path.resolve(__dirname, '../../packages');
     }

     async createModule() {
       // 1. Собрать информацию о модуле
       const answers = await prompts([
         {
           type: 'text',
           name: 'name',
           message: 'Название модуля (kebab-case):',
           validate: (value) => {
             if (!/^[a-z][a-z0-9-]*$/.test(value)) {
               return 'Используйте kebab-case (например: todo-list)';
             }
             if (fs.existsSync(path.join(this.packagesDir, value))) {
               return `Модуль ${value} уже существует`;
             }
             return true;
           },
         },
         {
           type: 'text',
           name: 'description',
           message: 'Описание модуля:',
           initial: 'New MFE module',
         },
         {
           type: 'text',
           name: 'author',
           message: 'Автор:',
           initial: 'Your Name',
         },
         {
           type: 'text',
           name: 'scopeName',
           message: 'Remote scope name:',
           initial: (prev, values) => `module-${values.name}`,
         },
         {
           type: 'text',
           name: 'baseUrl',
           message: 'Base URL (production):',
           initial: (prev, values) => `/modules/${values.name}/`,
         },
       ]);

       if (!answers.name) {
         console.log('Создание модуля отменено');
         return;
       }

       // 2. Создать структуру модуля из шаблона
       const modulePath = path.join(this.packagesDir, answers.name);
       await this.copyTemplate(modulePath, answers);

       // 3. Установить зависимости
       console.log('\n📦 Устанавливаем зависимости...');
       execSync('npm install', { cwd: modulePath, stdio: 'inherit' });

       // 4. Обновить корневой package.json (если нужно)
       await this.updateRootPackageJson();

       console.log(`\n✅ Модуль '${answers.name}' успешно создан!`);
       console.log(`📁 Путь: packages/${answers.name}/\n`);

       // 5. Предложить открыть в редакторе
       const { openInEditor } = await prompts({
         type: 'confirm',
         name: 'openInEditor',
         message: 'Открыть папку в редакторе?',
         initial: true,
       });

       if (openInEditor) {
         try {
           execSync(`code ${modulePath}`, { stdio: 'inherit' });
         } catch (e) {
           console.log('Не удалось открыть редактор');
         }
       }
     }

     async copyTemplate(targetPath, answers) {
       // Рекурсивное копирование с подстановкой переменных
       const copyDir = (src, dest) => {
         fs.mkdirSync(dest, { recursive: true });
         const entries = fs.readdirSync(src, { withFileTypes: true });

         for (const entry of entries) {
           const srcPath = path.join(src, entry.name);
           const destPath = path.join(dest, entry.name);

           if (entry.isDirectory()) {
             copyDir(srcPath, destPath);
           } else {
             let content = fs.readFileSync(srcPath, 'utf-8');
             // Подстановка переменных в шаблонах
             content = content
               .replace(/{{MODULE_NAME}}/g, answers.name)
               .replace(/{{MODULE_SCOPE_NAME}}/g, answers.scopeName)
               .replace(/{{MODULE_DESCRIPTION}}/g, answers.description)
               .replace(/{{MODULE_AUTHOR}}/g, answers.author)
               .replace(/{{MODULE_BASE_URL}}/g, answers.baseUrl)
               .replace(/{{YEAR}}/g, new Date().getFullYear());

             fs.writeFileSync(destPath, content);
           }
         }
       };

       copyDir(this.templatesDir, targetPath);
     }

     async updateRootPackageJson() {
       // Проверить что workspaces включает packages/*
       const rootPackageJson = path.resolve(__dirname, '../../package.json');
       const pkg = JSON.parse(fs.readFileSync(rootPackageJson, 'utf-8'));

       if (!pkg.workspaces) {
         pkg.workspaces = [];
       }

       if (!pkg.workspaces.includes('packages/*')) {
         pkg.workspaces.push('packages/*');
         fs.writeFileSync(rootPackageJson, JSON.stringify(pkg, null, 2));
       }
     }
   }

   export default ModuleGenerator;
   ```

   **Структура шаблона модуля** (`scripts/templates/module/`):

   ```
   scripts/templates/module/
   ├── package.json
   ├── vite.config.mts
   ├── vite.config.local.mts
   ├── tsconfig.json
   ├── README.md
   └── src/
       ├── config/
       │   ├── module_config.ts
       │   ├── routes.ts
       │   ├── di.ts
       │   └── i18n/
       │       ├── en.json
       │       └── ru.json
       ├── models/
       │   └── .gitkeep
       ├── usecases/
       │   └── .gitkeep
       ├── view/
       │   ├── index.ts
       │   └── pages/
       │       └── HomePage.tsx
       └── viewmodels/
           └── .gitkeep
   ```

   **Содержимое ключевых файлов шаблона:**

   `package.json`:

   ```json
   {
     "name": "@platform/module-{{MODULE_NAME}}",
     "version": "1.0.0",
     "description": "{{MODULE_DESCRIPTION}}",
     "author": "{{MODULE_AUTHOR}}",
     "type": "module",
     "main": "src/config/module_config.ts",
     "scripts": {
       "dev": "vite",
       "build": "vite build",
       "preview": "vite preview"
     },
     "peerDependencies": {
       "react": "^19.0.0",
       "@platform/core": "workspace:*",
       "@platform/ui": "workspace:*"
     },
     "devDependencies": {
       "@platform/vite-config": "workspace:*",
       "@originjs/vite-plugin-federation": "^1.4.1",
       "typescript": "~5.9.3",
       "vite": "^7.2.1"
     }
   }
   ```

   `vite.config.mts`:

   ```typescript
   import { defineConfig } from 'vite';
   import { createModuleConfig } from '@platform/vite-config';

   export default defineConfig(
     createModuleConfig({
       dirname: __dirname,
       moduleName: '{{MODULE_SCOPE_NAME}}',
       localConfigPath: './vite.config.local.mts',
     }),
   );
   ```

   `vite.config.local.mts`:

   ```typescript
   export default {
     name: '{{MODULE_SCOPE_NAME}}',
     exposes: {},
     shared: {},
     base: process.env.NODE_ENV === 'production' ? '{{MODULE_BASE_URL}}' : '/',
     remotes: {},
   };
   ```

   `src/config/module_config.ts`:

   ```typescript
   import type { ModuleConfig } from '@platform/host-types';
   import { ROUTES } from './routes';
   import { registerDI } from './di';

   const config: ModuleConfig = {
     ROUTES,
     I18N: (i18n) => {
       // Загрузка переводов
       i18n.addResourceBundle('en', '{{MODULE_NAME}}', {
         /* ... */
       });
       i18n.addResourceBundle('ru', '{{MODULE_NAME}}', {
         /* ... */
       });
     },
     onModuleInit: (bootstrap) => {
       // Регистрация DI
       registerDI(bootstrap.di);

       console.log('Module {{MODULE_NAME}} initialized');
     },
   };

   export default config;
   ```

   `src/config/routes.ts`:

   ```typescript
   import { lazy } from 'react';
   import type { IRoute } from '@platform/core';

   export const ROUTES = (): IRoute[] => [
     {
       name: '{{MODULE_NAME}}',
       path: '/{{MODULE_NAME}}',
       component: lazy(() => import('../view/pages/HomePage')),
     },
   ];
   ```

   `README.md`:

   ````markdown
   # {{MODULE_NAME}} Module

   {{MODULE_DESCRIPTION}}

   ## Структура

   - `src/config/` - конфигурация модуля
   - `src/models/` - модели данных
   - `src/usecases/` - бизнес-логика
   - `src/view/` - React компоненты
   - `src/viewmodels/` - view-модели (MobX)

   ## Разработка

   ```bash
   # Запуск в dev режиме
   npm run dev

   # Сборка
   npm run build
   ```
   ````

   ## Federation
   - Remote scope: `{{MODULE_SCOPE_NAME}}`
   - Base URL: `{{MODULE_BASE_URL}}`
   - Exposes: `./Config` (module_config.ts)

   ```

   ```

4. **Vite Middleware для /app/start**:

   Создать `host/plugins/manifest-middleware.ts`:

   ```typescript
   export function createManifestMiddleware(manifest: any) {
     return {
       name: 'manifest-middleware',
       configureServer(server) {
         server.middlewares.use('/app/start', (req, res) => {
           res.setHeader('Content-Type', 'application/json');
           res.end(JSON.stringify(manifest));
         });
       },
     };
   }
   ```

5. **Интеграция с Host приложением**:

   В `host/vite.config.mts`:

   ```typescript
   import { createManifestMiddleware } from './plugins/manifest-middleware';

   // Читаем манифест из переменной окружения или файла
   const manifest = process.env.VITE_MANIFEST
     ? JSON.parse(process.env.VITE_MANIFEST)
     : await readFile('.launcher/current-manifest.json', 'utf-8');

   export default defineConfig({
     plugins: [createManifestMiddleware(manifest)],
   });
   ```

### Структура команд:

```json
{
  "scripts": {
    "start": "node scripts/dev-runner.mjs",
    "dev": "node scripts/dev-runner.mjs",
    "dev:quick": "node scripts/dev-runner.mjs --config development",
    "dev:all-local": "VITE_LOCAL_MODULES=* vite --config host/vite.config.mts",
    "dev:all-remote": "vite --config host/vite.config.mts"
  }
}
```

### Важные правила:

1. **INIT модули всегда локальные**:

   ```javascript
   // В config-manager.mjs
   const INIT_MODULES = ['core', 'core.layout'];

   // INIT модули НЕ показываются в выборе источника
   // Они автоматически добавляются в манифест как LOCAL
   function generateManifest(config) {
     const modules = [
       // INIT модули всегда первыми, всегда локальные
       ...INIT_MODULES.map((name) => ({
         name,
         loadType: 'init',
         remoteEntry: '',
         // ... остальные поля из host/src/modules/modules.ts
       })),
       // NORMAL модули - на основе выбора пользователя
       ...config.modules,
     ];
   }
   ```

2. **REMOTE источник доступен только если настроен Remote Server URL**:

   ```javascript
   // В config-manager.mjs
   class ConfigManager {
     isRemoteAvailable() {
       const config = this.load();
       // REMOTE доступен только если URL не пустой
       return config.remoteServerUrl && config.remoteServerUrl.trim() !== '';
     }

     getRemoteModuleUrl(moduleName) {
       if (!this.isRemoteAvailable()) {
         throw new Error('Remote Server URL не настроен');
       }
       const baseUrl = this.config.remoteServerUrl.replace(/\/$/, '');
       return `${baseUrl}/modules/${moduleName}/remoteEntry.js`;
     }
   }

   // В интерактивном меню
   async function selectModuleSource(moduleName) {
     const choices = [{ title: 'LOCAL (packages/*/src)', value: 'local' }];

     // REMOTE опция добавляется только если URL настроен
     if (configManager.isRemoteAvailable()) {
       choices.push({
         title: `REMOTE (${configManager.config.remoteServerUrl})`,
         value: 'remote',
       });
     } else {
       choices.push({
         title: '🔒 REMOTE (недоступно - настройте URL)',
         value: 'remote',
         disabled: true,
       });
     }

     return await prompts({ choices });
   }
   ```

3. **Источник модуля определяется по `remoteEntry`**:
   - `""` (пустая строка) → LOCAL (packages/\*/src)
   - `"https://..."` → REMOTE (загрузка с сервера)

4. **Vite алиасы создаются только для LOCAL модулей**:
   - CLI Runner сохраняет манифест в `.launcher/current-manifest.json`
   - Vite читает этот файл и создает алиасы для модулей с `remoteEntry: ""`
   - Remote модули загружаются через Federation, алиасы не нужны

### Дополнительные фичи:

1. **Генератор MFE модулей**:

   ```bash
   # Через интерактивное меню
   npm start
   → Создать новый MFE модуль

   # Или напрямую
   npm start -- --create-module

   # С параметрами (без интерактива)
   npm start -- --create-module --name=todo-list --desc="Todo List Module"
   ```

   **Возможности:**
   - Автоматическое создание структуры MVVM
   - Генерация всех конфигурационных файлов
   - Валидация имени модуля (kebab-case)
   - Проверка на существование
   - Автоматическая установка зависимостей
   - Опция открыть в редакторе после создания

2. **Быстрый запуск последней конфигурации**:

   ```bash
   npm start -- --last  # Запустить последнюю использованную
   ```

3. **CLI аргументы для автоматизации**:

   ```bash
   npm start -- --config development  # Запустить конкретную конфигурацию
   npm start -- --local todo,api      # Быстрая настройка
   ```

4. **Валидация и предупреждения**:
   - **Проверка Remote Server URL**: если не настроен, опция REMOTE недоступна
   - **Проверка доступности Remote сервера**: ping перед запуском с REMOTE модулями
   - **Предупреждение** если модуль не найден в `packages/`
   - **Автоматическое обновление** конфигураций при изменении структуры
   - **Проверка версий** модулей (local vs remote)
   - **Подсказка**: если пользователь пытается выбрать REMOTE без URL → предложить перейти в настройки

5. **Экспорт/Импорт конфигураций**:

   ```bash
   # Экспорт для шаринга с командой
   npm start -- --export-config development > dev-config.json

   # Импорт конфигурации
   npm start -- --import-config dev-config.json
   ```

---

## Этап 3: Настройка Host Application (Vite & Bootstrap)

**Статус**: 🟡 Частично выполнено

Адаптация Host приложения для работы с динамическим списком модулей (local + remote).

### ✅ Уже реализовано:

**Bootstrap Chain**:

- Полная цепочка handlers с правильным порядком
- `ModulesHandler` загружает INIT модули
- `RouterPostHandler` вызывает `preloadRoutes()` для регистрации роутов всех модулей
- Поддержка динамических конфигов через `Promise<ModuleConfig>`

**ModuleLoader**:

- `ModuleRegistry` с кешем и поиском модулей
- Двухфазная загрузка: `preload` (routes + i18n) → `load` (onModuleInit)
- Параллельная загрузка независимых модулей
- Условия загрузки: `dependencies`, `featureFlags`, `accessPermissions`

**DI Container**:

- Настроен Inversify с автобиндингом (`@injectable`, `@provide`)
- APIClient доступен через DI

### Что нужно добавить:

1. **Vite Config (Dynamic Aliases для Local модулей)**:

   Обновить `host/vite.config.mts`:

   ```typescript
   import { defineConfig } from 'vite';
   import { createViteConfig } from '@platform/vite-config';
   import { createModuleAliasesPlugin } from './plugins/moduleAliases';
   import { createManifestMiddleware } from './plugins/manifest-middleware';
   import fs from 'fs';
   import path from 'path';

   // Загружаем манифест, сгенерированный CLI Runner
   const manifestPath = path.resolve(
     __dirname,
     '../.launcher/current-manifest.json',
   );
   const manifest = fs.existsSync(manifestPath)
     ? JSON.parse(fs.readFileSync(manifestPath, 'utf-8'))
     : null;

   export default defineConfig(
     createViteConfig({
       type: 'host',
       dirname: __dirname,
       extraPlugins: [
         // Плагин для создания алиасов локальных модулей
         createModuleAliasesPlugin({
           manifest,
           packagesDir: '../packages',
         }),

         // Middleware для /app/start endpoint (в dev режиме)
         manifest && createManifestMiddleware(manifest),
       ].filter(Boolean),
     }),
   );
   ```

   **Плагин `host/plugins/moduleAliases.ts`**:

   ```typescript
   import path from 'path';
   import type { Plugin } from 'vite';

   interface ModuleAliasesOptions {
     manifest: any;
     packagesDir: string;
   }

   export function createModuleAliasesPlugin(
     options: ModuleAliasesOptions,
   ): Plugin {
     const { manifest, packagesDir } = options;

     if (!manifest) {
       return { name: 'module-aliases-noop' };
     }

     // Извлекаем локальные модули из манифеста
     const localModules = manifest.modules
       .filter((m: any) => m.remoteEntry === '')
       .map((m: any) => m.name);

     return {
       name: 'module-aliases',
       config(config) {
         const aliases: Record<string, string> = {};

         // Создаем алиасы для локальных модулей
         localModules.forEach((moduleName: string) => {
           aliases[`@platform/module-${moduleName}`] = path.resolve(
             __dirname,
             packagesDir,
             moduleName,
             'src',
           );
         });

         return {
           resolve: {
             alias: {
               ...config.resolve?.alias,
               ...aliases,
             },
           },
         };
       },
     };
   }
   ```

   **Плагин `host/plugins/manifest-middleware.ts`**:

   ```typescript
   import type { Plugin } from 'vite';

   export function createManifestMiddleware(manifest: any): Plugin {
     return {
       name: 'manifest-middleware',
       configureServer(server) {
         server.middlewares.use('/app/start', (req, res) => {
           if (req.method === 'GET') {
             res.setHeader('Content-Type', 'application/json');
             res.setHeader('Access-Control-Allow-Origin', '*');
             res.end(JSON.stringify(manifest));
           }
         });
       },
     };
   }
   ```

   **Как это работает**:
   - CLI Runner создает `.launcher/current-manifest.json` с выбранной конфигурацией
   - Vite читает этот манифест и создает алиасы для LOCAL модулей
   - Алиасы указывают на исходники в `packages/*/src` → нативный HMR ✅
   - Middleware отдает манифест на `/app/start` для Bootstrap
   - Remote модули загружаются через Federation (не нужны алиасы)

2. **ModulesDiscoveryHandler (новый handler)**:

   Добавить **вторым в цепочку** (после `APIClientHandler`, до `RouterHandler`):

   ```typescript
   handler
     .setNext(new APIClientHandler(config))
     .setNext(new ModulesDiscoveryHandler(config)) // ← НОВЫЙ
     .setNext(new RouterHandler(config));
   // ... остальные
   ```

   **Задачи handler'а**:
   - Загрузить манифест модулей с `/app/start`
   - Для каждого модуля определить способ загрузки на основе `remoteEntry`:
     - `remoteEntry === ""` → **LOCAL** (импорт из `packages/*` через Vite alias)
     - `remoteEntry === "https://..."` → **REMOTE** (загрузка через Module Federation)
   - Создать объекты `Module` для каждого модуля
   - Объединить с INIT модулями (core, core.layout) которые всегда локальные
   - Добавить все модули в `Bootstrap.modules` для дальнейшей обработки

   **Структура манифеста** (`/app/start`):

   ```typescript
   interface AppStartResponse {
     modules: Array<{
       name: string;
       version: string;
       loadType: 'init' | 'normal';
       loadPriority?: number;

       // Источник модуля:
       // "" (пустая строка) = LOCAL (импорт из packages/* через Vite алиас)
       // "https://..." = REMOTE (загрузка с удаленного сервера через Federation)
       remoteEntry: string;

       // Опциональные метаданные для условной загрузки
       dependencies?: string[];
       featureFlags?: string[];
       accessPermissions?: string[];
     }>;

     // Данные пользователя для AccessControl
     user?: {
       permissions: string[];
       featureFlags: string[];
     };
   }
   ```

   **Пример манифеста** (генерируется CLI Runner):

   ```json
   {
     "modules": [
       {
         "name": "core",
         "version": "1.0.0",
         "loadType": "init",
         "loadPriority": 0,
         "remoteEntry": ""
       },
       {
         "name": "core.layout",
         "version": "1.0.0",
         "loadType": "init",
         "loadPriority": 2,
         "remoteEntry": ""
       },
       {
         "name": "todo",
         "version": "1.0.0",
         "loadType": "normal",
         "loadPriority": 1,
         "remoteEntry": "",
         "dependencies": []
       },
       {
         "name": "api_example",
         "version": "1.2.3",
         "loadType": "normal",
         "loadPriority": 2,
         "remoteEntry": "https://staging.example.com/modules/api_example/1.2.3/remoteEntry.js",
         "dependencies": ["core", "todo"],
         "featureFlags": ["api.module.load.feature"],
         "accessPermissions": ["api.module.load.permission"]
       }
     ],
     "user": {
       "permissions": ["api.module.load.permission"],
       "featureFlags": ["api.module.load.feature"]
     }
   }
   ```

   **Логика в ModulesDiscoveryHandler**:

   ```typescript
   class ModulesDiscoveryHandler extends AbstractInitHandler {
     async handle(bootstrap: Bootstrap): Promise<Bootstrap> {
       // 1. Загрузить манифест
       const manifest =
         await bootstrap.getAPIClient.get<AppStartResponse>('/app/start');

       // 2. Обработать каждый модуль из манифеста
       const modules: Module[] = await Promise.all(
         manifest.modules.map(async (moduleData) => {
           let config: ModuleConfig | Promise<ModuleConfig>;

           if (moduleData.remoteEntry === '') {
             // LOCAL: импорт из packages через Vite алиас
             // Алиас настраивается в host/vite.config.mts
             // @platform/module-todo -> packages/todo/src
             config = await import(`@platform/module-${moduleData.name}`).then(
               (m) => m.default,
             );
           } else {
             // REMOTE: загрузка через Module Federation
             config = this.remoteModuleLoader.loadRemoteModule(
               moduleData.name,
               moduleData.remoteEntry,
             );
           }

           return {
             name: moduleData.name,
             loadType: moduleData.loadType,
             loadPriority: moduleData.loadPriority,
             loadCondition: {
               dependencies: moduleData.dependencies,
               featureFlags: moduleData.featureFlags,
               accessPermissions: moduleData.accessPermissions,
             },
             config,
           };
         }),
       );

       // 3. Сохранить модули в Bootstrap
       // Они будут обработаны дальше в цепочке handlers
       bootstrap.setModules(modules);

       return super.handle(bootstrap);
     }
   }
   ```

3. **RemoteModuleLoader (сервис)**:

   Создать `host/src/bootstrap/services/remoteModuleLoader.ts`:

   ```typescript
   class RemoteModuleLoader {
     private cache = new Map<string, Promise<ModuleConfig>>();

     async loadRemoteModule(
       name: string,
       remoteEntry: string,
       retries = 3,
       timeout = 10000,
     ): Promise<ModuleConfig> {
       // Загрузка remoteEntry.js
       // Импорт './Config' из remote scope
       // Retry логика
       // Timeout protection
     }
   }
   ```

4. **Performance Strategy (уже частично реализована)**:
   ✅ Модули экспортируют только конфиг (без index.ts)
   ✅ Компоненты в роутах загружаются лениво через `React.lazy()`
   ⚪ Нужно добавить: экспорт `./Config` для Federation

5. **Обновить интерфейс Module**:
   ```typescript
   interface RemoteModule extends NormalModule {
     remote?: {
       entry: string; // URL к remoteEntry.js
       scope: string; // имя scope в Federation
     };
   }
   ```

### Переименование (опционально):

- `ModulesHandler` → `ModulesInitHandler` (более явное имя)
- Текущая логика остается без изменений

---

## Этап 4: Federation & Production Build

**Статус**: ⚪ Не начат

Настройка Module Federation для независимого развертывания модулей.

### Задачи:

1. **Централизованная Vite Federation Config**:

   Добавить в `config/vite-config/module.config.ts`:

   ```typescript
   import federation from '@originjs/vite-plugin-federation';
   import { createBaseConfig } from './base.config';
   import react from '@vitejs/plugin-react';

   interface ModuleConfigOptions {
     dirname: string;
     moduleName: string;
     // Локальная конфигурация из vite.config.local.mts
     localConfigPath?: string;
     // Дополнительные exposes (помимо ./Config)
     exposes?: Record<string, string>;
     // Дополнительные shared (помимо стандартных)
     shared?: Record<string, any>;
   }

   export function createModuleConfig(options: ModuleConfigOptions) {
     const {
       dirname,
       moduleName,
       localConfigPath = './vite.config.local.mts',
       exposes = {},
       shared = {},
     } = options;

     // Базовые shared зависимости для всех MFE модулей
     const defaultShared = {
       react: { singleton: true, requiredVersion: false },
       'react-dom': { singleton: true, requiredVersion: false },
       mobx: { singleton: true, requiredVersion: false },
       'mobx-react-lite': { singleton: true, requiredVersion: false },
       '@platform/core': { singleton: true, requiredVersion: false },
       '@platform/ui': { singleton: true, requiredVersion: false },
     };

     return {
       ...createBaseConfig({
         dirname,
         cacheDir: `../../node_modules/.vite/modules/${moduleName}`,
       }),
       plugins: [
         react(),
         federation({
           name: moduleName,
           filename: 'remoteEntry.js',
           // Всегда экспортируем ./Config, дополнительные exposes из параметров
           exposes: {
             './Config': './src/config/module_config.ts',
             ...exposes,
           },
           shared: {
             ...defaultShared,
             ...shared,
           },
         }),
       ],
       build: {
         target: 'esnext',
         minify: process.env.NODE_ENV === 'production',
         cssCodeSplit: true,
         rollupOptions: {
           output: {
             format: 'esm',
           },
         },
       },
     };
   }
   ```

   Обновить `config/vite-config/index.ts`:

   ```typescript
   export { createBaseConfig } from './base.config';
   export { createHostConfig } from './host.config';
   export { createLibConfig } from './lib.config';
   export { createModuleConfig } from './module.config'; // Новый экспорт
   ```

2. **Создать vite.config.mts и vite.config.local.mts для каждого модуля**:

   **Базовая конфигурация** `packages/todo/vite.config.mts`:

   ```typescript
   import { defineConfig } from 'vite';
   import { createModuleConfig } from '@platform/vite-config';

   export default defineConfig(
     createModuleConfig({
       dirname: __dirname,
       moduleName: 'module-todo',
       // Указываем путь к локальной конфигурации
       localConfigPath: './vite.config.local.mts',
     }),
   );
   ```

   **Локальная конфигурация Federation** `packages/todo/vite.config.local.mts`:

   ```typescript
   /**
    * Локальная конфигурация Module Federation для todo модуля
    * Этот файл содержит специфичные настройки remote для данного модуля
    */
   export default {
     // Имя remote scope (используется при импорте)
     name: 'module-todo',

     // Дополнительные expose (помимо ./Config)
     exposes: {
       // Можно экспортировать дополнительные части модуля
       // './Components': './src/view/index.ts',
     },

     // Дополнительные shared зависимости (специфичные для модуля)
     shared: {
       // Например, если модуль использует специфичную библиотеку
       // 'some-lib': { singleton: true },
     },

     // Базовый URL для production (используется в publicPath)
     base: process.env.NODE_ENV === 'production' ? '/modules/todo/' : '/',

     // Remotes (если этот модуль зависит от других remote модулей)
     remotes: {
       // 'module-api': 'https://cdn.example.com/modules/api/remoteEntry.js'
     },
   };
   ```

   **Пример для api_example модуля** `packages/api_example/vite.config.local.mts`:

   ```typescript
   export default {
     name: 'module-api-example',
     exposes: {},
     shared: {},
     base:
       process.env.NODE_ENV === 'production' ? '/modules/api_example/' : '/',
     remotes: {
       // Зависит от todo модуля
       'module-todo': process.env.REMOTE_TODO_URL || '',
     },
   };
   ```

3. **Интеграция централизованной и локальной конфигурации**:

   **Как это работает:**
   1. `@platform/vite-config` предоставляет базовую функцию `createModuleConfig()`
   2. Она читает `vite.config.local.mts` из каждого модуля
   3. Объединяет базовые и локальные настройки

   **Обновить `config/vite-config/module.config.ts`**:

   ```typescript
   import path from 'path';
   import { loadConfigFromFile } from 'vite';

   export async function createModuleConfig(options: ModuleConfigOptions) {
     const { dirname, moduleName, localConfigPath } = options;

     // Загружаем локальную конфигурацию если она есть
     let localConfig = {};
     const localPath = path.resolve(
       dirname,
       localConfigPath || './vite.config.local.mts',
     );

     try {
       const loaded = await loadConfigFromFile(
         { command: 'build', mode: 'production' },
         localPath,
       );
       if (loaded) {
         localConfig = loaded.config.default || loaded.config;
       }
     } catch (e) {
       // Локальная конфигурация опциональна
       console.log(`No local config found for ${moduleName}`);
     }

     // Объединяем настройки
     const federationConfig = {
       name: localConfig.name || moduleName,
       filename: 'remoteEntry.js',
       exposes: {
         './Config': './src/config/module_config.ts',
         ...(localConfig.exposes || {}),
       },
       shared: {
         ...defaultShared,
         ...(localConfig.shared || {}),
       },
       remotes: localConfig.remotes || {},
     };

     return {
       ...baseConfig,
       base: localConfig.base || '/',
       plugins: [react(), federation(federationConfig)],
       // ... остальное
     };
   }
   ```

   **publicPath настраивается в `vite.config.local.mts`**:

   ```typescript
   // packages/todo/vite.config.local.mts
   export default {
     base: process.env.NODE_ENV === 'production' ? '/modules/todo/' : '/',
   };
   ```

4. **Host Federation Config**:

   В `host/vite.config.mts` добавить:

   ```typescript
   federation({
     name: 'host',
     remotes: {
       // Динамически определяется через манифест /app/start
       // Пример:
       // 'module-todo': 'https://cdn.example.com/modules/todo/remoteEntry.js'
     },
     shared: {
       // те же зависимости, что и в модулях
       react: { singleton: true, requiredVersion: false },
       // ...
     },
   });
   ```

5. **CI/CD & Build Scripts**:

   Добавить в корневой `package.json`:

   ```json
   {
     "scripts": {
       "build:host": "vite build --config host/vite.config.mts",
       "build:module": "node scripts/build-module.mjs",
       "build:module:todo": "cd packages/todo && vite build --outDir ../../dist/modules/todo",
       "build:module:api": "cd packages/api_example && vite build --outDir ../../dist/modules/api_example",
       "build:all": "npm run build:host && npm run build:module -- --all"
     }
   }
   ```

   Создать `scripts/build-module.mjs`:

   ```javascript
   #!/usr/bin/env node
   import { spawn } from 'child_process';
   import fs from 'fs';
   import path from 'path';
   import { fileURLToPath } from 'url';

   const __dirname = path.dirname(fileURLToPath(import.meta.url));
   const packagesDir = path.resolve(__dirname, '../packages');

   /**
    * Универсальный скрипт для сборки MFE модулей
    *
    * Использование:
    *   npm run build:module -- --name=todo
    *   npm run build:module -- --all
    *   npm run build:module -- --name=todo --name=api_example
    */

   async function buildModule(moduleName) {
     const modulePath = path.join(packagesDir, moduleName);
     const outDir = path.resolve(__dirname, '../dist/modules', moduleName);

     console.log(`📦 Building module: ${moduleName}`);
     console.log(`   Source: ${modulePath}`);
     console.log(`   Output: ${outDir}`);

     // Каждый модуль использует свой vite.config.mts
     // который подтягивает настройки из vite.config.local.mts
     await new Promise((resolve, reject) => {
       const build = spawn('vite', ['build', '--outDir', outDir], {
         cwd: modulePath,
         stdio: 'inherit',
       });

       build.on('close', (code) => {
         if (code === 0) {
           console.log(`✅ Module ${moduleName} built successfully`);
           resolve();
         } else {
           reject(new Error(`Build failed for ${moduleName}`));
         }
       });
     });
   }

   async function main() {
     const args = process.argv.slice(2);
     const buildAll = args.includes('--all');
     const moduleNames = args
       .filter((arg) => arg.startsWith('--name='))
       .map((arg) => arg.replace('--name=', ''));

     let modulesToBuild = [];

     if (buildAll) {
       // Находим все модули в packages/
       modulesToBuild = fs.readdirSync(packagesDir).filter((name) => {
         const stat = fs.statSync(path.join(packagesDir, name));
         return stat.isDirectory();
       });
     } else if (moduleNames.length > 0) {
       modulesToBuild = moduleNames;
     } else {
       console.error('Usage: npm run build:module -- --name=todo or --all');
       process.exit(1);
     }

     console.log(`🚀 Building ${modulesToBuild.length} module(s)...\n`);

     for (const moduleName of modulesToBuild) {
       await buildModule(moduleName);
     }

     console.log('\n✨ All modules built successfully!');
   }

   main().catch((err) => {
     console.error('❌ Build failed:', err);
     process.exit(1);
   });
   ```

   **Преимущества этого подхода:**
   - Каждый модуль собирается используя свой `vite.config.mts`
   - Локальные настройки Federation загружаются из `vite.config.local.mts`
   - Централизованная логика в `@platform/vite-config`
   - Легко добавить новые модули без изменения build скриптов

6. **Структура деплоя**:

   ```
   /                           → Host Application
   /index.html
   /assets/...

   /modules/todo/              → Todo Module
   /modules/todo/remoteEntry.js
   /modules/todo/assets/...

   /modules/api_example/       → API Example Module
   /modules/api_example/remoteEntry.js
   /modules/api_example/assets/...
   ```

7. **Версионирование модулей**:

   Манифест `/app/start` должен возвращать версии модулей:

   ```json
   {
     "modules": [
       {
         "name": "todo",
         "version": "1.2.3",
         "remoteEntry": "/modules/todo/1.2.3/remoteEntry.js"
       }
     ]
   }
   ```

   Это позволит кешировать модули и делать независимые релизы.

### Архитектура конфигураций (резюме):

```
config/vite-config/
  ├── base.config.ts          # Базовая конфигурация для всех проектов
  ├── host.config.ts          # Конфигурация для Host приложения
  ├── lib.config.ts           # Конфигурация для библиотек (libs/*)
  ├── module.config.ts        # 🆕 Конфигурация для MFE модулей
  └── index.ts                # Экспорты

packages/todo/
  ├── vite.config.mts         # Использует createModuleConfig()
  ├── vite.config.local.mts   # 🆕 Локальные настройки Federation
  └── package.json

packages/api_example/
  ├── vite.config.mts         # Использует createModuleConfig()
  ├── vite.config.local.mts   # 🆕 Локальные настройки Federation
  └── package.json
```

**Как это работает:**

1. `vite.config.mts` импортирует `createModuleConfig()` из `@platform/vite-config`
2. `createModuleConfig()` загружает `vite.config.local.mts`
3. Объединяет базовые настройки + локальные настройки
4. Каждый модуль получает единообразную конфигурацию с возможностью кастомизации

### Важные замечания:

**⚠️ Архитектура конфигураций**:

- **Централизованная логика** в `config/vite-config` (как и eslint-config)
- **Локальные настройки** в `vite.config.local.mts` каждого модуля
- Преимущества подхода:
  - Единая точка обновления базовой конфигурации
  - Каждый модуль контролирует свои специфичные настройки
  - Легко добавлять новые модули (просто копировать структуру)
  - Нет дублирования кода конфигурации

**⚠️ Performance**:

- Экспортируем ТОЛЬКО `./Config` (не `./index`)
- Метаданные модуля (name, dependencies) берутся из манифеста
- Компоненты в роутах — всегда ленивые (React.lazy)

**⚠️ Shared Dependencies**:

- Все shared библиотеки должны быть singleton
- Использовать `requiredVersion: false` для гибкости
- Следить за размером shared чанка (не более 200-300 KB gzip)
- Базовый набор shared прописан в `config/vite-config/module.config.ts`
- Дополнительные shared можно добавить в `vite.config.local.mts`

**⚠️ CSS Isolation**:

- CSS Modules обязательны для модулей
- Vite автоматически добавит хеши к классам
- Глобальные стили — только в Host

---

## Этап 5: Стилизация и Изоляция

**Статус**: 🟢 В основном выполнено

Обеспечение консистентного UI и изоляции стилей между модулями.

### ✅ Уже реализовано:

**MUI Theming**:

- `libs/ui` содержит централизованную тему
- `ThemeProvider` экспортируется из `@platform/ui`
- Настроена кастомная тема с палитрой и типографикой
- Host Application обертывает приложение в `ThemeProvider`

**CSS обработка**:

- Vite настроен на обработку CSS Modules
- Emotion для styled-components (@emotion/react, @emotion/styled)

### Что нужно проверить/улучшить:

1. **CSS Modules для компонентов модулей**:

   Убедиться, что все компоненты в `packages/*` используют:
   - CSS Modules: `*.module.css`
   - Или Emotion: `styled(Component)``

   ❌ Запретить:
   - Глобальные CSS файлы в модулях
   - Прямой импорт `.css` файлов (кроме Host)

2. **Shared UI компоненты**:

   Все переиспользуемые UI компоненты должны быть в `libs/ui`:
   - Button, Input, Card, Modal и т.д.
   - Модули импортируют их из `@platform/ui`
   - Гарантия единого стиля

   **Альтернативно** (для бизнес-компонентов):
   - Компоненты с бизнес-логикой можно регистрировать через IoC контейнер
   - Позволяет подменить реализацию в runtime
   - См. раздел "Шаринг React компонентов" в Дополнительных рекомендациях

3. **Federation & CSS**:

   При настройке Federation проверить:
   - CSS автоматически включается в remote bundle
   - Нет дублирования стилей MUI (через shared)
   - CSS загружается асинхронно при загрузке модуля

4. **CSS Isolation в Production**:
   ```typescript
   // vite.config.ts модуля
   css: {
     modules: {
       generateScopedName: '[name]__[local]___[hash:base64:5]',
       hashPrefix: 'module-todo' // уникальный префикс для модуля
     }
   }
   ```

---

## Дополнительные рекомендации

### Архитектурные паттерны

**Module Boundaries**:

- Каждый модуль — изолированный домен (MVVM)
- Взаимодействие между модулями через:
  - **IoC/DI контейнер** (Inversify) — для shared сервисов, бизнес-логики и компонентов
  - **Router** — для навигации между модулями
  - **TypeScript path mapping** — для типов в монорепо
  - **libs/ui** — для переиспользуемых UI компонентов
  - **Module Federation exposes** — для экспорта компонентов из remote модулей

**Важно**: Модули не импортируют друг друга напрямую. Вся коммуникация через абстракции.

**DI Strategy для сервисов**:

```typescript
// Remote модуль регистрирует свои сервисы в onModuleInit:
export const config: ModuleConfig = {
  onModuleInit(bootstrap) {
    bootstrap.di.bind('ITodoService').to(TodoService);
  },
};
```

**Шаринг React компонентов между модулями**:

Через IoC контейнер (для бизнес-компонентов)

**Когда использовать:**

- Компоненты с бизнес-логикой
- Нужна ленивая загрузка
- Runtime выбор реализации компонента
- Компонент зависит от конфигурации/feature flags

**Пример:**

```typescript
export const config: ModuleConfig = {
  onModuleInit(bootstrap) {
    // Регистрируем как фабрику компонентов
    bootstrap.di
      .bind<React.ComponentType>('TodoListWidget')
      .toConstantValue(TodoListWidget);
  },
};
```

### Мониторинг и отладка

**Dev Tools**:

1. Добавить логирование загрузки модулей (уже есть через `@platform/core/Logger`)
2. Vite plugin для визуализации зависимостей модулей
3. Bundle analyzer для отслеживания размеров

**Production Monitoring**:

1. Отслеживание времени загрузки модулей
2. Error boundaries для изоляции ошибок модулей
3. Retry логика для failed remote loads

---

## Чек-лист перед стартом каждого этапа

### Этап 1 (Restructure):

- [ ] Проверить, что все импорты в модулях относительные (не абсолютные)
- [ ] Убедиться, что `libs/core` не зависит от модулей (только наоборот)
- [ ] Подготовить миграционный скрипт для переноса модулей

### Этап 2 (CLI Runner):

**Основной функционал:**

- [ ] Создать структуру `scripts/launcher/` с модулями
- [ ] Реализовать `config-manager.mjs` (CRUD для конфигураций)
- [ ] Реализовать главное меню с выбором конфигураций
- [ ] Реализовать создание/редактирование конфигурации с выбором источника для каждого модуля
- [ ] Реализовать общие настройки проекта (Remote Server URL)
- [ ] **Добавить проверку наличия Remote Server URL** - если не настроен, опция REMOTE недоступна
- [ ] Показывать подсказку о необходимости настроить URL если пользователь хочет REMOTE
- [ ] Добавить сохранение конфигураций с именами
- [ ] Реализовать счетчик использования конфигураций
- [ ] Добавить опции: Запустить / Редактировать / Удалить для конфигураций
- [ ] Реализовать генерацию `.launcher/current-manifest.json`
- [ ] Протестировать оба типа источников: LOCAL / REMOTE
- [ ] Добавить валидацию доступности Remote сервера (ping перед запуском)

**Генератор MFE модулей:**

- [ ] Создать `scripts/launcher/module-generator.mjs`
- [ ] Создать шаблон модуля в `scripts/templates/module/`
- [ ] Реализовать интерактивный wizard создания модуля:
  - [ ] Ввод имени модуля (kebab-case валидация)
  - [ ] Ввод описания, автора
  - [ ] Настройка scope name и base URL
- [ ] Генерация структуры MVVM (models, usecases, view, viewmodels)
- [ ] Генерация конфигурационных файлов (vite.config, package.json)
- [ ] Автоматическая установка зависимостей
- [ ] Опция открыть созданный модуль в редакторе
- [ ] Добавить в главное меню пункт "Создать новый MFE модуль"
- [ ] Проверка на существование модуля с таким именем

**Тестирование:**

- [ ] Протестировать создание модуля
- [ ] Протестировать сборку созданного модуля
- [ ] Протестировать на Windows/Mac/Linux
- [ ] Создать `.env.example` и документацию

### Этап 3 (Bootstrap):

- [ ] Создать интерфейс `RemoteModule`
- [ ] Реализовать retry логику для загрузки remote модулей
- [ ] Добавить тесты для `ModulesDiscoveryHandler`

### Этап 4 (Federation):

- [ ] Создать `createModuleConfig()` в `config/vite-config/module.config.ts`
- [ ] Обновить экспорты в `config/vite-config/index.ts`
- [ ] Создать `vite.config.mts` в каждом модуле (использует централизованный конфиг)
- [ ] Создать `vite.config.local.mts` в каждом модуле (специфичные настройки Federation)
- [ ] Настроить shared dependencies (React, MobX, @platform/\*)
- [ ] Настроить base/publicPath для каждого модуля
- [ ] Проверить совместимость версий `@originjs/vite-plugin-federation`
- [ ] Протестировать сборку модулей
- [ ] Настроить CORS для staging/production
- [ ] Подготовить CI/CD пайплайн для независимых деплоев

### Этап 5 (Styles):

- [ ] Аудит всех CSS файлов в модулях
- [ ] Перенести общие компоненты в `libs/ui`
- [ ] Настроить linter rules для запрета глобальных стилей

---

## Приоритизация

### Must Have (MVP):

1. ✅ Bootstrap система с handlers
2. ✅ ModuleLoader с условиями загрузки
3. 🟡 Restructure (Этап 1) — для четкого разделения границ
4. ⚪ Federation (Этап 4) — для независимого деплоя

### Nice to Have:

5. ⚪ CLI Runner (Этап 2) — улучшает DX
6. 🟢 Styles isolation (Этап 5) — уже в основном работает

---

## Известные проблемы и решения

### Проблема: Циклические зависимости между модулями

**Решение**:

- Использовать `ModuleDependencyResolver` (уже есть)
- Запретить двунаправленные зависимости в линтере
- **Shared state через IoC контейнер**: модули регистрируют свои сервисы в DI и получают доступ к сервисам других модулей через инъекцию
- **Типы между модулями**: в монорепо типы доступны напрямую через TypeScript path mapping

**Пример межмодульного взаимодействия через DI**:

```typescript
// Module A регистрирует сервис
export const config: ModuleConfig = {
  onModuleInit(bootstrap) {
    bootstrap.di.bind('ITodoService').to(TodoService);
  },
};

// Module B использует сервис
@injectable()
class ApiService {
  constructor(@inject('ITodoService') private todoService: ITodoService) {}
}

// Также можно регистрировать React компоненты
export const config: ModuleConfig = {
  onModuleInit(bootstrap) {
    bootstrap.di
      .bind<React.ComponentType<TodoListProps>>('TodoListWidget')
      .toConstantValue(TodoListWidget);
  },
};
```

**Типизация компонентов в DI**:

Для типобезопасности создайте контракты в `libs/common`:

```typescript
// libs/common/src/module-contracts/todo.ts
export interface TodoListProps {
  onItemClick?: (id: string) => void;
}

export const DI_TOKENS = {
  TodoListWidget: Symbol.for('TodoListWidget'),
} as const;

// Module A регистрирует
bootstrap.di
  .bind<React.ComponentType<TodoListProps>>(DI_TOKENS.TodoListWidget)
  .toConstantValue(TodoListWidget);

// Module B использует с типами
@injectable()
class DashboardViewModel {
  constructor(
    @inject(DI_TOKENS.TodoListWidget)
    private TodoList: React.ComponentType<TodoListProps>,
  ) {}
}
```

### Проблема: Дублирование React/MobX в bundle

**Решение**:

- Federation shared config с `singleton: true`
- Проверить через bundle analyzer
- Все shared dependencies прописаны в `config/vite-config/module.config.ts`

---

## Следующие шаги

### Рекомендуемый порядок реализации:

#### Фаза 1: Подготовка инфраструктуры (1-2 недели)

1. **Этап 1 - Restructure** (критично):
   - Создать `packages/` директорию
   - Перенести `todo` и `api_example` из `host/src/modules/` в `packages/`
   - Обновить `package.json` для workspaces
   - Добавить `package.json` в каждый модуль
   - Обновить `tsconfig.base.json` для path mapping
   - Протестировать, что приложение работает после переноса

2. **Этап 4 (часть 1) - Federation Config** (параллельно):
   - Добавить `createModuleConfig()` в `@platform/vite-config`
   - Создать `vite.config.mts` для каждого модуля в `packages/`
   - Настроить Federation с exposes и shared
   - Сделать тестовую сборку одного модуля
   - Проверить размер бандлов и shared chunks

#### Фаза 2: CLI Runner и Integration (2-3 недели)

3. **Этап 2 - CLI Runner** (важно для DX):
   - Создать структуру `scripts/launcher/`
   - Реализовать `config-manager.mjs` (управление конфигурациями)
   - Реализовать интерактивное меню с `prompts`
   - Добавить генерацию манифеста `.launcher/current-manifest.json`
   - Реализовать запуск Vite с правильными параметрами
   - Протестировать все flow (создание/редактирование/удаление конфигураций)

4. **Этап 3 - Bootstrap Integration**:
   - Создать `ModulesDiscoveryHandler`
   - Реализовать `RemoteModuleLoader` с retry логикой
   - Обновить интерфейс `Module` для поддержки remote
   - Создать Vite плагины: `moduleAliases` и `manifest-middleware`
   - Интегрировать всё с существующим `ModuleLoader`
   - Добавить обработку двух типов источников (LOCAL/REMOTE)

#### Фаза 3: Testing & Production (1-2 недели)

5. **Этап 4 (часть 2) - Production Build**:
   - Создать `scripts/build-module.mjs`
   - Настроить CI/CD для независимой сборки модулей
   - Настроить версионирование модулей
   - Протестировать полный цикл деплоя

6. **Этап 5 - Final Polish**:
   - Аудит CSS (проверка на глобальные стили)
   - Перенести общие компоненты в `libs/ui`
   - Настроить CSS isolation для production
   - Добавить Error Boundaries
   - Документация и примеры

### Quick Start (минимальная реализация за неделю):

Если нужно быстро получить работающий прототип:

1. **День 1-2**: Этап 1 (Restructure) - перенос модулей в `packages/`
2. **День 3-4**: Базовый CLI Runner без сохранения конфигураций
3. **День 5-6**: ModulesDiscoveryHandler + манифест `/app/start`
4. **День 7**: Тестирование и фикс багов

После этого уже будет работать выбор LOCAL/REMOTE модулей, можно итеративно добавлять:

- Сохранение конфигураций
- Production сборку через Federation
- Полировку UX

**Примечание**: На начальном этапе можно работать только с LOCAL модулями (без настройки Remote Server URL), что уже даст базовую функциональность для разработки.
