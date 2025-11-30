# Задача 004: Менеджер конфигураций CLI

## Статус: ✅ Выполнена

## Описание

Реализация полноценного менеджера конфигураций для CLI Runner. Включает CRUD операции для конфигураций запуска, управление Remote Server URL, интерактивный выбор источников модулей (LOCAL/REMOTE) и сохранение настроек.

## Зависимости

- **Задача 003**: Базовая структура CLI Runner (должна быть завершена)

## Подзадачи

### 1. Создание config-manager.mjs

- [ ] Создать файл `scripts/launcher/config-manager.mjs`:

  ```javascript
  import fs from 'fs';
  import path from 'path';

  export class ConfigManager {
    constructor() {
      this.configPath = path.resolve(process.cwd(), '.launcher/configs.json');
      this.config = this.load();
    }

    // Загрузка конфигураций
    load() {
      if (!fs.existsSync(this.configPath)) {
        return this.getDefaultConfig();
      }
      return JSON.parse(fs.readFileSync(this.configPath, 'utf-8'));
    }

    // Сохранение конфигураций
    save() {
      fs.mkdirSync(path.dirname(this.configPath), { recursive: true });
      fs.writeFileSync(this.configPath, JSON.stringify(this.config, null, 2));
    }

    // Дефолтная конфигурация
    getDefaultConfig() {
      return {
        version: '1.0.0',
        lastUsed: null,
        remoteServerUrl: '',
        configurations: {},
      };
    }
  }
  ```

### 2. Реализация CRUD операций

- [ ] Добавить методы в `ConfigManager`:

  ```javascript
  // Получить список конфигураций
  getList() {
    return Object.entries(this.config.configurations).map(([id, config]) => ({
      id,
      ...config,
    }));
  }

  // Получить конфигурацию по ID
  get(id) {
    return this.config.configurations[id];
  }

  // Создать новую конфигурацию
  create(name, modules) {
    const id = this.generateId(name);
    this.config.configurations[id] = {
      name,
      description: '',
      createdAt: new Date().toISOString(),
      usageCount: 0,
      modules,
    };
    this.save();
    return id;
  }

  // Обновить конфигурацию
  update(id, data) {
    if (!this.config.configurations[id]) {
      throw new Error(`Configuration ${id} not found`);
    }
    this.config.configurations[id] = {
      ...this.config.configurations[id],
      ...data,
    };
    this.save();
  }

  // Удалить конфигурацию
  delete(id) {
    delete this.config.configurations[id];
    this.save();
  }

  // Увеличить счетчик использования
  incrementUsage(id) {
    if (this.config.configurations[id]) {
      this.config.configurations[id].usageCount++;
      this.config.lastUsed = id;
      this.save();
    }
  }
  ```

### 3. Управление Remote Server URL

- [ ] Добавить методы для Remote URL:

  ```javascript
  // Проверить доступность REMOTE
  isRemoteAvailable() {
    return this.config.remoteServerUrl && this.config.remoteServerUrl.trim() !== '';
  }

  // Получить Remote Server URL
  getRemoteServerUrl() {
    return this.config.remoteServerUrl;
  }

  // Установить Remote Server URL
  setRemoteServerUrl(url) {
    this.config.remoteServerUrl = url;
    this.save();
  }

  // Получить URL для remote модуля
  getRemoteModuleUrl(moduleName) {
    if (!this.isRemoteAvailable()) {
      throw new Error('Remote Server URL не настроен');
    }
    const baseUrl = this.config.remoteServerUrl.replace(/\/$/, '');
    return `${baseUrl}/modules/${moduleName}/remoteEntry.js`;
  }
  ```

### 4. Реализация интерактивного создания конфигурации

- [ ] Добавить в `dev-runner.mjs` функцию создания конфигурации:

  ```javascript
  async function createConfiguration(configManager, moduleDiscovery) {
    const normalModules = await moduleDiscovery.getNormalModules();
    const isRemoteAvailable = configManager.isRemoteAvailable();

    console.log(chalk.yellow('\nINIT модули (загружаются всегда локально):'));
    console.log('  ✓ core');
    console.log('  ✓ core.layout\n');

    console.log(
      chalk.yellow('NORMAL модули (выберите источник для каждого):\n'),
    );

    const modules = {};

    for (const module of normalModules) {
      const choices = [
        { title: `🟢 LOCAL (packages/${module.name}/src)`, value: 'local' },
      ];

      if (isRemoteAvailable) {
        choices.push({
          title: `🔵 REMOTE (${configManager.getRemoteServerUrl()})`,
          value: 'remote',
        });
      } else {
        choices.push({
          title: '🔒 REMOTE (недоступно - настройте URL)',
          value: 'remote',
          disabled: true,
        });
      }

      const { source } = await prompts({
        type: 'select',
        name: 'source',
        message: `📦 ${module.name}:`,
        choices,
      });

      modules[module.name] = {
        source,
        path: source === 'local' ? `packages/${module.name}` : null,
        url:
          source === 'remote'
            ? configManager.getRemoteModuleUrl(module.name)
            : null,
      };
    }

    return modules;
  }
  ```

### 5. Реализация меню настроек проекта

- [ ] Добавить функцию настроек:

  ```javascript
  async function showSettings(configManager) {
    const isRemoteAvailable = configManager.isRemoteAvailable();

    console.log(chalk.cyan.bold('\n⚙️ Настройки проекта\n'));

    if (isRemoteAvailable) {
      console.log(
        chalk.green(
          `Remote Server URL: ${configManager.getRemoteServerUrl()}\n`,
        ),
      );
    } else {
      console.log(chalk.yellow('Remote Server URL: ⚠️ Не настроен\n'));
    }

    const choices = [
      {
        title: isRemoteAvailable ? '→ Изменить URL' : '→ Настроить URL',
        value: 'set-url',
      },
    ];

    if (isRemoteAvailable) {
      choices.push({ title: '→ Очистить URL', value: 'clear-url' });
    }

    choices.push({ title: '→ Назад', value: 'back' });

    const { action } = await prompts({
      type: 'select',
      name: 'action',
      message: 'Выберите действие:',
      choices,
    });

    if (action === 'set-url') {
      const { url } = await prompts({
        type: 'text',
        name: 'url',
        message: 'Введите Remote Server URL:',
        initial: configManager.getRemoteServerUrl() || 'https://',
        validate: (value) => {
          try {
            new URL(value);
            return true;
          } catch {
            return 'Введите корректный URL';
          }
        },
      });

      configManager.setRemoteServerUrl(url);
      console.log(chalk.green('✅ URL сохранен'));
    } else if (action === 'clear-url') {
      configManager.setRemoteServerUrl('');
      console.log(chalk.yellow('URL очищен. REMOTE модули недоступны.'));
    }
  }
  ```

### 6. Реализация выбора и редактирования существующей конфигурации

- [x] Добавить функцию работы с существующей конфигурацией:

  ```javascript
  async function selectConfiguration(configManager, configId) {
    const config = configManager.get(configId);

    console.log(chalk.cyan.bold(`\nКонфигурация: "${config.name}"\n`));

    for (const [name, moduleConfig] of Object.entries(config.modules)) {
      const icon = moduleConfig.source === 'local' ? '🟢' : '🔵';
      console.log(`  ${icon} ${name}: ${moduleConfig.source.toUpperCase()}`);
    }

    const { action } = await prompts({
      type: 'select',
      name: 'action',
      message: '\nЧто сделать?',
      choices: [
        { title: '→ Запустить', value: 'run' },
        { title: '→ Редактировать', value: 'edit' },
        { title: '→ Удалить', value: 'delete' },
        { title: '→ Назад', value: 'back' },
      ],
    });

    return action;
  }
  ```

### 7. Интеграция с ViteLauncher

- [ ] Обновить запуск Vite с выбранной конфигурацией:

  ```javascript
  async function runConfiguration(configManager, moduleDiscovery, configId) {
    const config = configManager.get(configId);
    const manifestGenerator = new ManifestGenerator();
    const viteLauncher = new ViteLauncher();

    // Генерируем манифест
    const manifest = manifestGenerator.generate(
      config,
      await moduleDiscovery.getNormalModules(),
    );

    // Увеличиваем счетчик использования
    configManager.incrementUsage(configId);

    console.log(chalk.green('\n🚀 Запускаем Vite...\n'));

    // Запускаем Vite
    await viteLauncher.start(config, manifest);
  }
  ```

### 8. Добавление дефолтной конфигурации "Development"

- [ ] Создать дефолтную конфигурацию при первом запуске:

  ```javascript
  async function ensureDefaultConfig(configManager, moduleDiscovery) {
    if (Object.keys(configManager.config.configurations).length === 0) {
      const normalModules = await moduleDiscovery.getNormalModules();
      const modules = {};

      for (const module of normalModules) {
        modules[module.name] = {
          source: 'local',
          path: `packages/${module.name}`,
        };
      }

      configManager.create('Development', modules);
      console.log(
        chalk.green('✅ Создана конфигурация "Development" по умолчанию\n'),
      );
    }
  }
  ```

### 9. Добавление CLI аргументов

- [ ] Добавить поддержку аргументов командной строки:

  ```javascript
  function parseArgs() {
    const args = process.argv.slice(2);
    return {
      configName: args.find((a) => a.startsWith('--config='))?.split('=')[1],
      last: args.includes('--last'),
      createModule: args.includes('--create-module'),
    };
  }

  // В main():
  const args = parseArgs();

  if (args.last && configManager.config.lastUsed) {
    await runConfiguration(
      configManager,
      moduleDiscovery,
      configManager.config.lastUsed,
    );
    return;
  }

  if (args.configName) {
    const configId = Object.keys(configManager.config.configurations).find(
      (id) =>
        configManager.config.configurations[id].name.toLowerCase() ===
        args.configName.toLowerCase(),
    );

    if (configId) {
      await runConfiguration(configManager, moduleDiscovery, configId);
      return;
    }
  }
  ```

### 10. Тестирование полного flow

- [ ] Проверить создание новой конфигурации
- [ ] Проверить выбор LOCAL/REMOTE для модулей
- [ ] Проверить сохранение и загрузку конфигураций
- [ ] Проверить настройку Remote Server URL
- [ ] Проверить запуск с аргументами `--config` и `--last`
- [ ] Проверить удаление конфигурации

## Definition of Done (DoD)

1. ✅ `ConfigManager` реализует полный CRUD для конфигураций
2. ✅ Remote Server URL можно настроить/очистить через меню
3. ✅ При отсутствии Remote URL опция REMOTE недоступна (disabled)
4. ✅ Интерактивное создание конфигурации работает корректно
5. ✅ Конфигурации сохраняются в `.launcher/configs.json`
6. ✅ Счетчик использования инкрементируется при запуске
7. ✅ CLI аргументы `--config` и `--last` работают
8. ✅ Дефолтная конфигурация "Development" создается автоматически
9. ✅ Полный flow: создание → сохранение → выбор → запуск работает
10. ✅ Манифест генерируется и сохраняется в `.launcher/current-manifest.json`
11. ✅ Редактирование существующих конфигураций реализовано:
    - ✅ Использует ту же функцию `editModulesMenu()` для редактирования модулей
    - ✅ Загружает текущие настройки конфигурации
    - ✅ Позволяет изменить имя и описание конфигурации
    - ✅ Обновляет модули через `ConfigManager.update()`
    - ✅ Предлагает запустить обновленную конфигурацию

## Структура configs.json

```json
{
  "version": "1.0.0",
  "lastUsed": "development",
  "remoteServerUrl": "https://staging.example.com",
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
      "description": "todo локально, остальное remote",
      "createdAt": "2024-01-16T14:30:00Z",
      "usageCount": 5,
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

## UX Flow (полный)

```
$ npm start

🚀 Frontend MFE Launcher

Сохраненные конфигурации:
  1. 🔷 Development (2 модулей)          [используется: 15 раз]
  2. 🟢 Staging Hybrid (1 модулей)

Выберите действие:
❯ 1. Development (2 модулей)
  2. Staging Hybrid (1 модулей)
  → Создать новую конфигурацию
  → Создать новый MFE модуль
  → Общие настройки проекта
  → Выход

[Выбор "Создать новую конфигурацию"]

📦 Настройка модулей

INIT модули (загружаются всегда локально):
  ✓ core
  ✓ core.layout

NORMAL модули (текущие настройки):

  todo: ⏭️  Пропустить
  api_example: ⏭️  Пропустить

Выберите модуль для редактирования (начните вводить для поиска):
❯ todo: ⏭️  Пропустить
  api_example: ⏭️  Пропустить
  → Готово
  → Отмена

[Выбор "todo"]

📦 todo:
❯ 🟢 LOCAL
  🔵 REMOTE (https://staging.example.com)
  ⏭️  Пропустить (не загружать)

[Выбор "🟢 LOCAL" - возврат к списку]

📦 Настройка модулей

NORMAL модули (текущие настройки):

  todo: 🟢 LOCAL
  api_example: ⏭️  Пропустить

Выберите модуль для редактирования:
❯ todo: 🟢 LOCAL
  api_example: ⏭️  Пропустить
  → Готово
  → Отмена

[Выбор "→ Готово"]

Имя конфигурации: [My Config]
Описание (необязательно): [Hybrid configuration]

✅ Конфигурация "My Config" сохранена!

Запустить конфигурацию сейчас?
❯ Да
  Нет

🚀 Запускаем Vite...
```

**[Редактирование существующей конфигурации]**

```
Конфигурация: "Development"

Модули:
  🟢 todo: LOCAL
  🟢 api_example: LOCAL

Что сделать?
❯ → Запустить
  → Редактировать
  → Удалить
  → Назад

[Выбор "→ Редактировать"]

📦 Настройка модулей

NORMAL модули (текущие настройки):

  todo: 🟢 LOCAL
  api_example: 🟢 LOCAL

Выберите модуль для редактирования:
❯ todo: 🟢 LOCAL
  api_example: 🟢 LOCAL
  → Готово
  → Отмена

[Выбор "api_example" → "🔵 REMOTE" → "→ Готово"]

Имя конфигурации: [Development]
Описание (необязательно): [Updated configuration]

✅ Конфигурация "Development" обновлена!

Запустить обновленную конфигурацию сейчас?
❯ Да
  Нет

🚀 Запускаем Vite...
```

**Особенности реализации:**

1. **Интерактивный цикл редактирования**:
   - Показывается список всех модулей с их текущими настройками
   - Можно выбрать любой модуль для редактирования
   - После выбора источника возврат к списку с обновленными настройками
   - Можно редактировать несколько модулей подряд
   - Работает как при создании новой конфигурации, так и при редактировании существующей

2. **Редактирование существующих конфигураций**:
   - При выборе "→ Редактировать" загружаются текущие настройки конфигурации
   - Используется та же функция `editModulesMenu()` для редактирования модулей
   - Можно изменить имя и описание конфигурации
   - После редактирования предлагается запустить обновленную конфигурацию

3. **Autocomplete для быстрого поиска**:
   - Можно начать вводить имя модуля
   - Список фильтруется в реальном времени
   - Поиск работает по имени модуля и по статусу

4. **По умолчанию все модули пропускаются** (только при создании новой конфигурации):
   - При создании новой конфигурации все NORMAL модули имеют статус "Пропустить"
   - Нужно явно выбрать источник для каждого модуля, который нужно загрузить

5. **Умная обработка Remote URL**:
   - Если Remote Server URL не настроен, опция REMOTE отображается как недоступная (🔒)
   - При попытке выбрать REMOTE без URL показывается подсказка

## Риски и митигация

| Риск                           | Вероятность | Влияние | Митигация                |
| ------------------------------ | ----------- | ------- | ------------------------ |
| Потеря конфигураций при ошибке | Средняя     | Среднее | Бэкап перед записью      |
| Некорректный URL               | Средняя     | Низкое  | Валидация URL            |
| Конфликт имен конфигураций     | Низкая      | Низкое  | Генерация уникального ID |

## Время выполнения

Ожидаемое время: **6-8 часов**

## Примечания

- Конфигурации хранятся локально и не коммитятся в репозиторий
- Remote Server URL единый для всего проекта (не для каждой конфигурации)
- При изменении Remote URL существующие конфигурации с REMOTE модулями автоматически обновляют URL
