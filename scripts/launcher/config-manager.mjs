import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Менеджер конфигураций для CLI Runner
 * Управляет сохранением, загрузкой и CRUD операциями для конфигураций запуска
 */
export class ConfigManager {
  constructor() {
    const rootDir = path.resolve(__dirname, '../..');
    this.configPath = path.resolve(rootDir, '.launcher/configs.json');
    this.config = this.loadConfig();
  }

  /**
   * Загрузка конфигураций из файла
   * @returns {Object}
   */
  loadConfig() {
    if (!fs.existsSync(this.configPath)) {
      return this.getDefaultConfig();
    }

    try {
      const content = fs.readFileSync(this.configPath, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      console.warn(
        'Ошибка при загрузке конфигураций, используется дефолтная:',
        error.message,
      );
      return this.getDefaultConfig();
    }
  }

  /**
   * Сохранение конфигураций в файл
   */
  save() {
    fs.mkdirSync(path.dirname(this.configPath), { recursive: true });
    fs.writeFileSync(
      this.configPath,
      JSON.stringify(this.config, null, 2),
      'utf-8',
    );
  }

  /**
   * Дефолтная конфигурация
   * @returns {Object}
   */
  getDefaultConfig() {
    return {
      version: '1.0.0',
      lastUsed: null,
      remoteServerUrl: '',
      logLevel: 'INFO', // Уровень логирования по умолчанию
      configurations: {},
    };
  }

  /**
   * Получить список конфигураций
   * @returns {Array<{id: string, name: string, description?: string, usageCount?: number}>}
   */
  getList() {
    return Object.entries(this.config.configurations).map(([id, config]) => ({
      id,
      name: config.name,
      description: config.description || '',
      usageCount: config.usageCount || 0,
      createdAt: config.createdAt,
    }));
  }

  /**
   * Получить конфигурацию по ID
   * @param {string} id
   * @returns {Object|null}
   */
  get(id) {
    return this.config.configurations[id] || null;
  }

  /**
   * Создать новую конфигурацию
   * @param {string} name
   * @param {Object} modules
   * @param {string} description
   * @returns {string} ID созданной конфигурации
   */
  create(name, modules, description = '') {
    const id = this.generateId(name);
    this.config.configurations[id] = {
      name,
      description,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      usageCount: 0,
      modules,
    };
    this.save();
    return id;
  }

  /**
   * Обновить конфигурацию
   * @param {string} id
   * @param {Object} data
   */
  update(id, data) {
    if (!this.config.configurations[id]) {
      throw new Error(`Configuration ${id} not found`);
    }
    this.config.configurations[id] = {
      ...this.config.configurations[id],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    this.save();
  }

  /**
   * Удалить конфигурацию
   * @param {string} id
   */
  delete(id) {
    if (!this.config.configurations[id]) {
      throw new Error(`Configuration ${id} not found`);
    }
    delete this.config.configurations[id];
    if (this.config.lastUsed === id) {
      this.config.lastUsed = null;
    }
    this.save();
  }

  /**
   * Увеличить счетчик использования
   * @param {string} id
   */
  incrementUsage(id) {
    if (this.config.configurations[id]) {
      this.config.configurations[id].usageCount =
        (this.config.configurations[id].usageCount || 0) + 1;
      this.config.lastUsed = id;
      this.save();
    }
  }

  /**
   * Генерация уникального ID из имени
   * @param {string} name
   * @returns {string}
   */
  generateId(name) {
    let baseId = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    let id = baseId;
    let counter = 1;

    // Если ID уже существует, добавляем суффикс
    while (this.config.configurations[id]) {
      id = `${baseId}-${counter}`;
      counter++;
    }

    return id;
  }

  /**
   * Проверить доступность REMOTE
   * @returns {boolean}
   */
  isRemoteAvailable() {
    return (
      this.config.remoteServerUrl && this.config.remoteServerUrl.trim() !== ''
    );
  }

  /**
   * Получить Remote Server URL
   * @returns {string}
   */
  getRemoteServerUrl() {
    return this.config.remoteServerUrl || '';
  }

  /**
   * Установить Remote Server URL
   * @param {string} url
   */
  setRemoteServerUrl(url) {
    this.config.remoteServerUrl = url.trim();
    this.save();
  }

  /**
   * Получить URL для remote модуля
   * @param {string} moduleName
   * @returns {string}
   */
  getRemoteModuleUrl(moduleName) {
    if (!this.isRemoteAvailable()) {
      throw new Error('Remote Server URL не настроен');
    }
    const baseUrl = this.config.remoteServerUrl.replace(/\/$/, '');
    return `${baseUrl}/modules/${moduleName}/remoteEntry.js`;
  }

  /**
   * Получить уровень логирования
   * @returns {string}
   */
  getLogLevel() {
    return this.config.logLevel || 'INFO';
  }

  /**
   * Установить уровень логирования
   * @param {string} level - Уровень логирования (NONE, ERROR, WARN, INFO, DEBUG, TRACE)
   */
  setLogLevel(level) {
    const validLevels = ['NONE', 'ERROR', 'WARN', 'INFO', 'DEBUG', 'TRACE'];
    if (!validLevels.includes(level.toUpperCase())) {
      throw new Error(
        `Недопустимый уровень логирования: ${level}. Допустимые значения: ${validLevels.join(', ')}`,
      );
    }
    this.config.logLevel = level.toUpperCase();
    this.save();
  }
}
