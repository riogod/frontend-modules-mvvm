import chalk from 'chalk';
import prompts from 'prompts';
import { BaseCommand } from '../BaseCommand.mjs';
import { CommandAction } from '../../core/constants.mjs';

/**
 * @class SettingsCommand
 * @description Команда глобальных настроек проекта
 */
export class SettingsCommand extends BaseCommand {
  get id() {
    return 'settings';
  }

  get title() {
    return '→ Глобальные настройки';
  }

  get order() {
    return 30;
  }

  async execute() {
    const { configRepository } = this.context;

    while (true) {
      process.stdout.write('\x1B[2J\x1B[0f');

      const isRemoteAvailable = configRepository.isRemoteAvailable();
      const globalApiUrl = configRepository.getGlobalApiUrl();
      const appStartEndpoint = configRepository.getAppStartEndpoint();

      console.log(chalk.cyan.bold('\n⚙️ Глобальные настройки\n'));

      console.log(chalk.yellow('Remote Server URL:'));
      console.log(
        chalk.gray(
          '  💡 Используется для загрузки REMOTE модулей из удаленного сервера',
        ),
      );
      if (isRemoteAvailable) {
        console.log(
          chalk.green(`  ${configRepository.getRemoteServerUrl()}\n`),
        );
      } else {
        console.log(chalk.yellow('  ⚠️ Не настроен\n'));
      }

      console.log(chalk.yellow('API URL (глобальный fallback):'));
      console.log(
        chalk.gray('  💡 Используется если в конфигурации не задан apiUrl'),
      );
      if (globalApiUrl) {
        console.log(chalk.green(`  ${globalApiUrl}\n`));
      } else {
        console.log(chalk.yellow('  ⚠️ Не настроен\n'));
      }

      console.log(chalk.yellow('App Start Endpoint:'));
      console.log(
        chalk.gray(
          '  💡 Эндпоинт для загрузки стартового манифеста модулей',
        ),
      );
      console.log(chalk.green(`  ${appStartEndpoint}\n`));

      const choices = [
        {
          title: isRemoteAvailable
            ? '→ Изменить Remote Server URL'
            : '→ Настроить Remote Server URL',
          value: 'set-remote-url',
        },
        {
          title: globalApiUrl
            ? '→ Изменить глобальный API URL'
            : '→ Настроить глобальный API URL',
          value: 'set-api-url',
        },
        {
          title: `→ Изменить App Start Endpoint (текущий: ${appStartEndpoint})`,
          value: 'set-app-start-endpoint',
        },
      ];

      if (isRemoteAvailable) {
        choices.push({
          title: '→ Очистить Remote Server URL',
          value: 'clear-remote-url',
        });
      }

      if (globalApiUrl) {
        choices.push({
          title: '→ Очистить глобальный API URL',
          value: 'clear-api-url',
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
        return { action: CommandAction.CONTINUE };
      }

      if (action === 'set-remote-url') {
        const { url } = await prompts({
          type: 'text',
          name: 'url',
          message: 'Введите Remote Server URL:',
          initial: configRepository.getRemoteServerUrl() || 'https://',
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
          configRepository.setRemoteServerUrl(url);
          console.log(chalk.green('\n✅ Remote Server URL сохранен\n'));
        }
      } else if (action === 'clear-remote-url') {
        configRepository.setRemoteServerUrl('');
        console.log(
          chalk.yellow(
            '\nRemote Server URL очищен. REMOTE модули недоступны.\n',
          ),
        );
      } else if (action === 'set-api-url') {
        const { url } = await prompts({
          type: 'text',
          name: 'url',
          message: 'Введите глобальный API URL:',
          initial: globalApiUrl || 'http://localhost:3000',
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
          configRepository.setGlobalApiUrl(url);
          console.log(chalk.green('\n✅ Глобальный API URL сохранен\n'));
        }
      } else if (action === 'clear-api-url') {
        configRepository.setGlobalApiUrl('');
        console.log(chalk.yellow('\nГлобальный API URL очищен.\n'));
      } else if (action === 'set-app-start-endpoint') {
        const { endpoint } = await prompts({
          type: 'text',
          name: 'endpoint',
          message: 'Введите App Start Endpoint:',
          initial: appStartEndpoint,
          validate: (value) => {
            if (!value || value.trim() === '') {
              return 'Эндпоинт не может быть пустым';
            }
            if (!value.trim().startsWith('/')) {
              return 'Эндпоинт должен начинаться с /';
            }
            return true;
          },
        });

        if (endpoint) {
          try {
            configRepository.setAppStartEndpoint(endpoint.trim());
            console.log(
              chalk.green(`\n✅ App Start Endpoint сохранен: ${endpoint}\n`),
            );
          } catch (error) {
            console.log(chalk.red(`\n❌ Ошибка: ${error.message}\n`));
          }
        }
      }

      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }
}
