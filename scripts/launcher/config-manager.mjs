import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Заглушка для ConfigManager
 * Полная реализация будет в задаче 004
 */
export class ConfigManager {
  constructor() {
    const rootDir = path.resolve(__dirname, '../..');
    this.configsPath = path.resolve(rootDir, '.launcher/configs.json');
  }

  /**
   * Возвращает список доступных конфигураций
   * @returns {Array<{id: string, name: string}>}
   */
  getList() {
    // Временная заглушка - возвращает дефолтную конфигурацию
    return [
      {
        id: 'development',
        name: 'Development (все локально)',
      },
    ];
  }

  /**
   * Загружает конфигурацию по ID
   * @param {string} configId
   * @returns {Object|null}
   */
  load(configId) {
    // Временная заглушка - возвращает дефолтную конфигурацию
    if (configId === 'development') {
      return {
        modules: {},
      };
    }
    return null;
  }
}

