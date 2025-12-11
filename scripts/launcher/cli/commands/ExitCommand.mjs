import chalk from 'chalk';
import { BaseCommand } from '../BaseCommand.mjs';
import { CommandAction } from '../../core/constants.mjs';

/**
 * @class ExitCommand
 * @description Команда выхода из приложения
 */
export class ExitCommand extends BaseCommand {
  get id() {
    return 'exit';
  }

  get title() {
    return '→ Выход';
  }

  get order() {
    return 100;
  }

  async execute() {
    console.log(chalk.yellow('\nВыход из приложения.'));
    return { action: CommandAction.EXIT };
  }
}
