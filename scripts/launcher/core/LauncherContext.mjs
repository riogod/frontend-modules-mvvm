import { fileURLToPath } from 'url';
import path from 'path';
import { ConfigRepository } from '../config/ConfigRepository.mjs';
import { ModuleDiscovery } from '../modules/ModuleDiscovery.mjs';
import { ManifestBuilder } from '../modules/ManifestBuilder.mjs';
import { ViteRunner } from '../runners/ViteRunner.mjs';
import { ModuleGenerator } from '../modules/ModuleGenerator.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * @class LauncherContext
 * @description Контекст приложения с общими сервисами для всех команд
 */
export class LauncherContext {
  /**
   * Создаёт контекст лаунчера
   * @param {Object} [options] - Опции инициализации
   * @param {string} [options.rootDir] - Корневая директория проекта
   * @param {string} [options.configPath] - Путь к файлу конфигураций
   */
  constructor(options = {}) {
    // __dirname указывает на scripts/launcher/core/, поэтому нужно подняться на 3 уровня
    const rootDir = options.rootDir || path.resolve(__dirname, '../../..');
    // Передаем полный путь к configs.json, если rootDir передан
    const configPath =
      options.configPath ||
      (options.rootDir
        ? path.resolve(options.rootDir, '.launcher/configs.json')
        : null);

    this.configRepository = new ConfigRepository(configPath);
    this.moduleDiscovery = new ModuleDiscovery(rootDir);
    this.manifestBuilder = new ManifestBuilder(rootDir);
    this.viteRunner = new ViteRunner(rootDir);
    this.moduleGenerator = new ModuleGenerator(rootDir);
  }
}
