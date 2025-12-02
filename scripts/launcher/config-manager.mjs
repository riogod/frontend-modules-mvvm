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
      useLocalMocks: true, // Использовать локальные моки по умолчанию
      apiUrl: '', // URL API сервера (используется, если моки отключены)
      configurations: {},
    };
  }

  /**
   * Получить список конфигураций
   * Последняя использованная конфигурация возвращается первой
   * @returns {Array<{id: string, name: string, description?: string, usageCount?: number, isLastUsed?: boolean}>}
   */
  getList() {
    const lastUsed = this.config.lastUsed;
    const list = Object.entries(this.config.configurations).map(
      ([id, config]) => ({
        id,
        name: config.name,
        description: config.description || '',
        usageCount: config.usageCount || 0,
        createdAt: config.createdAt,
        isLastUsed: id === lastUsed,
      }),
    );

    // Сортируем: последняя использованная первой, остальные по количеству использований
    return list.sort((a, b) => {
      if (a.isLastUsed) return -1;
      if (b.isLastUsed) return 1;
      return (b.usageCount || 0) - (a.usageCount || 0);
    });
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
  create(name, modules, description = '', settings = {}) {
    const id = this.generateId(name);
    this.config.configurations[id] = {
      name,
      description,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      usageCount: 0,
      modules,
      // Настройки конфигурации
      settings: {
        logLevel: settings.logLevel || 'INFO',
        useLocalMocks:
          settings.useLocalMocks !== undefined ? settings.useLocalMocks : true,
        apiUrl: settings.apiUrl || '',
        ...settings,
      },
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
    // Нормализуем URL: убираем пробелы и завершающие слеши
    this.config.remoteServerUrl = url.trim().replace(/\/+$/, '');
    this.save();
  }

  /**
   * Получить URL для remote модуля (стандартный путь)
   * @param {string} moduleName
   * @returns {string}
   */
  getRemoteModuleUrl(moduleName) {
    if (!this.isRemoteAvailable()) {
      throw new Error('Remote Server URL не настроен');
    }
    // Убираем завершающий слеш и нормализуем URL
    const baseUrl = this.config.remoteServerUrl.trim().replace(/\/+$/, '');
    // Убираем начальный слеш из пути модуля, чтобы избежать двойных слешей
    return `${baseUrl}/modules/${moduleName}/latest/remoteEntry.js`.replace(
      /\/+/g,
      '/',
    );
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

  /**
   * Получить настройки конфигурации
   * @param {string} configId - ID конфигурации
   * @returns {Object} Настройки конфигурации
   */
  getConfigSettings(configId) {
    const config = this.get(configId);
    const globalApiUrl = this.config.apiUrl || '';
    const globalLogLevel = this.config.logLevel || 'INFO';
    const globalUseLocalMocks = this.config.useLocalMocks !== false;

    if (!config) {
      return {
        logLevel: globalLogLevel,
        useLocalMocks: globalUseLocalMocks,
        apiUrl: globalApiUrl,
      };
    }

    const settings = config.settings || {};
    return {
      logLevel: settings.logLevel || globalLogLevel,
      useLocalMocks:
        settings.useLocalMocks !== undefined
          ? settings.useLocalMocks
          : globalUseLocalMocks,
      // Приоритет: settings.apiUrl > глобальный apiUrl
      apiUrl: settings.apiUrl || globalApiUrl,
    };
  }

  /**
   * Установить настройки конфигурации
   * @param {string} configId - ID конфигурации
   * @param {Object} settings - Настройки
   */
  setConfigSettings(configId, settings) {
    const config = this.get(configId);
    if (!config) {
      throw new Error(`Configuration ${configId} not found`);
    }
    config.settings = {
      ...(config.settings || {}),
      ...settings,
    };
    config.updatedAt = new Date().toISOString();
    this.save();
  }

  // Глобальные настройки (fallback для конфигураций)
  /**
   * Получить глобальную настройку использования локальных моков
   * @returns {boolean}
   */
  getGlobalUseLocalMocks() {
    return this.config.useLocalMocks !== false;
  }

  /**
   * Установить глобальную настройку использования локальных моков
   * @param {boolean} useLocalMocks
   */
  setGlobalUseLocalMocks(useLocalMocks) {
    this.config.useLocalMocks = useLocalMocks;
    this.save();
  }

  /**
   * Получить глобальный URL API сервера (fallback)
   * @returns {string}
   */
  getGlobalApiUrl() {
    return this.config.apiUrl || '';
  }

  /**
   * Установить глобальный URL API сервера (fallback)
   * @param {string} url
   */
  setGlobalApiUrl(url) {
    this.config.apiUrl = url.trim();
    this.save();
  }

  /**
   * Получить глобальный уровень логирования
   * @returns {string}
   */
  getGlobalLogLevel() {
    return this.config.logLevel || 'INFO';
  }

  /**
   * Установить глобальный уровень логирования
   * @param {string} level
   */
  setGlobalLogLevel(level) {
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
