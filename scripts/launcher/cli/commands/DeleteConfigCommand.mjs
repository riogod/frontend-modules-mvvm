import chalk from 'chalk';
import prompts from 'prompts';
import { BaseCommand } from '../BaseCommand.mjs';
import { CommandAction } from '../../core/constants.mjs';

/**
 * @class DeleteConfigCommand
 * @description Команда удаления конфигурации
 */
export class DeleteConfigCommand extends BaseCommand {
  get id() {
    return 'delete-config';
  }

  get title() {
    return '→ Удалить';
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
      throw new Error('configId обязателен для DeleteConfigCommand');
    }

    const { configRepository } = this.context;
    const config = configRepository.get(configId);

    if (!config) {
      console.log(chalk.red(`Конфигурация "${configId}" не найдена.`));
      return { action: CommandAction.CONTINUE };
    }

    const { confirm } = await prompts({
      type: 'confirm',
      name: 'confirm',
      message: `Удалить конфигурацию "${config.name}"?`,
      initial: false,
    });

    if (confirm) {
      configRepository.delete(configId);
      console.log(chalk.green('\n✅ Конфигурация удалена\n'));
    }

    return { action: CommandAction.CONTINUE };
  }
}
