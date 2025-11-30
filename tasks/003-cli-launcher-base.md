# Задача 003: Базовая структура CLI Runner

## Статус: ⚪ Не начата

## Описание

Создание базовой структуры CLI Runner (Dev Launcher) - интерактивного инструмента для запуска проекта с гибким управлением источниками модулей (LOCAL/REMOTE). CLI Runner будет точкой входа для разработчиков при запуске `npm start`.

## Зависимости

- **Задача 001**: Реструктуризация проекта (должна быть завершена)

## Подзадачи

### 1. Установка зависимостей CLI

- [ ] Добавить dev-зависимости в корневой `package.json`:
  ```json
  {
    "devDependencies": {
      "prompts": "^2.4.2",
      "chalk": "^5.3.0",
      "ora": "^6.3.1"
    }
  }
  ```
- [ ] Выполнить `npm install`

### 2. Создание структуры директорий

- [ ] Создать директорию `scripts/launcher/`
- [ ] Создать директорию `.launcher/` (для хранения конфигураций, добавить в .gitignore)

### 3. Создание главного скрипта dev-runner.mjs

- [ ] Создать файл `scripts/dev-runner.mjs`:

  ```javascript
  #!/usr/bin/env node
  import chalk from 'chalk';
  import prompts from 'prompts';
  import { ConfigManager } from './launcher/config-manager.mjs';
  import { ModuleDiscovery } from './launcher/module-discovery.mjs';
  import { ViteLauncher } from './launcher/vite-launcher.mjs';

  async function main() {
    console.log(chalk.cyan.bold('\n🚀 Frontend MFE Launcher\n'));

    const configManager = new ConfigManager();
    const moduleDiscovery = new ModuleDiscovery();

    // Главное меню
    const mainMenu = await showMainMenu(configManager);
    // ...
  }

  main().catch(console.error);
  ```

### 4. Создание module-discovery.mjs

- [ ] Создать файл `scripts/launcher/module-discovery.mjs`:

  ```javascript
  import fs from 'fs';
  import path from 'path';

  export class ModuleDiscovery {
    constructor() {
      this.packagesDir = path.resolve(process.cwd(), 'packages');
      this.hostModulesDir = path.resolve(process.cwd(), 'host/src/modules');
    }

    // Возвращает список INIT модулей (из host/src/modules)
    getInitModules() {
      return ['core', 'core.layout'];
    }

    // Сканирует packages/ и возвращает список NORMAL модулей
    async getNormalModules() {
      const entries = fs.readdirSync(this.packagesDir, { withFileTypes: true });
      return entries
        .filter((entry) => entry.isDirectory())
        .map((entry) => ({
          name: entry.name,
          path: path.join(this.packagesDir, entry.name),
        }));
    }
  }
  ```

### 5. Создание vite-launcher.mjs

- [ ] Создать файл `scripts/launcher/vite-launcher.mjs`:

  ```javascript
  import { spawn } from 'child_process';
  import fs from 'fs';
  import path from 'path';

  export class ViteLauncher {
    async start(config, manifest) {
      // 1. Сохранить манифест в .launcher/current-manifest.json
      const manifestPath = path.resolve(
        process.cwd(),
        '.launcher/current-manifest.json',
      );
      fs.mkdirSync(path.dirname(manifestPath), { recursive: true });
      fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

      // 2. Определить локальные модули для ENV
      const localModules = manifest.modules
        .filter((m) => m.remoteEntry === '')
        .map((m) => m.name);

      // 3. Запустить Vite
      const env = {
        ...process.env,
        VITE_LOCAL_MODULES: localModules.join(','),
      };

      spawn('vite', ['--config', 'host/vite.config.mts'], {
        cwd: process.cwd(),
        env,
        stdio: 'inherit',
      });
    }
  }
  ```

### 6. Создание manifest-generator.mjs

- [ ] Создать файл `scripts/launcher/manifest-generator.mjs`:
  ```javascript
  export class ManifestGenerator {
    generate(config, modules) {
      const manifest = {
        modules: [],
      };

      // INIT модули всегда локальные
      manifest.modules.push(
        { name: 'core', loadType: 'init', loadPriority: 0, remoteEntry: '' },
        {
          name: 'core.layout',
          loadType: 'init',
          loadPriority: 2,
          remoteEntry: '',
        },
      );

      // NORMAL модули на основе конфигурации
      for (const [name, moduleConfig] of Object.entries(config.modules)) {
        manifest.modules.push({
          name,
          loadType: 'normal',
          loadPriority: moduleConfig.priority || 1,
          remoteEntry: moduleConfig.source === 'local' ? '' : moduleConfig.url,
          dependencies: moduleConfig.dependencies || [],
        });
      }

      return manifest;
    }
  }
  ```

### 7. Реализация главного меню

- [ ] Реализовать интерактивное меню в `dev-runner.mjs`:
  ```javascript
  async function showMainMenu(configManager) {
    const configs = configManager.getList();

    const choices = [
      ...configs.map((config, index) => ({
        title: `${index + 1}. ${config.name}`,
        value: { action: 'select', config: config.id },
      })),
      { title: '→ Создать новую конфигурацию', value: { action: 'create' } },
      {
        title: '→ Создать новый MFE модуль',
        value: { action: 'create-module' },
      },
      { title: '→ Общие настройки проекта', value: { action: 'settings' } },
      { title: '→ Выход', value: { action: 'exit' } },
    ];

    return prompts({
      type: 'select',
      name: 'menu',
      message: 'Выберите действие:',
      choices,
    });
  }
  ```

### 8. Обновление package.json scripts

- [ ] Обновить скрипты в корневом `package.json`:
  ```json
  {
    "scripts": {
      "start": "node scripts/dev-runner.mjs",
      "dev": "node scripts/dev-runner.mjs",
      "dev:quick": "node scripts/dev-runner.mjs --config development",
      "dev:all-local": "VITE_LOCAL_MODULES=* vite --config host/vite.config.mts"
    }
  }
  ```

### 9. Добавление .launcher/ в .gitignore

- [ ] Добавить в `.gitignore`:
  ```
  # Launcher configuration (local)
  .launcher/
  ```

### 10. Тестирование базовой функциональности

- [ ] Запустить `npm start` и проверить отображение меню
- [ ] Проверить сканирование модулей из `packages/`
- [ ] Проверить корректность выхода из приложения

## Definition of Done (DoD)

1. ✅ Зависимости CLI установлены (prompts, chalk, ora)
2. ✅ Структура `scripts/launcher/` создана
3. ✅ Главный скрипт `dev-runner.mjs` запускается без ошибок
4. ✅ `ModuleDiscovery` корректно находит INIT и NORMAL модули
5. ✅ `ManifestGenerator` генерирует валидный манифест
6. ✅ Интерактивное меню отображается корректно
7. ✅ `npm start` запускает CLI Runner
8. ✅ `.launcher/` добавлен в `.gitignore`
9. ✅ Базовый flow работает: меню → выбор → (пока только вывод в консоль)

## Структура после выполнения

```
scripts/
├── dev-runner.mjs              # 🆕 Главный скрипт CLI
├── launcher/
│   ├── config-manager.mjs      # Будет реализован в задаче 004
│   ├── module-discovery.mjs    # 🆕 Сканирование модулей
│   ├── manifest-generator.mjs  # 🆕 Генерация манифеста
│   └── vite-launcher.mjs       # 🆕 Запуск Vite
└── sync-tsconfig-paths.mjs     # Существующий скрипт

.launcher/                      # 🆕 Локальные конфигурации (gitignored)
├── configs.json                # Сохраненные конфигурации
└── current-manifest.json       # Текущий манифест
```

## UX Flow (базовый)

```
$ npm start

🚀 Frontend MFE Launcher

Выберите действие:
❯ 1. Development (все локально)
  2. Staging Hybrid
  → Создать новую конфигурацию
  → Создать новый MFE модуль
  → Общие настройки проекта
  → Выход
```

## Риски и митигация

| Риск                           | Вероятность | Влияние | Митигация                                            |
| ------------------------------ | ----------- | ------- | ---------------------------------------------------- |
| Несовместимость ESM в Node     | Низкая      | Среднее | Использовать .mjs расширение                         |
| Проблемы с chalk v5 (ESM-only) | Средняя     | Низкое  | Использовать динамический импорт или откатить версию |

## Время выполнения

Ожидаемое время: **4-6 часов**

## Примечания

- Это базовая структура, полная реализация конфигураций будет в задаче 004
- CLI Runner использует ESM модули (.mjs)
- chalk v5+ требует ESM, поэтому весь код launcher должен быть ESM
- Для Windows совместимости используем cross-platform пути через `path.resolve`
