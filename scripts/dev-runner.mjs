#!/usr/bin/env node
/**
 * @fileoverview CLI для разработки MFE приложения
 * Запуск: npm start | npm run dev
 */

import { LauncherContext } from './launcher/core/LauncherContext.mjs';
import { CLIRunner } from './launcher/cli/CLIRunner.mjs';
import { ArgumentParser } from './launcher/cli/ArgumentParser.mjs';

// Импорт всех команд
import { RunConfigCommand } from './launcher/cli/commands/RunConfigCommand.mjs';
import { CreateConfigCommand } from './launcher/cli/commands/CreateConfigCommand.mjs';
import { CreateModuleCommand } from './launcher/cli/commands/CreateModuleCommand.mjs';
import { SettingsCommand } from './launcher/cli/commands/SettingsCommand.mjs';
import { ExitCommand } from './launcher/cli/commands/ExitCommand.mjs';
import { EditConfigCommand } from './launcher/cli/commands/EditConfigCommand.mjs';
import { EditSettingsCommand } from './launcher/cli/commands/EditSettingsCommand.mjs';
import { DeleteConfigCommand } from './launcher/cli/commands/DeleteConfigCommand.mjs';

/**
 * Запускает CLI лаунчера
 */
async function main() {
  const args = ArgumentParser.parse(process.argv.slice(2));
  // Явно передаем корневую директорию проекта
  const context = new LauncherContext({
    rootDir: process.cwd(),
  });

  const cli = new CLIRunner(context);

  // Регистрация команд
  cli.register(new RunConfigCommand(context));
  cli.register(new CreateConfigCommand(context));
  cli.register(new CreateModuleCommand(context));
  cli.register(new SettingsCommand(context));
  cli.register(new ExitCommand(context));
  // Команды, которые не видны в главном меню, но вызываются из подменю
  cli.register(new EditConfigCommand(context));
  cli.register(new EditSettingsCommand(context));
  cli.register(new DeleteConfigCommand(context));

  await cli.run(args);
}

main().catch((error) => {
  console.error('Критическая ошибка:', error);
  process.exit(1);
});
