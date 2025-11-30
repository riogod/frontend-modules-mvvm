#!/usr/bin/env node

import chalk from 'chalk';
import prompts from 'prompts';
import { ConfigManager } from './launcher/config-manager.mjs';
import { ModuleDiscovery } from './launcher/module-discovery.mjs';
import { ManifestGenerator } from './launcher/manifest-generator.mjs';
import { ViteLauncher } from './launcher/vite-launcher.mjs';

/**
 * Главное меню CLI Runner
 */
async function showMainMenu(configManager) {
  const configs = configManager.getList();

  const choices = [
    ...configs.map((config, index) => ({
      title: `${index + 1}. ${config.name}`,
      value: { action: 'select', config: config.id },
    })),
    {
      title: '→ Создать новую конфигурацию',
      value: { action: 'create' },
    },
    {
      title: '→ Создать новый MFE модуль',
      value: { action: 'create-module' },
    },
    {
      title: '→ Общие настройки проекта',
      value: { action: 'settings' },
    },
    {
      title: '→ Выход',
      value: { action: 'exit' },
    },
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
 * Обработка выбора конфигурации
 */
async function handleConfigSelection(configId, configManager, moduleDiscovery, manifestGenerator, viteLauncher) {
  console.log(chalk.cyan(`\nЗагрузка конфигурации: ${configId}...\n`));

  const config = configManager.load(configId);
  if (!config) {
    console.log(chalk.red(`Конфигурация "${configId}" не найдена.`));
    return;
  }

  // Получаем список доступных модулей
  const normalModules = await moduleDiscovery.getNormalModules();
  console.log(chalk.green(`Найдено модулей: ${normalModules.length}`));
  normalModules.forEach((module) => {
    console.log(chalk.gray(`  - ${module.name}`));
  });

  // Генерируем манифест
  const manifest = manifestGenerator.generate(config);
  console.log(chalk.green(`\nМанифест сгенерирован: ${manifest.modules.length} модулей`));

  // Запускаем Vite
  console.log(chalk.cyan('\n🚀 Запуск Vite dev server...\n'));
  await viteLauncher.start(config, manifest);
}

/**
 * Главная функция
 */
async function main() {
  console.log(chalk.cyan.bold('\n🚀 Frontend MFE Launcher\n'));

  const configManager = new ConfigManager();
  const moduleDiscovery = new ModuleDiscovery();
  const manifestGenerator = new ManifestGenerator();
  const viteLauncher = new ViteLauncher();

  // Проверка аргументов командной строки
  const args = process.argv.slice(2);
  if (args.includes('--config') || args.includes('-c')) {
    const configIndex = args.findIndex((arg) => arg === '--config' || arg === '-c');
    const configId = args[configIndex + 1] || 'development';
    await handleConfigSelection(configId, configManager, moduleDiscovery, manifestGenerator, viteLauncher);
    return;
  }

  try {
    while (true) {
      const menuChoice = await showMainMenu(configManager);

      if (!menuChoice) {
        // Пользователь нажал Ctrl+C
        console.log(chalk.yellow('\n\nВыход из приложения.'));
        process.exit(0);
      }

      switch (menuChoice.action) {
        case 'select':
          await handleConfigSelection(
            menuChoice.config,
            configManager,
            moduleDiscovery,
            manifestGenerator,
            viteLauncher,
          );
          return; // Выходим после запуска Vite

        case 'create':
          console.log(chalk.yellow('\nСоздание новой конфигурации будет реализовано в задаче 004.'));
          break;

        case 'create-module':
          console.log(chalk.yellow('\nСоздание нового модуля будет реализовано в задаче 005.'));
          break;

        case 'settings':
          console.log(chalk.yellow('\nНастройки проекта будут реализованы в следующих задачах.'));
          break;

        case 'exit':
          console.log(chalk.yellow('\nВыход из приложения.'));
          process.exit(0);

        default:
          console.log(chalk.red(`\nНеизвестное действие: ${menuChoice.action}`));
      }
    }
  } catch (error) {
    console.error(chalk.red('\nОшибка:'), error);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(chalk.red('\nКритическая ошибка:'), error);
  process.exit(1);
});

