import chalk from 'chalk';
import prompts from 'prompts';
import { BaseCommand } from '../BaseCommand.mjs';
import { CommandAction, LogLevel } from '../../core/constants.mjs';

/**
 * @class EditSettingsCommand
 * @description Команда редактирования настроек конфигурации
 */
export class EditSettingsCommand extends BaseCommand {
  get id() {
    return 'edit-settings';
  }

  get title() {
    return '→ Настроить параметры';
  }

  get order() {
    return 10;
  }

  isVisible() {
    return false;
  }

  async execute(params = {}) {
    const { configId } = params;
    if (!configId) {
      throw new Error('configId обязателен для EditSettingsCommand');
    }

    const { configRepository } = this.context;
    const config = configRepository.get(configId);

    if (!config) {
      console.log(chalk.red(`Конфигурация "${configId}" не найдена.`));
      return { action: CommandAction.CONTINUE };
    }

    const settings = configRepository.getConfigSettings(configId);

    while (true) {
      process.stdout.write('\x1B[2J\x1B[0f');
      console.log(
        chalk.cyan.bold(`\n⚙️ Настройки конфигурации: "${config.name}"\n`),
      );

      const envLogLevel = process.env.LOG_LEVEL;
      const currentLogLevel = settings.logLevel || LogLevel.INFO;
      const useLocalMocks =
        settings.useLocalMocks !== undefined ? settings.useLocalMocks : true;
      const apiUrl = settings.apiUrl || '';

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
        console.log(chalk.green(`Уровень логирования: ${currentLogLevel}\n`));
      }

      const mocksStatus = useLocalMocks
        ? chalk.green('Да (используются локальные моки MSW)')
        : chalk.yellow('Нет');
      console.log(`Использовать локальные моки: ${mocksStatus}`);

      const globalApiUrl = configRepository.getGlobalApiUrl();
      const effectiveApiUrl = apiUrl || globalApiUrl;
      const apiUrlSource = apiUrl ? '' : globalApiUrl ? ' (глобальный)' : '';
      console.log(
        `API URL: ${
          effectiveApiUrl
            ? chalk.green(effectiveApiUrl + apiUrlSource)
            : chalk.yellow('не настроен')
        }\n`,
      );

      const choices = [
        {
          title: `→ Настроить уровень логирования ${
            envLogLevel
              ? '(заблокировано - используется переменная окружения)'
              : `(текущий: ${currentLogLevel})`
          }`,
          value: 'set-log-level',
          disabled: !!envLogLevel,
        },
        {
          title: `→ Использовать локальные моки для host (текущее: ${
            useLocalMocks ? 'Да' : 'Нет'
          })`,
          value: 'set-use-mocks',
        },
        {
          title: `→ Настроить API URL ${
            apiUrl
              ? `(текущий: ${apiUrl})`
              : effectiveApiUrl
                ? `(глобальный: ${effectiveApiUrl})`
                : '(не настроен)'
          }`,
          value: 'set-api-url',
        },
      ];

      choices.push({ title: '→ Назад', value: 'back' });

      const { action } = await prompts({
        type: 'select',
        name: 'action',
        message: 'Выберите действие:',
        choices,
      });

      if (!action || action === 'back') {
        return { action: CommandAction.CONTINUE };
      }

      if (action === 'set-log-level') {
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
          initial: [
            LogLevel.NONE,
            LogLevel.ERROR,
            LogLevel.WARN,
            LogLevel.INFO,
            LogLevel.DEBUG,
            LogLevel.TRACE,
          ].indexOf(currentLogLevel),
        });

        if (level) {
          configRepository.setConfigSettings(configId, { logLevel: level });
          console.log(
            chalk.green(`\n✅ Уровень логирования установлен: ${level}\n`),
          );
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
          configRepository.setConfigSettings(configId, {
            useLocalMocks: useMocks,
          });
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
        const globalApiUrl = configRepository.getGlobalApiUrl();

        const { url } = await prompts({
          type: 'text',
          name: 'url',
          message: `Введите API URL (глобальный: ${globalApiUrl || 'не задан'}):`,
          initial: apiUrl || globalApiUrl || 'http://localhost:3000',
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
          configRepository.setConfigSettings(configId, { apiUrl: url.trim() });
          console.log(chalk.green(`\n✅ API URL сохранен: ${url}\n`));
        }
      }

      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }
}
