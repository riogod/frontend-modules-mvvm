import chalk from 'chalk';
import prompts from 'prompts';
import { BaseCommand } from '../BaseCommand.mjs';
import { CommandAction } from '../../core/constants.mjs';
import { editModulesMenu } from '../../utils/ModuleEditor.mjs';
import { LogLevel } from '../../core/constants.mjs';

/**
 * @class CreateConfigCommand
 * @description Команда создания новой конфигурации
 */
export class CreateConfigCommand extends BaseCommand {
  get id() {
    return 'create-config';
  }

  get title() {
    return '→ Создать новую конфигурацию';
  }

  get order() {
    return 15;
  }

  async execute() {
    const { configRepository, moduleDiscovery } = this.context;
    const normalModules = await moduleDiscovery.getNormalModules();

    if (normalModules.length === 0) {
      console.log(chalk.yellow('\nNORMAL модули не найдены.\n'));
      return { action: CommandAction.CONTINUE };
    }

    const modules = {};
    const resultModules = await editModulesMenu(
      normalModules,
      modules,
      configRepository,
    );

    if (!resultModules) {
      return { action: CommandAction.CONTINUE };
    }

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
      return { action: CommandAction.CONTINUE };
    }

    const { description } = await prompts({
      type: 'text',
      name: 'description',
      message: 'Описание (необязательно):',
    });

    console.log(chalk.cyan('\n⚙️ Настройки конфигурации\n'));

    const envLogLevel = process.env.LOG_LEVEL;
    let logLevel = LogLevel.INFO;
    if (!envLogLevel) {
      const levelChoices = [
        { title: 'NONE - Отключить все логи', value: LogLevel.NONE },
        { title: 'ERROR - Только ошибки', value: LogLevel.ERROR },
        { title: 'WARN - Предупреждения и ошибки', value: LogLevel.WARN },
        {
          title: 'INFO - Информация, предупреждения и ошибки',
          value: LogLevel.INFO,
        },
        { title: 'DEBUG - Отладочная информация', value: LogLevel.DEBUG },
        { title: 'TRACE - Полная трассировка', value: LogLevel.TRACE },
      ];

      const { level } = await prompts({
        type: 'select',
        name: 'level',
        message: 'Выберите уровень логирования:',
        choices: levelChoices,
        initial: 3,
      });
      logLevel = level || LogLevel.INFO;
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

    const configId = configRepository.create(
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

    const { runNow } = await prompts({
      type: 'confirm',
      name: 'runNow',
      message: 'Запустить конфигурацию сейчас?',
      initial: true,
    });

    if (runNow) {
      // Используем registry из context
      if (this.context.registry) {
        return await this.context.registry.execute('run-config', { configId });
      }
    }

    return { action: CommandAction.CONTINUE };
  }
}
