import chalk from 'chalk';
import prompts from 'prompts';
import { BaseCommand } from '../BaseCommand.mjs';
import { CommandAction } from '../../core/constants.mjs';
import { editModulesMenu } from '../../utils/ModuleEditor.mjs';

/**
 * @class EditConfigCommand
 * @description Команда редактирования конфигурации
 */
export class EditConfigCommand extends BaseCommand {
  get id() {
    return 'edit-config';
  }

  get title() {
    return '→ Редактировать модули';
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
      throw new Error('configId обязателен для EditConfigCommand');
    }

    const { configRepository, moduleDiscovery } = this.context;
    const config = configRepository.get(configId);

    if (!config) {
      console.log(chalk.red(`Конфигурация "${configId}" не найдена.`));
      return { action: CommandAction.CONTINUE };
    }

    const normalModules = await moduleDiscovery.getNormalModules();
    const currentModules = { ...config.modules };

    // Удаляем несуществующие модули
    const filteredModules = {};
    let removedCount = 0;
    for (const [name, moduleConfig] of Object.entries(currentModules)) {
      if (moduleConfig.source === 'local') {
        if (moduleDiscovery.moduleExists(name)) {
          filteredModules[name] = {
            ...moduleConfig,
            useLocalMocks:
              moduleConfig.useLocalMocks !== undefined
                ? moduleConfig.useLocalMocks
                : true,
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

    const editedModules = await editModulesMenu(
      normalModules,
      filteredModules,
      configRepository,
    );

    // Если пользователь выбрал "Отмена", возвращаемся в меню настроек конфигурации
    if (editedModules && editedModules.canceled) {
      return { action: CommandAction.BACK };
    }

    if (editedModules === null) {
      return { action: CommandAction.CONTINUE };
    }

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
      const finalDescription = description?.trim() || config.description || '';
      configRepository.update(configId, {
        name: name.trim(),
        description: finalDescription,
        modules: editedModules,
      });
      console.log(chalk.green(`\n✅ Конфигурация "${name}" обновлена!\n`));

      const { runNow } = await prompts({
        type: 'confirm',
        name: 'runNow',
        message: 'Запустить обновленную конфигурацию сейчас?',
        initial: true,
      });

      if (runNow) {
        if (this.context.registry) {
          return await this.context.registry.execute('run-config', {
            configId,
          });
        }
      }
    }

    return { action: CommandAction.CONTINUE };
  }
}
