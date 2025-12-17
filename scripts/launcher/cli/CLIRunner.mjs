import chalk from 'chalk';
import prompts from 'prompts';
import { CommandRegistry } from './CommandRegistry.mjs';
import { MenuItemType, CommandAction } from '../core/constants.mjs';

/**
 * @class CLIRunner
 * @description Главный координатор CLI интерфейса
 */
export class CLIRunner {
  /**
   * @param {Object} context - Контекст лаунчера
   */
  constructor(context) {
    this.context = context;
    this.registry = new CommandRegistry();
    // Добавляем registry в context для доступа команд к другим командам
    this.context.registry = this.registry;
  }

  /**
   * Регистрирует команду
   * @param {BaseCommand} command
   */
  register(command) {
    this.registry.register(command);
  }

  /**
   * Показывает главное меню
   * @returns {Promise<Object>}
   */
  async showMainMenu() {
    const { configRepository } = this.context;
    const configs = configRepository.getList();
    const commands = this.registry.getMenuCommands();

    const choices = [
      // 1. Список конфигураций (динамические пункты)
      ...configs.map((config, index) => {
        const fullConfig = configRepository.get(config.id);
        const moduleCount = Object.keys(fullConfig?.modules || {}).length;
        const moduleInfo =
          moduleCount > 0 ? ` (${moduleCount} модулей)` : ' (нет модулей)';
        const usageInfo =
          config.usageCount > 0
            ? ` [используется: ${config.usageCount} раз]`
            : '';
        const lastUsedMark = config.isLastUsed ? chalk.cyan(' ★') : '';
        const description = fullConfig?.description
          ? ` - ${chalk.gray(fullConfig.description)}`
          : '';

        return {
          title: `${index + 1}. ${config.name}${moduleInfo}${usageInfo}${lastUsedMark}${description}`,
          value: { type: MenuItemType.CONFIG, configId: config.id },
        };
      }),

      // 2. Команды (из реестра)
      ...commands.map((cmd) => ({
        title: cmd.title,
        value: { type: MenuItemType.COMMAND, commandId: cmd.id },
      })),
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
   * Обрабатывает выбор из меню
   * @param {Object} choice
   * @returns {Promise<Object>}
   */
  async handleMenuChoice(choice) {
    if (!choice) {
      return { action: CommandAction.EXIT };
    }

    if (choice.type === MenuItemType.CONFIG) {
      return await this.showConfigActionsMenu(choice.configId);
    } else if (choice.type === MenuItemType.COMMAND) {
      return await this.registry.execute(choice.commandId);
    }

    return { action: CommandAction.CONTINUE };
  }

  /**
   * Показывает меню действий с конфигурацией
   * @param {string} configId
   * @returns {Promise<Object>}
   */
  async showConfigActionsMenu(configId) {
    const { configRepository } = this.context;
    const config = configRepository.get(configId);

    if (!config) {
      console.log(chalk.red(`Конфигурация "${configId}" не найдена.`));
      return { action: CommandAction.CONTINUE };
    }

    // Показываем информацию о конфигурации
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
        const mocksStatus =
          source === 'SKIP'
            ? ''
            : moduleConfig.useLocalMocks !== false
              ? ' ✅ моки'
              : ' 🔵 удаленный сервис';
        console.log(`  ${icon} ${name}: ${source}${mocksStatus}`);
      }
    }

    // Показываем настройки конфигурации
    const settings = configRepository.getConfigSettings(configId);
    console.log(chalk.yellow('\nНастройки конфигурации:'));
    console.log(`  Уровень логирования: ${settings.logLevel || 'INFO'}`);
    console.log(
      `  Использовать локальные моки: ${settings.useLocalMocks !== false ? 'Да' : 'Нет'}`,
    );
    console.log(
      `  API URL: ${settings.apiUrl || chalk.yellow('⚠️ не настроен')}`,
    );

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

    if (action === 'back') {
      return { action: CommandAction.CONTINUE };
    }

    // Обрабатываем действие через соответствующие команды
    if (action === 'run') {
      return await this.registry.execute('run-config', { configId });
    } else if (action === 'edit') {
      const result = await this.registry.execute('edit-config', { configId });
      // Если пользователь выбрал "Отмена" в редакторе модулей, остаемся в меню конфигурации
      if (result?.action === CommandAction.BACK) {
        return await this.showConfigActionsMenu(configId);
      }
      return result;
    } else if (action === 'settings') {
      return await this.registry.execute('edit-settings', { configId });
    } else if (action === 'delete') {
      return await this.registry.execute('delete-config', { configId });
    }

    return { action: CommandAction.CONTINUE };
  }

  /**
   * Запускает CLI лаунчера
   * @param {Object} args - Аргументы командной строки
   */
  async run(args = {}) {
    const { configRepository } = this.context;

    // Обеспечиваем наличие дефолтной конфигурации
    await this.ensureDefaultConfig();

    // Запуск с последней использованной конфигурацией
    const lastUsed = configRepository.config?.lastUsed;
    if (args.last && lastUsed) {
      const result = await this.registry.execute('run-config', {
        configId: lastUsed,
      });
      return result;
    }

    // Запуск с указанной конфигурацией
    if (args.configName) {
      const configs = configRepository.getList();
      const configId = configs.find(
        (c) =>
          c.name.toLowerCase() === args.configName.toLowerCase() ||
          c.id === args.configName,
      )?.id;

      if (configId) {
        const result = await this.registry.execute('run-config', {
          configId,
        });
        return result;
      } else {
        console.log(chalk.red(`Конфигурация "${args.configName}" не найдена.`));
        process.exit(1);
      }
    }

    // Интерактивный режим
    try {
      while (true) {
        const menuChoice = await this.showMainMenu();

        if (!menuChoice) {
          console.log(chalk.yellow('\n\nВыход из приложения.'));
          process.exit(0);
        }

        const result = await this.handleMenuChoice(menuChoice);

        if (result.action === CommandAction.EXIT) {
          break;
        }
      }
    } catch (error) {
      console.error(chalk.red('\nОшибка:'), error);
      process.exit(1);
    }
  }

  /**
   * Обеспечить наличие дефолтной конфигурации
   */
  async ensureDefaultConfig() {
    const { configRepository, moduleDiscovery } = this.context;

    const configs = configRepository.getList();
    if (configs.length === 0) {
      const normalModules = await moduleDiscovery.getNormalModules();
      const modules = {};

      for (const module of normalModules) {
        modules[module.name] = {
          source: 'local',
          path: `packages/${module.name}`,
          priority: 1,
          useLocalMocks: true,
        };
      }

      configRepository.create(
        'Development',
        modules,
        'Все модули локально с HMR',
        {
          logLevel: 'INFO',
          useLocalMocks: true,
          apiUrl: '',
        },
      );
      console.log(
        chalk.green('✅ Создана конфигурация "Development" по умолчанию\n'),
      );
    }
  }
}
