#!/usr/bin/env node

import chalk from 'chalk';
import prompts from 'prompts';
import { ConfigManager } from './launcher/config-manager.mjs';
import { ModuleDiscovery } from './launcher/module-discovery.mjs';
import { ManifestGenerator } from './launcher/manifest-generator.mjs';
import { ViteLauncher } from './launcher/vite-launcher.mjs';
import { ModuleGenerator } from './launcher/module-generator.mjs';

/**
 * Парсинг аргументов командной строки
 */
function parseArgs() {
  const args = process.argv.slice(2);
  const result = {
    configName: null,
    last: false,
    createModule: false,
  };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--config' || args[i] === '-c') {
      result.configName = args[i + 1] || null;
      i++;
    } else if (args[i].startsWith('--config=')) {
      result.configName = args[i].split('=')[1];
    } else if (args[i] === '--last' || args[i] === '-l') {
      result.last = true;
    } else if (args[i] === '--create-module') {
      result.createModule = true;
    }
  }

  return result;
}

/**
 * Главное меню CLI Runner
 */
async function showMainMenu(configManager) {
  const configs = configManager.getList();

  const choices = [
    ...configs.map((config, index) => {
      const usageInfo =
        config.usageCount > 0
          ? ` [используется: ${config.usageCount} раз]`
          : '';
      const fullConfig = configManager.get(config.id);
      const moduleCount = Object.keys(fullConfig?.modules || {}).length;
      const moduleInfo =
        moduleCount > 0 ? ` (${moduleCount} модулей)` : ' (нет модулей)';

      // Формируем заголовок с описанием в той же строке через дефис
      let title = `${index + 1}. ${config.name}${moduleInfo}${usageInfo}`;
      if (fullConfig?.description && fullConfig.description.trim() !== '') {
        title += ` - ${chalk.gray(fullConfig.description)}`;
      }

      return {
        title,
        value: { action: 'select', config: config.id },
      };
    }),
    {
      title: '→ Создать новую конфигурацию',
      value: { action: 'create' },
    },
    {
      title: '→ Создать новый MFE модуль',
      value: { action: 'create-module' },
    },
    {
      title: '→ Настройки Remote Server URL',
      value: { action: 'settings' },
    },
    {
      title: '→ Выход',
      value: { action: 'exit' },
    },
  ];

  const response = await prompts({
    type: 'select',
    name: 'menu',
    message: 'Выберите действие:',
    choices,
    initial: 0,
  });

  return response.menu;
}

/**
 * Получить отображаемое имя источника модуля
 */
function getSourceDisplayName(source, isRemoteAvailable, remoteUrl, customUrl) {
  switch (source) {
    case 'local':
      return '🟢 LOCAL';
    case 'remote':
      return isRemoteAvailable
        ? `🔵 REMOTE (${remoteUrl})`
        : '🔒 REMOTE (недоступно)';
    case 'remote_custom':
      return customUrl
        ? `🟣 REMOTE_CUSTOM (${customUrl})`
        : '🟣 REMOTE_CUSTOM (не настроено)';
    case 'skip':
    default:
      return '⏭️  Пропустить';
  }
}

/**
 * Показать меню выбора источника для модуля
 */
async function selectModuleSource(moduleName, currentSource, configManager) {
  const isRemoteAvailable = configManager.isRemoteAvailable();
  const remoteUrl = isRemoteAvailable ? configManager.getRemoteServerUrl() : '';

  const choices = [
    { title: '🟢 LOCAL', value: 'local' },
    { title: '⏭️  Пропустить (не загружать)', value: 'skip' },
  ];

  if (isRemoteAvailable) {
    // Нормализуем URL для отображения
    const normalizedUrl = remoteUrl.trim().replace(/\/+$/, '');
    const displayUrl = `${normalizedUrl}/modules/${moduleName}/latest/remoteEntry.js`.replace(/\/+/g, '/');
    choices.splice(1, 0, {
      title: `🔵 REMOTE (${displayUrl})`,
      value: 'remote',
    });
  } else {
    choices.splice(1, 0, {
      title: '🔒 REMOTE (недоступно - настройте URL)',
      value: 'remote',
      disabled: true,
    });
  }

  // REMOTE_CUSTOM всегда доступен
  choices.splice(choices.length - 1, 0, {
    title: '🟣 REMOTE_CUSTOM (кастомный URL)',
    value: 'remote_custom',
  });

  // Находим текущий выбор
  const currentIndex = choices.findIndex((c) => c.value === currentSource);
  const initial =
    currentIndex >= 0
      ? currentIndex
      : choices.findIndex((c) => c.value === 'skip');

  const { source } = await prompts({
    type: 'select',
    name: 'source',
    message: `📦 ${moduleName}:`,
    choices,
    initial: initial >= 0 ? initial : 0,
  });

  return source || currentSource;
}

/**
 * Показать меню редактирования модулей
 */
async function editModulesMenu(normalModules, modules, configManager) {
  const isRemoteAvailable = configManager.isRemoteAvailable();
  const remoteUrl = isRemoteAvailable ? configManager.getRemoteServerUrl() : '';

  while (true) {
    // Очищаем экран (работает в большинстве терминалов)
    process.stdout.write('\x1B[2J\x1B[0f');

    console.log(chalk.cyan.bold('\n📦 Настройка модулей\n'));

    console.log(chalk.yellow('INIT модули (загружаются всегда локально):'));
    console.log('  ✓ core');
    console.log('  ✓ core.layout\n');

    if (normalModules.length === 0) {
      console.log(chalk.yellow('NORMAL модули не найдены.\n'));
      return modules;
    }

    console.log(chalk.yellow('NORMAL модули (текущие настройки):\n'));

    // Показываем список модулей с текущими настройками
    normalModules.forEach((module) => {
      const moduleConfig = modules[module.name] || {};
      const currentSource = moduleConfig.source || 'skip';
      const customUrl = moduleConfig.customUrl || '';
      const useLocalMocks = moduleConfig.useLocalMocks !== undefined 
        ? moduleConfig.useLocalMocks 
        : true;
      const displayName = getSourceDisplayName(
        currentSource,
        isRemoteAvailable,
        remoteUrl,
        customUrl,
      );
      // Показываем статус моков только если модуль не пропущен
      const mocksStatus = currentSource === 'skip' 
        ? '' 
        : (useLocalMocks ? ' ✅ моки' : ' 🔵 удаленный сервис');
      console.log(`  ${module.name}: ${displayName}${mocksStatus}`);
    });

    console.log(''); // Пустая строка для разделения

    const choices = normalModules.map((module) => {
      const moduleConfig = modules[module.name] || {};
      const currentSource = moduleConfig.source || 'skip';
      const customUrl = moduleConfig.customUrl || '';
      const useLocalMocks = moduleConfig.useLocalMocks !== undefined 
        ? moduleConfig.useLocalMocks 
        : true;
      const displayName = getSourceDisplayName(
        currentSource,
        isRemoteAvailable,
        remoteUrl,
        customUrl,
      );
      // Показываем статус моков только если модуль не пропущен
      const mocksStatus = currentSource === 'skip' 
        ? '' 
        : (useLocalMocks ? ' ✅ моки' : ' 🔵 удаленный сервис');
      return {
        title: `${module.name}: ${displayName}${mocksStatus}`,
        value: module.name,
      };
    });

    choices.push({ title: '→ Готово', value: 'done' });
    choices.push({ title: '→ Отмена', value: 'cancel' });

    const { selectedModule } = await prompts({
      type: 'autocomplete',
      name: 'selectedModule',
      message:
        'Выберите модуль для редактирования (начните вводить для поиска):',
      choices,
      suggest: (input, choices) => {
        if (!input) {
          return choices;
        }
        const searchTerm = input.toLowerCase();
        return choices.filter(
          (choice) =>
            choice.title.toLowerCase().includes(searchTerm) ||
            choice.value.toLowerCase().includes(searchTerm),
        );
      },
    });

    if (!selectedModule || selectedModule === 'cancel') {
      return null;
    }

    if (selectedModule === 'done') {
      return modules;
    }

    // Редактируем выбранный модуль
    const moduleConfig = modules[selectedModule] || {};
    const currentSource = moduleConfig.source || 'skip';
    const newSource = await selectModuleSource(
      selectedModule,
      currentSource,
      configManager,
    );

    if (newSource === 'skip') {
      // Удаляем модуль из конфигурации
      delete modules[selectedModule];
    } else {
      // Обновляем или добавляем модуль
      modules[selectedModule] = {
        source: newSource,
        priority: moduleConfig.priority || 1,
        useLocalMocks: moduleConfig.useLocalMocks !== undefined 
          ? moduleConfig.useLocalMocks 
          : true, // По умолчанию используем моки
      };

      if (newSource === 'local') {
        modules[selectedModule].path = `packages/${selectedModule}`;
      } else if (newSource === 'remote') {
        modules[selectedModule].url =
          configManager.getRemoteModuleUrl(selectedModule);
      } else if (newSource === 'remote_custom') {
        // Запрашиваем кастомный URL
        const { customUrl } = await prompts({
          type: 'text',
          name: 'customUrl',
          message: 'Введите URL до remoteEntry.js:',
          initial: moduleConfig.customUrl || 'https://',
          validate: (value) => {
            if (!value || value.trim() === '') {
              return 'URL не может быть пустым';
            }
            try {
              new URL(value);
              return true;
            } catch {
              return 'Введите корректный URL';
            }
          },
        });

        if (customUrl) {
          modules[selectedModule].customUrl = customUrl.trim();
          modules[selectedModule].url = customUrl.trim();
        }
      }

      // Запрашиваем использование локальных моков для всех типов модулей
      const { useLocalMocks } = await prompts({
        type: 'confirm',
        name: 'useLocalMocks',
        message: 'Использовать локальные моки для этого модуля? (Нет = использовать удаленный сервис)',
        initial: moduleConfig.useLocalMocks !== undefined 
          ? moduleConfig.useLocalMocks 
          : true,
      });

      modules[selectedModule].useLocalMocks = useLocalMocks;
    }
  }
}

/**
 * Интерактивное создание конфигурации
 */
async function createConfiguration(configManager, moduleDiscovery) {
  const normalModules = await moduleDiscovery.getNormalModules();

  if (normalModules.length === 0) {
    console.log(chalk.yellow('\nNORMAL модули не найдены.\n'));
    return null;
  }

  // Инициализируем все модули как пропущенные по умолчанию
  const modules = {};

  // Показываем меню редактирования модулей
  const resultModules = await editModulesMenu(
    normalModules,
    modules,
    configManager,
  );

  if (!resultModules) {
    return null; // Пользователь отменил
  }

  // Запрашиваем имя конфигурации
  const { name } = await prompts({
    type: 'text',
    name: 'name',
    message: 'Имя конфигурации:',
    validate: (value) => {
      if (!value || value.trim() === '') {
        return 'Имя не может быть пустым';
      }
      return true;
    },
  });

  if (!name) {
    return null;
  }

  // Опциональное описание
  const { description } = await prompts({
    type: 'text',
    name: 'description',
    message: 'Описание (необязательно):',
  });

  // Запрашиваем настройки конфигурации
  console.log(chalk.cyan('\n⚙️ Настройки конфигурации\n'));

  const envLogLevel = process.env.LOG_LEVEL;
  let logLevel = 'INFO';
  if (!envLogLevel) {
    const levelChoices = [
      { title: 'NONE - Отключить все логи', value: 'NONE' },
      { title: 'ERROR - Только ошибки', value: 'ERROR' },
      { title: 'WARN - Предупреждения и ошибки', value: 'WARN' },
      { title: 'INFO - Информация, предупреждения и ошибки', value: 'INFO' },
      { title: 'DEBUG - Отладочная информация', value: 'DEBUG' },
      { title: 'TRACE - Полная трассировка', value: 'TRACE' },
    ];

    const { level } = await prompts({
      type: 'select',
      name: 'level',
      message: 'Выберите уровень логирования:',
      choices: levelChoices,
      initial: 3, // INFO по умолчанию
    });
    logLevel = level || 'INFO';
  } else {
    console.log(
      chalk.yellow(
        `Уровень логирования: ${envLogLevel} (из переменной окружения LOG_LEVEL)\n`,
      ),
    );
  }

  const { useLocalMocks } = await prompts({
    type: 'confirm',
    name: 'useLocalMocks',
    message: 'Использовать локальные моки для host?',
    initial: true,
  });

  let apiUrl = '';
  if (!useLocalMocks) {
    const { url } = await prompts({
      type: 'text',
      name: 'url',
      message: 'Введите API URL:',
      initial: 'http://localhost:3000',
      validate: (value) => {
        if (!value || value.trim() === '') {
          return 'URL не может быть пустым';
        }
        try {
          new URL(value);
          return true;
        } catch {
          return 'Введите корректный URL';
        }
      },
    });
    apiUrl = url?.trim() || '';
  }

  // Создаем конфигурацию с настройками
  const configId = configManager.create(
    name.trim(),
    resultModules,
    description?.trim() || '',
    {
      logLevel,
      useLocalMocks,
      apiUrl,
    },
  );
  console.log(chalk.green(`\n✅ Конфигурация "${name}" сохранена!\n`));

  return configId;
}

/**
 * Меню настроек Remote Server URL (глобальная настройка)
 */
async function showSettings(configManager) {
  while (true) {
    process.stdout.write('\x1B[2J\x1B[0f');

  const isRemoteAvailable = configManager.isRemoteAvailable();

    console.log(chalk.cyan.bold('\n⚙️ Настройки Remote Server URL\n'));
    console.log(
      chalk.gray(
        '💡 Remote Server URL используется для загрузки REMOTE модулей из удаленного сервера\n',
      ),
    );

  if (isRemoteAvailable) {
    console.log(
      chalk.green(`Remote Server URL: ${configManager.getRemoteServerUrl()}\n`),
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

    if (!action || action === 'back') {
      return;
    }

    if (action === 'set-url') {
      const { url } = await prompts({
        type: 'text',
        name: 'url',
        message: 'Введите Remote Server URL:',
        initial: configManager.getRemoteServerUrl() || 'https://',
        validate: (value) => {
          if (!value || value.trim() === '') {
            return 'URL не может быть пустым';
          }
          try {
            new URL(value);
            return true;
          } catch {
            return 'Введите корректный URL';
          }
        },
      });

      if (url) {
        configManager.setRemoteServerUrl(url);
        console.log(chalk.green('\n✅ URL сохранен\n'));
      }
    } else if (action === 'clear-url') {
      configManager.setRemoteServerUrl('');
      console.log(chalk.yellow('\nURL очищен. REMOTE модули недоступны.\n'));
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
  }
}

/**
 * Редактирование настроек конфигурации
 */
async function editConfigurationSettings(configManager, configId) {
  const config = configManager.get(configId);
  if (!config) {
    console.log(chalk.red(`\nКонфигурация "${configId}" не найдена.\n`));
    return;
  }

  const settings = configManager.getConfigSettings(configId);

  while (true) {
    process.stdout.write('\x1B[2J\x1B[0f');
    console.log(chalk.cyan.bold(`\n⚙️ Настройки конфигурации: "${config.name}"\n`));

    const envLogLevel = process.env.LOG_LEVEL;
    const currentLogLevel = settings.logLevel || 'INFO';
    const useLocalMocks = settings.useLocalMocks !== undefined ? settings.useLocalMocks : true;
    const apiUrl = settings.apiUrl || '';

  // Показываем уровень логирования
  if (envLogLevel) {
    console.log(
      chalk.yellow(
        `Уровень логирования: ${envLogLevel} (из переменной окружения LOG_LEVEL)\n`,
      ),
    );
    console.log(
      chalk.gray(
          `💡 Переменная окружения имеет приоритет над настройками конфигурации\n`,
      ),
    );
  } else {
    console.log(
      chalk.green(`Уровень логирования: ${currentLogLevel}\n`),
    );
  }

  // Показываем настройку моков
  const mocksStatus = useLocalMocks
    ? chalk.green('Да (используются локальные моки MSW)')
    : chalk.yellow(`Нет (используется API: ${apiUrl || 'не настроен'})`);
  console.log(`Использовать локальные моки: ${mocksStatus}\n`);

  const choices = [
    {
      title: `→ Настроить уровень логирования ${envLogLevel ? '(заблокировано - используется переменная окружения)' : `(текущий: ${currentLogLevel})`}`,
      value: 'set-log-level',
        disabled: !!envLogLevel,
    },
    {
        title: `→ Использовать локальные моки для host (текущее: ${useLocalMocks ? 'Да' : 'Нет'})`,
      value: 'set-use-mocks',
    },
  ];

  // Добавляем пункт настройки API URL только если моки отключены
  if (!useLocalMocks) {
    choices.push({
      title: `→ Настроить API URL ${apiUrl ? `(текущий: ${apiUrl})` : '(не настроен)'}`,
      value: 'set-api-url',
    });
  }

  choices.push({ title: '→ Назад', value: 'back' });

  const { action } = await prompts({
    type: 'select',
    name: 'action',
    message: 'Выберите действие:',
    choices,
  });

    if (!action || action === 'back') {
      return;
    }

    if (action === 'set-log-level') {
    const levelChoices = [
      { title: 'NONE - Отключить все логи', value: 'NONE' },
      { title: 'ERROR - Только ошибки', value: 'ERROR' },
      { title: 'WARN - Предупреждения и ошибки', value: 'WARN' },
      { title: 'INFO - Информация, предупреждения и ошибки', value: 'INFO' },
      { title: 'DEBUG - Отладочная информация', value: 'DEBUG' },
      { title: 'TRACE - Полная трассировка', value: 'TRACE' },
    ];

    const choicesWithCurrent = levelChoices.map((choice) => {
      const isCurrent = choice.value === currentLogLevel;
      return {
        ...choice,
        title: isCurrent ? `${choice.title} ← текущий` : choice.title,
      };
    });

    const { level } = await prompts({
      type: 'select',
      name: 'level',
      message: `Выберите уровень логирования (текущий: ${currentLogLevel}):`,
      choices: choicesWithCurrent,
      initial: ['NONE', 'ERROR', 'WARN', 'INFO', 'DEBUG', 'TRACE'].indexOf(
        currentLogLevel,
      ),
    });

    if (level) {
        configManager.setConfigSettings(configId, { logLevel: level });
      console.log(chalk.green(`\n✅ Уровень логирования установлен: ${level}\n`));
      console.log(
        chalk.yellow(
          '💡 Примечание: переменная окружения LOG_LEVEL имеет приоритет над этой настройкой\n',
        ),
      );
    }
  } else if (action === 'set-use-mocks') {
    const { useMocks } = await prompts({
      type: 'confirm',
      name: 'useMocks',
      message: 'Использовать локальные моки для host?',
      initial: useLocalMocks,
    });

    if (useMocks !== undefined) {
        configManager.setConfigSettings(configId, { useLocalMocks: useMocks });
      const status = useMocks ? 'включены' : 'отключены';
      console.log(chalk.green(`\n✅ Локальные моки ${status}\n`));
      
      if (!useMocks && !apiUrl) {
        console.log(
          chalk.yellow(
            '⚠️  Внимание: API URL не настроен. Настройте его в следующем пункте меню.\n',
          ),
        );
      }
    }
  } else if (action === 'set-api-url') {
    const { url } = await prompts({
      type: 'text',
      name: 'url',
      message: 'Введите API URL:',
      initial: apiUrl || 'http://localhost:3000',
      validate: (value) => {
        if (!value || value.trim() === '') {
          return 'URL не может быть пустым';
        }
        try {
          new URL(value);
          return true;
        } catch {
          return 'Введите корректный URL';
        }
      },
    });

    if (url) {
        configManager.setConfigSettings(configId, { apiUrl: url.trim() });
      console.log(chalk.green(`\n✅ API URL сохранен: ${url}\n`));
    }
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
  }
}

/**
 * Выбор и работа с существующей конфигурацией
 */
async function selectConfiguration(configManager, configId) {
  const config = configManager.get(configId);

  if (!config) {
    console.log(chalk.red(`\nКонфигурация "${configId}" не найдена.\n`));
    return null;
  }

  console.log(chalk.cyan.bold(`\nКонфигурация: "${config.name}"\n`));

  if (config.description) {
    console.log(chalk.gray(`Описание: ${config.description}\n`));
  }

  console.log('Модули:');
  if (Object.keys(config.modules || {}).length === 0) {
    console.log(chalk.gray('  (нет модулей)'));
  } else {
    for (const [name, moduleConfig] of Object.entries(config.modules || {})) {
      let icon = '⏭️';
      let source = 'SKIP';
      if (moduleConfig.source === 'local') {
        icon = '🟢';
        source = 'LOCAL';
      } else if (moduleConfig.source === 'remote') {
        icon = '🔵';
        source = 'REMOTE';
      } else if (moduleConfig.source === 'remote_custom') {
        icon = '🟣';
        source = 'REMOTE_CUSTOM';
      }
      // Показываем статус моков только если модуль не пропущен
      const mocksStatus = source === 'SKIP' 
        ? '' 
        : (moduleConfig.useLocalMocks !== false ? ' ✅ моки' : ' 🔵 удаленный сервис');
      console.log(`  ${icon} ${name}: ${source}${mocksStatus}`);
    }
  }

  // Показываем настройки конфигурации
  const settings = configManager.getConfigSettings(configId);
  console.log(chalk.yellow('\nНастройки конфигурации:'));
  console.log(
    `  Уровень логирования: ${settings.logLevel || 'INFO'}`,
  );
  console.log(
    `  Использовать локальные моки: ${settings.useLocalMocks !== false ? 'Да' : 'Нет'}`,
  );
  if (!settings.useLocalMocks && settings.apiUrl) {
    console.log(`  API URL: ${settings.apiUrl}`);
  } else if (!settings.useLocalMocks && !settings.apiUrl) {
    console.log(chalk.yellow('  API URL: ⚠️ не настроен'));
  }

  const { action } = await prompts({
    type: 'select',
    name: 'action',
    message: '\nЧто сделать?',
    choices: [
      { title: '→ Запустить', value: 'run' },
      { title: '→ Редактировать модули', value: 'edit' },
      { title: '→ Настроить параметры', value: 'settings' },
      { title: '→ Удалить', value: 'delete' },
      { title: '→ Назад', value: 'back' },
    ],
  });

  return action;
}

/**
 * Запуск конфигурации
 */
async function runConfiguration(
  configManager,
  moduleDiscovery,
  manifestGenerator,
  viteLauncher,
  configId,
) {
  // Получаем конфигурацию
  let config = configManager.get(configId);

  if (!config) {
    console.log(chalk.red(`Конфигурация "${configId}" не найдена.`));
    return;
  }

  // Фильтруем несуществующие модули перед генерацией манифеста
  if (config.modules) {
    const filteredModules = {};
    let removedCount = 0;

    for (const [name, moduleConfig] of Object.entries(config.modules)) {
      // Для LOCAL модулей проверяем существование
      if (moduleConfig.source === 'local') {
        if (moduleDiscovery.moduleExists(name)) {
          filteredModules[name] = moduleConfig;
        } else {
          removedCount++;
          console.warn(
            chalk.yellow(
              `⚠️  Модуль "${name}" пропущен: не найден в packages/${name}`,
            ),
          );
        }
      } else {
        // REMOTE модули не проверяем
        filteredModules[name] = moduleConfig;
      }
    }

    // Если были удалены модули, обновляем конфигурацию
    if (removedCount > 0) {
      console.log(
        chalk.yellow(
          `\n⚠️  Удалено ${removedCount} несуществующих модулей из конфигурации.\n`,
        ),
      );
      config.modules = filteredModules;
      configManager.update(
        configId,
        config.name,
        filteredModules,
        config.description,
      );
      // Обновляем локальную переменную
      config = { ...config, modules: filteredModules };
    }
  }

  // Генерируем манифест заново при каждом запуске
  // Это гарантирует, что манифест всегда содержит актуальные данные из конфигов модулей
  console.log(chalk.cyan('📋 Генерация манифеста с актуальными данными из модулей...\n'));
  const manifest = manifestGenerator.generate(config, moduleDiscovery);
  console.log(chalk.green('✅ Манифест сгенерирован\n'));

  // Увеличиваем счетчик использования
  configManager.incrementUsage(configId);

  console.log(chalk.green('\n🚀 Запускаем Vite...\n'));

  // Запускаем Vite
  await viteLauncher.start(config, manifest, configManager);
}

/**
 * Обеспечить наличие дефолтной конфигурации
 */
async function ensureDefaultConfig(configManager, moduleDiscovery) {
  if (Object.keys(configManager.config.configurations).length === 0) {
    const normalModules = await moduleDiscovery.getNormalModules();
    const modules = {};

    for (const module of normalModules) {
      modules[module.name] = {
        source: 'local',
        path: `packages/${module.name}`,
        priority: 1,
        useLocalMocks: true, // По умолчанию используем моки
      };
    }

    configManager.create('Development', modules, 'Все модули локально с HMR', {
      logLevel: 'INFO',
      useLocalMocks: true,
      apiUrl: '',
    });
    console.log(
      chalk.green('✅ Создана конфигурация "Development" по умолчанию\n'),
    );
  }
}

/**
 * Главная функция
 */
async function main() {
  console.log(chalk.cyan.bold('\n🚀 Frontend MFE Launcher\n'));

  const configManager = new ConfigManager();
  const moduleDiscovery = new ModuleDiscovery();
  const manifestGenerator = new ManifestGenerator();
  const viteLauncher = new ViteLauncher();

  // Обеспечиваем наличие дефолтной конфигурации
  await ensureDefaultConfig(configManager, moduleDiscovery);

  // Парсинг аргументов командной строки
  const args = parseArgs();

  // Запуск с последней использованной конфигурацией
  if (args.last && configManager.config.lastUsed) {
    await runConfiguration(
      configManager,
      moduleDiscovery,
      manifestGenerator,
      viteLauncher,
      configManager.config.lastUsed,
    );
    return;
  }

  // Запуск с указанной конфигурацией
  if (args.configName) {
    const configId = Object.keys(configManager.config.configurations).find(
      (id) =>
        configManager.config.configurations[id].name.toLowerCase() ===
          args.configName.toLowerCase() || id === args.configName,
    );

    if (configId) {
      await runConfiguration(
        configManager,
        moduleDiscovery,
        manifestGenerator,
        viteLauncher,
        configId,
      );
      return;
    } else {
      console.log(chalk.red(`Конфигурация "${args.configName}" не найдена.`));
      process.exit(1);
    }
  }

  try {
    while (true) {
      const menuChoice = await showMainMenu(configManager);

      if (!menuChoice) {
        // Пользователь нажал Ctrl+C
        console.log(chalk.yellow('\n\nВыход из приложения.'));
        process.exit(0);
      }

      switch (menuChoice.action) {
        case 'select': {
          const config = configManager.get(menuChoice.config);
          if (!config) {
            console.log(
              chalk.red(`Конфигурация "${menuChoice.config}" не найдена.`),
            );
            break;
          }

          const action = await selectConfiguration(
            configManager,
            menuChoice.config,
          );
          if (action === 'run') {
            await runConfiguration(
              configManager,
              moduleDiscovery,
              manifestGenerator,
              viteLauncher,
              menuChoice.config,
            );
            return; // Выходим после запуска Vite
          } else if (action === 'settings') {
            // Редактирование настроек конфигурации
            await editConfigurationSettings(
              configManager,
              menuChoice.config,
            );
          } else if (action === 'edit') {
            // Редактирование конфигурации
            const normalModules = await moduleDiscovery.getNormalModules();
            const currentModules = { ...config.modules };

            // Удаляем несуществующие модули из текущей конфигурации
            const filteredModules = {};
            let removedCount = 0;
            for (const [name, moduleConfig] of Object.entries(currentModules)) {
              if (moduleConfig.source === 'local') {
                if (moduleDiscovery.moduleExists(name)) {
                  filteredModules[name] = {
                    ...moduleConfig,
                    useLocalMocks: moduleConfig.useLocalMocks !== undefined 
                      ? moduleConfig.useLocalMocks 
                      : true, // По умолчанию используем моки
                  };
                } else {
                  removedCount++;
                  console.log(
                    chalk.yellow(
                      `⚠️  Модуль "${name}" удален из конфигурации: не найден в packages/${name}`,
                    ),
                  );
                }
              } else {
                // REMOTE и REMOTE_CUSTOM модули не проверяем
                filteredModules[name] = moduleConfig;
              }
            }

            if (removedCount > 0) {
              console.log(
                chalk.yellow(
                  `\n⚠️  Удалено ${removedCount} несуществующих модулей из конфигурации.\n`,
                ),
              );
            }

            // Используем ту же функцию редактирования модулей
            const editedModules = await editModulesMenu(
              normalModules,
              filteredModules,
              configManager,
            );

            if (editedModules !== null) {
              // Обновляем конфигурацию
              const { name, description } = await prompts([
                {
                  type: 'text',
                  name: 'name',
                  message: 'Имя конфигурации:',
                  initial: config.name,
                  validate: (value) => {
                    if (!value || value.trim() === '') {
                      return 'Имя не может быть пустым';
                    }
                    return true;
                  },
                },
                {
                  type: 'text',
                  name: 'description',
                  message: 'Описание (необязательно):',
                  initial: config.description || '',
                },
              ]);

              if (name) {
                // Сохраняем описание: если пользователь не ввел новое, сохраняем старое
                const finalDescription =
                  description?.trim() || config.description || '';
                configManager.update(menuChoice.config, {
                  name: name.trim(),
                  description: finalDescription,
                  modules: editedModules,
                });
                console.log(
                  chalk.green(`\n✅ Конфигурация "${name}" обновлена!\n`),
                );

                // Спрашиваем, запустить ли сразу
                const { runNow } = await prompts({
                  type: 'confirm',
                  name: 'runNow',
                  message: 'Запустить обновленную конфигурацию сейчас?',
                  initial: true,
                });
                if (runNow) {
                  await runConfiguration(
                    configManager,
                    moduleDiscovery,
                    manifestGenerator,
                    viteLauncher,
                    menuChoice.config,
                  );
                  return;
                }
              }
            }
          } else if (action === 'delete') {
            const { confirm } = await prompts({
              type: 'confirm',
              name: 'confirm',
              message: `Удалить конфигурацию "${configManager.get(menuChoice.config).name}"?`,
              initial: false,
            });
            if (confirm) {
              configManager.delete(menuChoice.config);
              console.log(chalk.green('\n✅ Конфигурация удалена\n'));
            }
          }
          break;
        }

        case 'create': {
          const configId = await createConfiguration(
            configManager,
            moduleDiscovery,
          );
          if (configId) {
            // Спрашиваем, запустить ли сразу
            const { runNow } = await prompts({
              type: 'confirm',
              name: 'runNow',
              message: 'Запустить конфигурацию сейчас?',
              initial: true,
            });
            if (runNow) {
              await runConfiguration(
                configManager,
                moduleDiscovery,
                manifestGenerator,
                viteLauncher,
                configId,
              );
              return;
            }
          }
          break;
        }

        case 'create-module': {
          const generator = new ModuleGenerator();
          const moduleName = await generator.create();

          if (moduleName) {
            console.log(
              chalk.green(
                `\n✅ Модуль "${moduleName}" создан и готов к использованию!\n`,
              ),
            );
            console.log(
              chalk.yellow(
                '💡 Не забудьте добавить модуль в host/src/modules/modules.ts\n',
              ),
            );
          }
          break;
        }

        case 'settings':
          await showSettings(configManager);
          break;

        case 'exit':
          console.log(chalk.yellow('\nВыход из приложения.'));
          process.exit(0);

        default:
          console.log(
            chalk.red(`\nНеизвестное действие: ${menuChoice.action}`),
          );
      }
    }
  } catch (error) {
    console.error(chalk.red('\nОшибка:'), error);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(chalk.red('\nКритическая ошибка:'), error);
  process.exit(1);
});
