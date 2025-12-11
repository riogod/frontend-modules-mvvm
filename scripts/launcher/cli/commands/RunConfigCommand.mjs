import chalk from 'chalk';
import { BaseCommand } from '../BaseCommand.mjs';
import { CommandAction } from '../../core/constants.mjs';

/**
 * @class RunConfigCommand
 * @description Команда запуска конфигурации
 */
export class RunConfigCommand extends BaseCommand {
  get id() {
    return 'run-config';
  }

  get title() {
    return '→ Запустить конфигурацию';
  }

  get order() {
    return 10;
  }

  /**
   * Не показывается в главном меню (вызывается из подменю)
   */
  isVisible() {
    return false;
  }

  /**
   * Запускает конфигурацию
   * @param {Object} params - Параметры команды
   * @param {string} params.configId - ID конфигурации
   */
  async execute(params = {}) {
    const { configId } = params;
    if (!configId) {
      throw new Error('configId обязателен для RunConfigCommand');
    }

    const { configRepository, moduleDiscovery, manifestBuilder, viteRunner } =
      this.context;

    let config = configRepository.get(configId);

    if (!config) {
      console.log(chalk.red(`Конфигурация "${configId}" не найдена.`));
      return { action: CommandAction.CONTINUE };
    }

    // Фильтруем несуществующие модули
    if (config.modules) {
      const filteredModules = {};
      let removedCount = 0;

      for (const [name, moduleConfig] of Object.entries(config.modules)) {
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
          filteredModules[name] = moduleConfig;
        }
      }

      if (removedCount > 0) {
        console.log(
          chalk.yellow(
            `\n⚠️  Удалено ${removedCount} несуществующих модулей из конфигурации.\n`,
          ),
        );
        config.modules = filteredModules;
        configRepository.update(configId, {
          name: config.name,
          modules: filteredModules,
          description: config.description,
        });
        config = { ...config, modules: filteredModules };
      }
    }

    console.log(
      chalk.cyan(
        '📋 Генерация манифеста с актуальными данными из модулей...\n',
      ),
    );
    const manifest = manifestBuilder.generate(config, moduleDiscovery);
    console.log(chalk.green('✅ Манифест сгенерирован\n'));

    configRepository.incrementUsage(configId);

    console.log(chalk.green('\n🚀 Запускаем Vite...\n'));

    await viteRunner.start(config, manifest, configRepository);

    return { action: CommandAction.EXIT };
  }
}
