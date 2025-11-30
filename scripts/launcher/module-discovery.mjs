import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class ModuleDiscovery {
  constructor() {
    const rootDir = path.resolve(__dirname, '../..');
    this.packagesDir = path.resolve(rootDir, 'packages');
    this.hostModulesDir = path.resolve(rootDir, 'host/src/modules');
  }

  /**
   * Возвращает список INIT модулей (из host/src/modules)
   * Эти модули всегда локальные и загружаются при инициализации
   */
  getInitModules() {
    return ['core', 'core.layout'];
  }

  /**
   * Сканирует packages/ и возвращает список NORMAL модулей
   * @returns {Promise<Array<{name: string, path: string}>>}
   */
  async getNormalModules() {
    if (!fs.existsSync(this.packagesDir)) {
      return [];
    }

    const entries = fs.readdirSync(this.packagesDir, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isDirectory())
      .map((entry) => ({
        name: entry.name,
        path: path.join(this.packagesDir, entry.name),
      }));
  }

  /**
   * Проверяет существование модуля
   * @param {string} moduleName
   * @returns {boolean}
   */
  moduleExists(moduleName) {
    if (this.getInitModules().includes(moduleName)) {
      return fs.existsSync(path.join(this.hostModulesDir, moduleName));
    }
    return fs.existsSync(path.join(this.packagesDir, moduleName));
  }
}

