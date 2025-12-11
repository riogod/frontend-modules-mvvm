import chalk from 'chalk';
import { BaseCommand } from '../BaseCommand.mjs';
import { CommandAction } from '../../core/constants.mjs';

/**
 * @class CreateModuleCommand
 * @description Команда создания нового MFE модуля
 */
export class CreateModuleCommand extends BaseCommand {
  get id() {
    return 'create-module';
  }

  get title() {
    return '→ Создать новый MFE модуль';
  }

  get order() {
    return 20;
  }

  async execute() {
    const { moduleGenerator } = this.context;
    const moduleName = await moduleGenerator.create();

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

    return { action: CommandAction.CONTINUE };
  }
}
