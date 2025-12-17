# Документация для разработчиков: Launcher

## Содержание

- [Архитектура](#архитектура)
- [Структура проекта](#структура-проекта)
- [Основные компоненты](#основные-компоненты)
- [Как добавить новую команду](#как-добавить-новую-команду)
- [Работа с контекстом](#работа-с-контекстом)
- [Тестирование](#тестирование)

---

## Архитектура

Лаунчер построен на основе **Command Pattern** и **Registry Pattern**, что обеспечивает:

- ✅ Легкое добавление новых команд (1 файл = 1 команда)
- ✅ Расширяемость без изменения существующего кода
- ✅ Четкое разделение ответственности
- ✅ Простое тестирование

### Основные принципы

1. **Каждая команда — отдельный класс**, наследующий `BaseCommand`
2. **Команды регистрируются в `CommandRegistry`**
3. **Общие сервисы доступны через `LauncherContext`**
4. **Главное меню состоит из двух частей:**
   - Список конфигураций (динамические пункты)
   - Команды (из реестра)

---

## Структура проекта

```
scripts/launcher/
├── core/                    # Ядро системы
│   ├── constants.mjs            # Константы и перечисления
│   ├── LauncherContext.mjs      # Контекст с общими сервисами
│   └── errors.mjs               # Кастомные ошибки (опционально)
│
├── config/                  # Управление конфигурациями
│   └── ConfigRepository.mjs     # CRUD операции с конфигами
│
├── modules/                 # Работа с модулями
│   ├── ModuleDiscovery.mjs      # Обнаружение модулей
│   ├── ModuleGenerator.mjs      # Генерация новых модулей
│   └── ManifestBuilder.mjs      # Построение манифеста
│
├── runners/                 # Запуск процессов
│   ├── ProcessManager.mjs       # Управление дочерними процессами
│   ├── ViteRunner.mjs           # Запуск Vite
│   └── DevServerRunner.mjs      # Запуск dev-server
│
├── cli/                     # CLI интерфейс
│   ├── CLIRunner.mjs            # Главный координатор
│   ├── CommandRegistry.mjs      # Реестр команд
│   ├── BaseCommand.mjs          # Базовый класс команды
│   ├── ArgumentParser.mjs       # Парсинг аргументов CLI
│   │
│   ├── commands/                # Команды
│   │   ├── RunConfigCommand.mjs
│   │   ├── CreateConfigCommand.mjs
│   │   ├── EditConfigCommand.mjs
│   │   ├── DeleteConfigCommand.mjs
│   │   ├── CreateModuleCommand.mjs
│   │   ├── SettingsCommand.mjs
│   │   └── ExitCommand.mjs
│   │
│   └── formatters/              # Форматирование вывода
│       └── ModuleFormatter.mjs
│
├── utils/                   # Утилиты
│   └── ModuleEditor.mjs         # Редактирование модулей
│
└── index.mjs                 # Публичный API
```

---

## Основные компоненты

### LauncherContext

Контекст приложения с общими сервисами для всех команд.

```javascript
const context = new LauncherContext({
  rootDir: process.cwd(), // Корневая директория проекта
  configPath: null, // Путь к configs.json (опционально)
});

// Доступные сервисы:
context.configRepository; // Управление конфигурациями
context.moduleDiscovery; // Обнаружение модулей
context.manifestBuilder; // Построение манифеста
context.viteRunner; // Запуск Vite
context.moduleGenerator; // Генерация модулей
context.registry; // Реестр команд (добавляется CLIRunner)
```

### BaseCommand

Базовый класс для всех команд. Каждая команда должна:

1. Наследоваться от `BaseCommand`
2. Реализовать геттеры `id` и `title`
3. Реализовать метод `execute()`
4. Опционально переопределить `order()` и `isVisible()`

```javascript
export class MyCommand extends BaseCommand {
  get id() {
    return 'my-command';
  }

  get title() {
    return '→ Моя команда';
  }

  get order() {
    return 50; // Порядок в меню (меньше = выше)
  }

  isVisible() {
    return true; // Показывать в главном меню
  }

  async execute(params = {}) {
    // Логика команды
    return { action: CommandAction.CONTINUE };
  }
}
```

### CommandRegistry

Реестр команд. Автоматически сортирует команды по `order` и фильтрует по `isVisible()`.

```javascript
const registry = new CommandRegistry();
registry.register(new MyCommand(context));

// Получить команды для меню
const commands = registry.getMenuCommands();

// Выполнить команду
await registry.execute('my-command', { param: 'value' });
```

### CLIRunner

Главный координатор CLI интерфейса. Управляет меню и обработкой выбора.

```javascript
const cli = new CLIRunner(context);

// Регистрация команд
cli.register(new MyCommand(context));

// Запуск CLI
await cli.run(args);
```

---

## Как добавить новую команду

### Шаг 1: Создать файл команды

Создайте файл `cli/commands/MyCommand.mjs`:

```javascript
import chalk from 'chalk';
import { BaseCommand } from '../BaseCommand.mjs';
import { CommandAction } from '../../core/constants.mjs';

/**
 * @class MyCommand
 * @description Описание команды
 */
export class MyCommand extends BaseCommand {
  get id() {
    return 'my-command';
  }

  get title() {
    return '→ Моя команда';
  }

  get order() {
    return 50; // Порядок в меню
  }

  async execute(params = {}) {
    const { configRepository } = this.context;

    // Ваша логика здесь
    console.log(chalk.green('✅ Команда выполнена'));

    return { action: CommandAction.CONTINUE };
  }
}
```

### Шаг 2: Зарегистрировать команду

В `scripts/dev-runner.mjs`:

```javascript
import { MyCommand } from './launcher/cli/commands/MyCommand.mjs';

// В функции main():
cli.register(new MyCommand(context));
```

### Шаг 3: Готово!

Команда появится в главном меню автоматически.

---

## Типы команд

### Видимые команды (в главном меню)

Команды, которые отображаются в главном меню:

```javascript
isVisible() {
  return true; // По умолчанию
}
```

**Примеры:** `CreateConfigCommand`, `CreateModuleCommand`, `SettingsCommand`, `ExitCommand`

### Скрытые команды (вызываются из подменю)

Команды, которые не видны в главном меню, но вызываются из подменю конфигураций:

```javascript
isVisible() {
  return false;
}
```

**Примеры:** `RunConfigCommand`, `EditConfigCommand`, `EditSettingsCommand`, `DeleteConfigCommand`

---

## Работа с контекстом

### ConfigRepository

Управление конфигурациями:

```javascript
const { configRepository } = this.context;

// Получить список конфигураций
const configs = configRepository.getList();

// Получить конфигурацию
const config = configRepository.get(configId);

// Создать конфигурацию
const id = configRepository.create(name, modules, description, settings);

// Обновить конфигурацию
configRepository.update(id, { name, modules, description });

// Удалить конфигурацию
configRepository.delete(id);

// Настройки
const settings = configRepository.getConfigSettings(configId);
configRepository.setConfigSettings(configId, { logLevel: 'DEBUG' });
```

### ModuleDiscovery

Обнаружение модулей:

```javascript
const { moduleDiscovery } = this.context;

// Получить INIT модули
const initModules = moduleDiscovery.getInitModules(); // ['core', 'core.layout']

// Получить NORMAL модули
const normalModules = await moduleDiscovery.getNormalModules();

// Проверить существование модуля
const exists = moduleDiscovery.moduleExists('todo');
```

### ManifestBuilder

Построение манифеста:

```javascript
const { manifestBuilder } = this.context;

const manifest = manifestBuilder.generate(config, moduleDiscovery);
```

### ViteRunner

Запуск Vite:

```javascript
const { viteRunner } = this.context;

await viteRunner.start(config, manifest, configRepository);
```

### ModuleGenerator

Генерация модулей:

```javascript
const { moduleGenerator } = this.context;

const moduleName = await moduleGenerator.create();
```

### CommandRegistry

Вызов других команд:

```javascript
// Выполнить команду из registry
if (this.context.registry) {
  await this.context.registry.execute('run-config', { configId });
}
```

---

## CommandAction

Результат выполнения команды:

```javascript
import { CommandAction } from '../../core/constants.mjs';

// Продолжить главное меню
return { action: CommandAction.CONTINUE };

// Выход из приложения
return { action: CommandAction.EXIT };

// Назад (для подменю)
return { action: CommandAction.BACK };
```

---

## Примеры

### Пример 1: Простая команда

```javascript
export class ClearCacheCommand extends BaseCommand {
  get id() {
    return 'clear-cache';
  }

  get title() {
    return '→ Очистить кэш';
  }

  get order() {
    return 50;
  }

  async execute() {
    const { configRepository } = this.context;

    // Логика очистки кэша
    await configRepository.clearCache();

    console.log(chalk.green('✅ Кэш очищен'));
    return { action: CommandAction.CONTINUE };
  }
}
```

### Пример 2: Команда с параметрами

```javascript
export class RunConfigCommand extends BaseCommand {
  get id() {
    return 'run-config';
  }

  isVisible() {
    return false; // Скрыта в меню
  }

  async execute(params = {}) {
    const { configId } = params;
    if (!configId) {
      throw new Error('configId обязателен');
    }

    const { configRepository, viteRunner } = this.context;
    const config = configRepository.get(configId);

    // Логика запуска
    await viteRunner.start(config, manifest, configRepository);

    return { action: CommandAction.EXIT };
  }
}
```

### Пример 3: Интерактивная команда

```javascript
import prompts from 'prompts';

export class MyInteractiveCommand extends BaseCommand {
  async execute() {
    const { name } = await prompts({
      type: 'text',
      name: 'name',
      message: 'Введите имя:',
    });

    if (!name) {
      return { action: CommandAction.CONTINUE };
    }

    // Обработка
    console.log(chalk.green(`✅ Обработано: ${name}`));
    return { action: CommandAction.CONTINUE };
  }
}
```

---

## Тестирование

### Тестирование команды

```javascript
import { LauncherContext } from './core/LauncherContext.mjs';
import { MyCommand } from './cli/commands/MyCommand.mjs';

const context = new LauncherContext({ rootDir: process.cwd() });
const command = new MyCommand(context);

const result = await command.execute();
console.assert(result.action === CommandAction.CONTINUE);
```

### Тестирование с моками

```javascript
const mockContext = {
  configRepository: {
    getList: () => [],
    get: (id) => ({ id, name: 'Test' }),
  },
  moduleDiscovery: {
    getNormalModules: async () => [],
  },
};

const command = new MyCommand(mockContext);
await command.execute();
```

---

## Отладка

### Включение отладочного вывода

```javascript
async execute() {
  console.log(chalk.gray(`[DEBUG] packagesDir: ${this.context.moduleDiscovery.packagesDir}`));
  // ...
}
```

### Проверка путей

```javascript
import path from 'path';

const rootDir = this.context.moduleDiscovery.packagesDir.replace(
  '/packages',
  '',
);
console.log('Root dir:', rootDir);
console.log('Config path:', path.resolve(rootDir, '.launcher/configs.json'));
```

---

## Лучшие практики

1. **Используйте константы** из `core/constants.mjs` вместо магических строк
2. **Обрабатывайте ошибки** с понятными сообщениями
3. **Возвращайте правильный `CommandAction`** для управления потоком
4. **Используйте `chalk`** для цветного вывода
5. **Документируйте команды** с JSDoc комментариями
6. **Тестируйте команды** изолированно

---

## FAQ

### Как скрыть команду из главного меню?

```javascript
isVisible() {
  return false;
}
```

### Как изменить порядок команды в меню?

```javascript
get order() {
  return 10; // Меньше = выше в меню
}
```

### Как получить доступ к другим командам?

```javascript
if (this.context.registry) {
  await this.context.registry.execute('other-command', params);
}
```

### Как обработать отмену пользователем?

```javascript
const { value } = await prompts({ ... });
if (!value) {
  return { action: CommandAction.CONTINUE };
}
```

---

## Полезные ссылки

- [План рефакторинга](../../../refactor_plan.md)
- [Примеры команд](./cli/commands/)
- [Константы](./core/constants.mjs)
