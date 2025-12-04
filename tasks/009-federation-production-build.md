# Задача 009: Federation Production Build

## Статус: 🟡 Частично реализована

## Описание

Настройка production сборки модулей с Module Federation и создание build скриптов для сборки модулей и host приложения.

**Централизация утилит**: Build утилиты (`getModuleVersion`, `discoverModules`) размещены в `@platform/vite-config/build-utils/` для переиспользования.

**Архитектура манифеста**: В production манифест модулей поставляется **бэкендом через `/app/start`**. Бэкенд самостоятельно управляет конфигурацией модулей (БД/конфиг). Статическая генерация манифеста не требуется.

## Зависимости

- **Задача 002**: Централизованная Vite конфигурация (createModuleConfig)
- **Задача 006**: Vite плагины (типы манифеста `AppManifest`)
- **Задача 008**: RemoteModuleLoader (для тестирования загрузки)

## Что уже реализовано

- ✅ Директория `config/vite-config/build-utils/` создана
- ✅ `utils.ts` с функциями `getModuleVersion`, `discoverModules`, `isModuleBuilt`
- ✅ `generateManifest.ts` (для dev/preview, не для production)
- ✅ `index.ts` с реэкспортом утилит
- ✅ Типы `ModuleManifestEntry` и `ModuleLoadType` в `@platform/core`

## Подзадачи

### 1. ✅ Build утилиты в @platform/vite-config (ВЫПОЛНЕНО)

Утилиты уже созданы в `config/vite-config/build-utils/`:

**`config/vite-config/build-utils/utils.ts`** — реализовано:

```typescript
import fs from 'fs';
import path from 'path';

export function getModuleVersion(modulePath: string): string;
export function discoverModules(packagesDir: string): string[];
export function isModuleBuilt(distDir: string, moduleName: string): boolean;
```

### 2. Добавить экспорты build-utils в index.js

- [ ] Обновить `config/vite-config/index.js`:

```javascript
export { createBaseConfig } from './base.config.js';
export { createHostConfig } from './host.config.js';
export { createLibConfig } from './lib.config.js';
export { createModuleConfig } from './module.config.js';
export { createViteConfig } from './createViteConfig.js';

// Плагины для MFE
export {
  createModuleAliasesPlugin,
  createManifestMiddleware,
  loadManifest,
} from './plugins/index.js';

// Build утилиты
export {
  getModuleVersion,
  discoverModules,
  isModuleBuilt,
} from './build-utils/index.js';
```

### 3. Исправить outDir в module.config.js

- [ ] Обновить `config/vite-config/module.config.js`:

```javascript
// Было:
outDir = `../../dist/packages/${moduleName}`,

// Стало:
outDir = `../../dist/modules/${moduleName}/latest`,
```

Это обеспечит единую структуру:

- `dist/modules/{module_name}/latest/assets/remoteEntry.js`

### 4. Исправить isModuleBuilt для согласованности

- [ ] Проверить `config/vite-config/build-utils/utils.ts`:

```typescript
/**
 * Проверяет, собран ли модуль (есть remoteEntry.js)
 */
export function isModuleBuilt(distDir: string, moduleName: string): boolean {
  const remoteEntry = path.join(
    distDir,
    moduleName,
    'latest',
    'assets',
    'remoteEntry.js',
  );
  return fs.existsSync(remoteEntry);
}
```

### 5. Создание build-module.mjs скрипта

- [ ] Создать `scripts/build-module.mjs`:

```javascript
#!/usr/bin/env node
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';
import ora from 'ora';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const packagesDir = path.resolve(__dirname, '../packages');
const distDir = path.resolve(__dirname, '../dist/modules');

/**
 * Универсальный скрипт для сборки MFE модулей
 *
 * Использование:
 *   npm run build:module -- --name=todo
 *   npm run build:module -- --all
 *   npm run build:module -- --name=todo --name=api_example --parallel
 *
 * Результат сборки:
 *   dist/modules/{module}/latest/   — всегда актуальная версия
 *   dist/modules/{module}/{version}/ — копия для версионирования
 */

/**
 * Получает версию модуля из package.json
 */
function getModuleVersion(modulePath) {
  const pkgPath = path.join(modulePath, 'package.json');
  if (fs.existsSync(pkgPath)) {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
    return pkg.version || '1.0.0';
  }
  return '1.0.0';
}

/**
 * Рекурсивно копирует директорию
 */
function copyDirectory(src, dest) {
  fs.mkdirSync(dest, { recursive: true });

  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDirectory(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

/**
 * Сканирует директорию packages/ и возвращает список модулей
 */
function discoverModules(packagesDir) {
  if (!fs.existsSync(packagesDir)) {
    return [];
  }

  return fs
    .readdirSync(packagesDir, { withFileTypes: true })
    .filter((d) => {
      if (!d.isDirectory()) return false;
      const hasViteConfig = fs.existsSync(
        path.join(packagesDir, d.name, 'vite.config.mts'),
      );
      return hasViteConfig;
    })
    .map((d) => d.name);
}

function parseArgs() {
  const args = process.argv.slice(2);
  return {
    all: args.includes('--all'),
    names: args
      .filter((a) => a.startsWith('--name='))
      .map((a) => a.replace('--name=', '')),
    parallel: args.includes('--parallel'),
    analyze: args.includes('--analyze'),
  };
}

async function buildModule(moduleName, options = {}) {
  const modulePath = path.join(packagesDir, moduleName);
  const version = getModuleVersion(modulePath);
  const latestDir = path.join(distDir, moduleName, 'latest');
  const versionDir = path.join(distDir, moduleName, version);

  const spinner = ora(`Building ${chalk.cyan(moduleName)} v${version}`).start();

  return new Promise((resolve, reject) => {
    const args = ['build', '--outDir', latestDir];

    if (options.analyze) {
      args.push('--mode', 'analyze');
    }

    const build = spawn('npx', ['vite', ...args], {
      cwd: modulePath,
      stdio: options.verbose ? 'inherit' : 'pipe',
      env: {
        ...process.env,
        NODE_ENV: 'production',
      },
    });

    let stderr = '';

    if (!options.verbose) {
      build.stderr?.on('data', (data) => {
        stderr += data.toString();
      });
    }

    build.on('close', (code) => {
      if (code === 0) {
        // Копируем latest → version
        try {
          if (fs.existsSync(versionDir)) {
            fs.rmSync(versionDir, { recursive: true });
          }
          copyDirectory(latestDir, versionDir);

          spinner.succeed(`Built ${chalk.cyan(moduleName)} v${version}`);
          console.log(`   Latest:  ${chalk.gray(latestDir)}`);
          console.log(`   Version: ${chalk.gray(versionDir)}`);

          resolve({ name: moduleName, version, latestDir, versionDir });
        } catch (copyError) {
          spinner.fail(`Failed to copy version for ${chalk.red(moduleName)}`);
          reject(copyError);
        }
      } else {
        spinner.fail(`Failed to build ${chalk.red(moduleName)}`);
        if (stderr) {
          console.error(chalk.red(stderr));
        }
        reject(new Error(`Build failed for ${moduleName}`));
      }
    });
  });
}

async function buildModulesParallel(moduleNames, options) {
  console.log(
    chalk.cyan(`\n📦 Building ${moduleNames.length} modules in parallel...\n`),
  );

  const results = await Promise.allSettled(
    moduleNames.map((name) => buildModule(name, options)),
  );

  const succeeded = results.filter((r) => r.status === 'fulfilled');
  const failed = results.filter((r) => r.status === 'rejected');

  console.log('\n' + chalk.cyan('Build Summary:'));
  console.log(`  ✅ Succeeded: ${succeeded.length}`);
  console.log(`  ❌ Failed: ${failed.length}`);

  if (failed.length > 0) {
    process.exit(1);
  }
}

async function buildModulesSequential(moduleNames, options) {
  console.log(chalk.cyan(`\n📦 Building ${moduleNames.length} modules...\n`));

  for (const name of moduleNames) {
    await buildModule(name, options);
  }
}

async function main() {
  const args = parseArgs();

  let modulesToBuild = [];

  if (args.all) {
    modulesToBuild = discoverModules(packagesDir);
  } else if (args.names.length > 0) {
    modulesToBuild = args.names;

    // Валидация
    for (const name of modulesToBuild) {
      if (!fs.existsSync(path.join(packagesDir, name))) {
        console.error(chalk.red(`Module "${name}" not found in packages/`));
        process.exit(1);
      }
    }
  } else {
    console.log(chalk.yellow('Usage:'));
    console.log('  npm run build:module -- --name=todo');
    console.log('  npm run build:module -- --all');
    console.log(
      '  npm run build:module -- --name=todo --name=api_example --parallel',
    );
    process.exit(1);
  }

  if (modulesToBuild.length === 0) {
    console.log(chalk.yellow('No modules found to build'));
    process.exit(0);
  }

  const options = { analyze: args.analyze };

  if (args.parallel) {
    await buildModulesParallel(modulesToBuild, options);
  } else {
    await buildModulesSequential(modulesToBuild, options);
  }

  console.log(chalk.green('\n✨ All modules built successfully!\n'));
}

main().catch((err) => {
  console.error(chalk.red('❌ Build failed:'), err.message);
  process.exit(1);
});
```

### 6. Обновление package.json scripts

- [ ] Добавить build скрипты в корневой `package.json`:

```json
{
  "scripts": {
    "build": "npm run build:host",
    "build:host": "vite build --config host/vite.config.mts",
    "build:module": "node scripts/build-module.mjs",
    "build:modules": "node scripts/build-module.mjs --all",
    "build:modules:parallel": "node scripts/build-module.mjs --all --parallel",
    "build:all": "npm run build:modules && npm run build:host",
    "preview:host": "vite preview --config host/vite.config.mts",
    "analyze:module": "node scripts/build-module.mjs --analyze"
  }
}
```

### 7. Настройка Host для production (опционально)

- [ ] При необходимости обновить `host/vite.config.mts` для production с federation:

```typescript
import federation from '@originjs/vite-plugin-federation';

// В production конфигурации (если требуется динамическая загрузка)
if (process.env.NODE_ENV === 'production') {
  config.plugins.push(
    federation({
      name: 'host',
      remotes: {
        // Remotes загружаются динамически через RemoteModuleLoader
      },
      shared: {
        react: { singleton: true, requiredVersion: false },
        'react-dom': { singleton: true, requiredVersion: false },
        mobx: { singleton: true, requiredVersion: false },
        'mobx-react-lite': { singleton: true, requiredVersion: false },
        '@platform/core': { singleton: true, requiredVersion: false },
        '@platform/ui': { singleton: true, requiredVersion: false },
        '@platform/common': { singleton: true, requiredVersion: false },
      },
    }),
  );
}
```

### 8. Создание версионирования модулей (опционально)

- [ ] Создать `scripts/version-module.mjs`:

```javascript
#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import prompts from 'prompts';

const packagesDir = path.resolve(process.cwd(), 'packages');

/**
 * Сканирует директорию packages/ и возвращает список модулей
 */
function discoverModules(packagesDir) {
  if (!fs.existsSync(packagesDir)) {
    return [];
  }

  return fs
    .readdirSync(packagesDir, { withFileTypes: true })
    .filter((d) => {
      if (!d.isDirectory()) return false;
      const hasViteConfig = fs.existsSync(
        path.join(packagesDir, d.name, 'vite.config.mts'),
      );
      return hasViteConfig;
    })
    .map((d) => d.name);
}

async function versionModule(moduleName, bumpType) {
  const modulePath = path.join(packagesDir, moduleName);
  const pkgPath = path.join(modulePath, 'package.json');

  // Используем npm version для bump
  execSync(`npm version ${bumpType} --no-git-tag-version`, {
    cwd: modulePath,
    stdio: 'inherit',
  });

  // Читаем новую версию
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
  console.log(`\n✅ ${moduleName} bumped to v${pkg.version}`);

  return pkg.version;
}

async function main() {
  const moduleName = process.argv[2];
  const bumpType = process.argv[3] || 'patch';

  if (!moduleName) {
    const modules = discoverModules(packagesDir);

    const { selectedModule, selectedBump } = await prompts([
      {
        type: 'select',
        name: 'selectedModule',
        message: 'Select module:',
        choices: modules.map((m) => ({ title: m, value: m })),
      },
      {
        type: 'select',
        name: 'selectedBump',
        message: 'Version bump:',
        choices: [
          { title: 'patch (1.0.x)', value: 'patch' },
          { title: 'minor (1.x.0)', value: 'minor' },
          { title: 'major (x.0.0)', value: 'major' },
        ],
      },
    ]);

    await versionModule(selectedModule, selectedBump);
  } else {
    await versionModule(moduleName, bumpType);
  }
}

main().catch(console.error);
```

### 9. Тестирование production сборки

- [ ] Собрать все модули: `npm run build:modules`
- [ ] Проверить структуру dist/modules/
- [ ] Собрать host: `npm run build:host`
- [ ] Запустить preview с dev-server (для /app/start): `npm run preview`
- [ ] Проверить загрузку модулей через Federation

## Definition of Done (DoD)

1. ✅ Build утилиты размещены в `@platform/vite-config/build-utils/`
2. ⬜ Экспорты добавлены в `config/vite-config/index.js`
3. ⬜ outDir в module.config.js изменен на `dist/modules/{module}/latest`
4. ⬜ `build-module.mjs` создан и работает
5. ⬜ Параллельная сборка модулей работает (--parallel)
6. ⬜ Модули собираются в `/dist/modules/{module_name}/latest/`
7. ⬜ Host собирается в `/dist`

## Архитектура

### Манифест модулей

```
┌─────────────────────────────────────────────────────────────────┐
│                         Production                               │
│                                                                  │
│   ┌──────────┐     GET /app/start      ┌──────────────────┐    │
│   │  Host    │ ◄─────────────────────► │     Backend      │    │
│   │  App     │                         │  (БД/Конфиг)     │    │
│   └──────────┘                         └──────────────────┘    │
│        │                                        │               │
│        │ Манифест содержит:                     │               │
│        │ - modules[]                            │               │
│        │ - remoteEntry URLs                     │               │
│        │ - features, permissions                │               │
│        ▼                                        ▼               │
│   ┌──────────────────────────────────────────────────┐         │
│   │              CDN / Static Server                  │         │
│   │   /modules/todo/latest/assets/remoteEntry.js     │         │
│   │   /modules/api_example/latest/assets/remoteEntry.js │      │
│   └──────────────────────────────────────────────────┘         │
└─────────────────────────────────────────────────────────────────┘
```

### Централизованные утилиты

```
config/vite-config/
├── plugins/                    # Плагины (задача 006)
│   ├── types.ts               # 🔑 ЕДИНЫЙ ИСТОЧНИК типов манифеста
│   ├── moduleAliases.ts
│   ├── manifestMiddleware.ts
│   ├── loadManifest.ts
│   └── index.ts
├── build-utils/               # ✅ Build утилиты (реализовано)
│   ├── utils.ts               # getModuleVersion, discoverModules, isModuleBuilt
│   ├── generateManifest.ts    # Для dev/preview (не для production)
│   └── index.ts
├── host.config.ts
├── module.config.ts
└── index.js                   # ⬜ Добавить экспорты build-utils
```

## Структура dist после сборки

```
dist/
├── index.html                      # Host Application
├── assets/
│   ├── index-[hash].js
│   ├── index-[hash].css
│   ├── lib-core-[hash].js
│   ├── lib-ui-[hash].js
│   ├── lib-common-[hash].js
│   ├── vendor-[hash].js
│   └── ...
│
└── modules/                        # MFE модули (деплоятся отдельно)
    ├── todo/
    │   ├── latest/                 # Всегда актуальная версия
    │   │   └── assets/
    │   │       ├── remoteEntry.js
    │   │       └── ...
    │   └── 1.0.1/                  # Версионированная копия
    │       └── assets/
    │           ├── remoteEntry.js
    │           └── ...
    │
    └── api_example/
        ├── latest/
        │   └── assets/
        │       ├── remoteEntry.js
        │       └── ...
        └── 1.2.3/
            └── assets/
                ├── remoteEntry.js
                └── ...
```

**Версионирование модулей:**

- `latest/` — всегда содержит актуальную сборку
- `{version}/` — копия для rollback, A/B тестирования, канареечных релизов

> **Примечание**: `manifest.json` НЕ генерируется статически. Манифест поставляется бэкендом через `/app/start`. Бэкенд может указывать как `latest`, так и конкретную версию в `remoteEntry` URL.

## Риски и митигация

| Риск                               | Вероятность | Влияние | Митигация                                |
| ---------------------------------- | ----------- | ------- | ---------------------------------------- |
| Несовместимость версий shared deps | Средняя     | Высокое | Тестирование, lock файлы                 |
| Кеширование старых версий          | Средняя     | Среднее | Cache busting через hash в именах файлов |
| Большой размер бандлов             | Средняя     | Среднее | Bundle analyzer, code splitting          |

## Время выполнения

Ожидаемое время: **3-4 часа** (сокращено, т.к. build-utils уже реализованы и генерация манифеста не требуется)

## Примечания

- Build утилиты уже реализованы в `@platform/vite-config/build-utils/`
- Типы манифеста берутся из `@platform/vite-config/plugins/types.ts` (реэкспорт из `@platform/core`)
- **Манифест поставляется бэкендом** через `/app/start` — статическая генерация не требуется
- Модули собираются в `/dist/modules/{module_name}/latest/` + копия в `/{version}/`
- Host собирается в `/dist` (корневая директория dist)
- Бэкенд может использовать `latest` или конкретную версию в `remoteEntry` URL
