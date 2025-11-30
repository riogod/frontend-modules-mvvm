# Задача 009: Federation Production Build & CI/CD

## Статус: ⚪ Не начата

## Описание

Настройка production сборки модулей с Module Federation, создание build скриптов и подготовка CI/CD пайплайна для независимого развертывания модулей.

**Централизация утилит**: Build утилиты (`getModuleVersion`, `generateManifest`, `discoverModules`) размещаются в `@platform/vite-config/build/` для переиспользования и консистентности с типами манифеста.

## Зависимости

- **Задача 002**: Централизованная Vite конфигурация (createModuleConfig)
- **Задача 006**: Vite плагины (типы манифеста `AppManifest`)
- **Задача 008**: RemoteModuleLoader (для тестирования загрузки)

## Подзадачи

### 1. Создание build утилит в @platform/vite-config

- [ ] Создать директорию `config/vite-config/build/`

- [ ] Создать `config/vite-config/build/utils.ts`:

  ```typescript
  import fs from 'fs';
  import path from 'path';
  import type { AppManifest, ModuleManifestEntry } from '../plugins/types';

  /**
   * Получает версию модуля из package.json
   */
  export function getModuleVersion(modulePath: string): string {
    const pkgPath = path.join(modulePath, 'package.json');
    if (fs.existsSync(pkgPath)) {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
      return pkg.version || '1.0.0';
    }
    return '1.0.0';
  }

  /**
   * Сканирует директорию packages/ и возвращает список модулей
   */
  export function discoverModules(packagesDir: string): string[] {
    if (!fs.existsSync(packagesDir)) {
      return [];
    }

    return fs
      .readdirSync(packagesDir, { withFileTypes: true })
      .filter((d) => {
        if (!d.isDirectory()) return false;
        // Проверяем наличие vite.config.mts
        const hasViteConfig = fs.existsSync(
          path.join(packagesDir, d.name, 'vite.config.mts'),
        );
        return hasViteConfig;
      })
      .map((d) => d.name);
  }

  /**
   * Проверяет, собран ли модуль (есть remoteEntry.js)
   */
  export function isModuleBuilt(distDir: string, moduleName: string): boolean {
    const remoteEntry = path.join(distDir, moduleName, 'latest', 'remoteEntry.js');
    return fs.existsSync(remoteEntry);
  }
  ```

- [ ] Создать `config/vite-config/build/generateManifest.ts`:

  ```typescript
  import fs from 'fs';
  import path from 'path';
  import type { AppManifest, ModuleManifestEntry } from '../plugins/types';
  import { getModuleVersion, isModuleBuilt } from './utils';

  export interface GenerateManifestOptions {
    /**
     * Путь к директории dist/modules/
     */
    distDir: string;

    /**
     * Путь к директории packages/
     */
    packagesDir: string;

    /**
     * Путь для сохранения манифеста
     */
    outputPath: string;

    /**
     * Базовый URL для модулей
     * @default '/modules/'
     */
    baseUrl?: string;

    /**
     * Использовать версию или 'latest' в URL
     * @default 'version'
     */
    versionStrategy?: 'version' | 'latest';

    /**
     * Дополнительные INIT модули
     */
    initModules?: ModuleManifestEntry[];
  }

  /**
   * Генерирует production манифест на основе собранных модулей
   */
  export function generateManifest(options: GenerateManifestOptions): AppManifest {
    const {
      distDir,
      packagesDir,
      outputPath,
      baseUrl = '/modules/',
      versionStrategy = 'version',
      initModules = [],
    } = options;

    const modules: ModuleManifestEntry[] = [];

    // INIT модули (всегда локальные, часть Host)
    const defaultInitModules: ModuleManifestEntry[] = [
      {
        name: 'core',
        version: '1.0.0',
        loadType: 'init',
        loadPriority: 0,
        remoteEntry: '',
      },
      {
        name: 'core.layout',
        version: '1.0.0',
        loadType: 'init',
        loadPriority: 2,
        remoteEntry: '',
      },
    ];

    modules.push(...defaultInitModules, ...initModules);

    // Сканируем собранные NORMAL модули
    if (fs.existsSync(distDir)) {
      const moduleNames = fs
        .readdirSync(distDir, { withFileTypes: true })
        .filter((d) => d.isDirectory())
        .map((d) => d.name);

      for (const moduleName of moduleNames) {
        if (!isModuleBuilt(distDir, moduleName)) {
          console.warn(`[generateManifest] Module ${moduleName} not built, skipping`);
          continue;
        }

        const version = getModuleVersion(path.join(packagesDir, moduleName));
        const versionPath = versionStrategy === 'latest' ? 'latest' : version;

        modules.push({
          name: moduleName,
          version,
          loadType: 'normal',
          loadPriority: 1,
          remoteEntry: `${baseUrl}${moduleName}/${versionPath}/remoteEntry.js`,
        });
      }
    }

    const manifest: AppManifest = { modules };

    // Сохраняем манифест
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, JSON.stringify(manifest, null, 2));

    console.log(`[generateManifest] Generated manifest with ${modules.length} modules`);
    console.log(`[generateManifest] Output: ${outputPath}`);

    return manifest;
  }
  ```

- [ ] Создать `config/vite-config/build/index.ts`:

  ```typescript
  export { getModuleVersion, discoverModules, isModuleBuilt } from './utils';
  export { generateManifest, type GenerateManifestOptions } from './generateManifest';
  ```

- [ ] Обновить `config/vite-config/index.js`:

  ```javascript
  export { createBaseConfig } from './base.config.js';
  export { createHostConfig } from './host.config.js';
  export { createLibConfig } from './lib.config.js';
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
    generateManifest,
  } from './build/index.js';
  ```

### 2. Создание build-module.mjs скрипта

- [ ] Создать `scripts/build-module.mjs`:

  ```javascript
  #!/usr/bin/env node
  import { spawn } from 'child_process';
  import fs from 'fs';
  import path from 'path';
  import { fileURLToPath } from 'url';
  import chalk from 'chalk';
  import ora from 'ora';
  import {
    getModuleVersion,
    discoverModules,
  } from '@platform/vite-config/build';

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
   */

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
    const outDir = path.join(distDir, moduleName, version);

    const spinner = ora(`Building ${chalk.cyan(moduleName)} v${version}`).start();

    return new Promise((resolve, reject) => {
      const args = ['build', '--outDir', outDir];

      if (options.analyze) {
        args.push('--mode', 'analyze');
      }

      const build = spawn('vite', args, {
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
          spinner.succeed(`Built ${chalk.cyan(moduleName)} v${version}`);
          console.log(`   Output: ${chalk.gray(outDir)}`);

          // Создаем latest symlink
          const latestDir = path.join(distDir, moduleName, 'latest');
          if (fs.existsSync(latestDir)) {
            fs.rmSync(latestDir, { recursive: true });
          }
          fs.cpSync(outDir, latestDir, { recursive: true });

          resolve({ name: moduleName, version, outDir });
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
      // Используем утилиту из @platform/vite-config
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
      console.log('  npm run build:module -- --name=todo --name=api --parallel');
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

### 3. Создание generate-manifest.mjs скрипта

- [ ] Создать `scripts/generate-manifest.mjs`:

  ```javascript
  #!/usr/bin/env node
  import path from 'path';
  import { fileURLToPath } from 'url';
  import { generateManifest } from '@platform/vite-config/build';

  const __dirname = path.dirname(fileURLToPath(import.meta.url));

  /**
   * Генерирует production манифест
   *
   * Использование:
   *   npm run generate:manifest
   *   npm run generate:manifest -- --latest  (использовать /latest/ вместо версии)
   */

  const args = process.argv.slice(2);
  const useLatest = args.includes('--latest');

  generateManifest({
    distDir: path.resolve(__dirname, '../dist/modules'),
    packagesDir: path.resolve(__dirname, '../packages'),
    outputPath: path.resolve(__dirname, '../dist/host/manifest.json'),
    baseUrl: '/modules/',
    versionStrategy: useLatest ? 'latest' : 'version',
  });
  ```

### 4. Обновление package.json scripts

- [ ] Добавить build скрипты в корневой `package.json`:

  ```json
  {
    "scripts": {
      "build": "npm run build:host",
      "build:host": "vite build --config host/vite.config.mts",
      "build:module": "node scripts/build-module.mjs",
      "build:modules": "node scripts/build-module.mjs --all",
      "build:modules:parallel": "node scripts/build-module.mjs --all --parallel",
      "build:all": "npm run build:host && npm run build:modules && npm run generate:manifest",
      "generate:manifest": "node scripts/generate-manifest.mjs",
      "preview:host": "vite preview --config host/vite.config.mts",
      "analyze:module": "node scripts/build-module.mjs --analyze"
    }
  }
  ```

### 5. Настройка Host для production

- [ ] Обновить `host/vite.config.mts` для production:

  ```typescript
  import federation from '@originjs/vite-plugin-federation';

  // В production конфигурации
  if (process.env.NODE_ENV === 'production') {
    config.plugins.push(
      federation({
        name: 'host',
        remotes: {
          // Remotes будут загружаться динамически через манифест
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

### 6. Создание Dockerfile для модулей

- [ ] Создать `docker/Dockerfile.module`:

  ```dockerfile
  # Сборка модуля
  FROM node:20-alpine AS builder

  ARG MODULE_NAME

  WORKDIR /app

  # Копируем package files
  COPY package*.json ./
  COPY packages/${MODULE_NAME}/package.json ./packages/${MODULE_NAME}/
  COPY libs/ ./libs/
  COPY config/ ./config/

  # Устанавливаем зависимости
  RUN npm ci

  # Копируем исходники модуля
  COPY packages/${MODULE_NAME}/ ./packages/${MODULE_NAME}/
  COPY tsconfig.base.json ./

  # Собираем модуль
  RUN npm run build:module -- --name=${MODULE_NAME}

  # Production образ
  FROM nginx:alpine

  ARG MODULE_NAME

  # Копируем собранный модуль
  COPY --from=builder /app/dist/modules/${MODULE_NAME} /usr/share/nginx/html/modules/${MODULE_NAME}

  # Копируем nginx конфиг
  COPY docker/nginx-module.conf /etc/nginx/conf.d/default.conf

  EXPOSE 80

  CMD ["nginx", "-g", "daemon off;"]
  ```

### 7. Создание nginx конфигурации

- [ ] Создать `docker/nginx-module.conf`:

  ```nginx
  server {
      listen 80;
      server_name localhost;

      root /usr/share/nginx/html;

      # CORS для Module Federation
      location /modules/ {
          add_header 'Access-Control-Allow-Origin' '*' always;
          add_header 'Access-Control-Allow-Methods' 'GET, OPTIONS' always;
          add_header 'Access-Control-Allow-Headers' 'Origin, Content-Type, Accept' always;

          if ($request_method = 'OPTIONS') {
              add_header 'Access-Control-Max-Age' 1728000;
              add_header 'Content-Type' 'text/plain charset=UTF-8';
              add_header 'Content-Length' 0;
              return 204;
          }

          # Кеширование для assets
          location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
              expires 1y;
              add_header Cache-Control "public, immutable";
          }

          try_files $uri $uri/ =404;
      }

      # Health check
      location /health {
          return 200 'OK';
          add_header Content-Type text/plain;
      }
  }
  ```

### 8. Создание GitHub Actions workflow

- [ ] Создать `.github/workflows/build-modules.yml`:

  ```yaml
  name: Build and Deploy Modules

  on:
    push:
      branches: [main, develop]
      paths:
        - 'packages/**'
    pull_request:
      branches: [main]
      paths:
        - 'packages/**'

  jobs:
    detect-changes:
      runs-on: ubuntu-latest
      outputs:
        modules: ${{ steps.changes.outputs.modules }}
      steps:
        - uses: actions/checkout@v4
          with:
            fetch-depth: 0

        - name: Detect changed modules
          id: changes
          run: |
            CHANGED_MODULES=$(git diff --name-only ${{ github.event.before }} ${{ github.sha }} | \
              grep '^packages/' | \
              cut -d'/' -f2 | \
              sort -u | \
              jq -R -s -c 'split("\n") | map(select(length > 0))')
            echo "modules=$CHANGED_MODULES" >> $GITHUB_OUTPUT

    build:
      needs: detect-changes
      if: needs.detect-changes.outputs.modules != '[]'
      runs-on: ubuntu-latest
      strategy:
        matrix:
          module: ${{ fromJson(needs.detect-changes.outputs.modules) }}

      steps:
        - uses: actions/checkout@v4

        - name: Setup Node.js
          uses: actions/setup-node@v4
          with:
            node-version: '20'
            cache: 'npm'

        - name: Install dependencies
          run: npm ci

        - name: Build module
          run: npm run build:module -- --name=${{ matrix.module }}

        - name: Upload artifacts
          uses: actions/upload-artifact@v4
          with:
            name: module-${{ matrix.module }}
            path: dist/modules/${{ matrix.module }}

    deploy:
      needs: build
      if: github.ref == 'refs/heads/main'
      runs-on: ubuntu-latest

      steps:
        - name: Download all artifacts
          uses: actions/download-artifact@v4
          with:
            path: dist/modules

        # Добавьте шаги деплоя для вашей инфраструктуры
        - name: Deploy to CDN
          run: |
            echo "Deploy modules to CDN"
            # aws s3 sync dist/modules s3://your-bucket/modules/
  ```

### 9. Создание версионирования модулей

- [ ] Создать `scripts/version-module.mjs`:

  ```javascript
  #!/usr/bin/env node
  import fs from 'fs';
  import path from 'path';
  import { execSync } from 'child_process';
  import prompts from 'prompts';
  import { discoverModules } from '@platform/vite-config/build';

  const packagesDir = path.resolve(process.cwd(), 'packages');

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

### 10. Тестирование production сборки

- [ ] Собрать все модули: `npm run build:modules`
- [ ] Сгенерировать манифест: `npm run generate:manifest`
- [ ] Проверить структуру dist/modules/
- [ ] Запустить preview: `npm run preview:host`
- [ ] Проверить загрузку модулей через Federation
- [ ] Проверить корректность версионирования

### 11. Документация

- [ ] Создать `docs/deployment.md` с инструкциями по деплою
- [ ] Добавить примеры CI/CD конфигураций для разных платформ

## Definition of Done (DoD)

1. ✅ Build утилиты размещены в `@platform/vite-config/build/`
2. ✅ `build-module.mjs` использует утилиты из `@platform/vite-config`
3. ✅ `generate-manifest.mjs` использует `generateManifest()` из `@platform/vite-config`
4. ✅ Параллельная сборка модулей работает (--parallel)
5. ✅ Версионирование модулей реализовано
6. ✅ Production манифест генерируется корректно
7. ✅ Host настроен для production с Federation
8. ✅ Docker конфигурация создана
9. ✅ GitHub Actions workflow создан
10. ✅ CORS настроен для Module Federation

## Архитектура централизованных утилит

```
config/vite-config/
├── plugins/                    # Плагины (задача 006)
│   ├── types.ts               # 🔑 ЕДИНЫЙ ИСТОЧНИК типов манифеста
│   ├── moduleAliases.ts
│   ├── manifestMiddleware.ts
│   ├── loadManifest.ts
│   └── index.ts
├── build/                     # 🆕 Build утилиты
│   ├── utils.ts               # getModuleVersion, discoverModules
│   ├── generateManifest.ts    # Генерация production манифеста
│   └── index.ts
├── host.config.ts
├── module.config.ts
└── index.js                   # Экспорт всего
```

## Структура dist после сборки

```
dist/
├── host/                           # Host Application
│   ├── index.html
│   ├── assets/
│   │   ├── index-[hash].js
│   │   ├── index-[hash].css
│   │   └── ...
│   └── manifest.json               # Production манифест
│
└── modules/                        # MFE модули
    ├── todo/
    │   ├── 1.0.0/                  # Версионированная сборка
    │   │   ├── remoteEntry.js
    │   │   └── assets/
    │   └── latest/                 # Копия последней версии
    │       ├── remoteEntry.js
    │       └── assets/
    │
    └── api_example/
        ├── 1.2.3/
        │   ├── remoteEntry.js
        │   └── assets/
        └── latest/
            ├── remoteEntry.js
            └── assets/
```

## Пример production манифеста

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
      "remoteEntry": "/modules/todo/1.0.0/remoteEntry.js"
    },
    {
      "name": "api_example",
      "version": "1.2.3",
      "loadType": "normal",
      "loadPriority": 2,
      "remoteEntry": "/modules/api_example/1.2.3/remoteEntry.js"
    }
  ]
}
```

## Риски и митигация

| Риск                               | Вероятность | Влияние | Митигация                                 |
| ---------------------------------- | ----------- | ------- | ----------------------------------------- |
| Несовместимость версий shared deps | Средняя     | Высокое | Тестирование, lock файлы                  |
| CORS ошибки                        | Высокая     | Высокое | Правильная настройка nginx/CDN            |
| Кеширование старых версий          | Средняя     | Среднее | Версионирование в URL, cache busting      |
| Большой размер бандлов             | Средняя     | Среднее | Bundle analyzer, code splitting           |

## Время выполнения

Ожидаемое время: **8-12 часов**

## Примечания

- Build утилиты централизованы в `@platform/vite-config` для переиспользования
- Типы манифеста берутся из `@platform/vite-config/plugins/types.ts` (единый источник)
- Версионирование позволяет откатиться на предыдущую версию модуля
- `latest/` копия упрощает тестирование, в production лучше использовать точные версии
- CORS критичен для Module Federation между разными доменами
