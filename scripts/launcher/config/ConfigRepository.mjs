import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * @class ConfigRepository
 * @description Репозиторий для управления конфигурациями запуска
 * Предоставляет CRUD операции для конфигураций и глобальных настроек
 */
export class ConfigRepository {
  /**
   * Создаёт репозиторий конфигураций
   * @param {string} [configPath] - Путь к файлу конфигураций (опционально)
   */
  constructor(configPath = null) {
    // __dirname указывает на scripts/launcher/config/, поэтому нужно подняться на 3 уровня
    const rootDir = path.resolve(__dirname, '../../..');
    this.configPath =
      configPath || path.resolve(rootDir, '.launcher/configs.json');
    this._config = this.loadConfig();
  }

  /**
   * Загрузка конфигураций из файла
   * @returns {Object}
   */
  loadConfig() {
    if (!fs.existsSync(this.configPath)) {
      this._config = this.getDefaultConfig();
      return this._config;
    }

    try {
      const content = fs.readFileSync(this.configPath, 'utf-8');
      this._config = JSON.parse(content);
      return this._config;
    } catch (error) {
      console.warn(
        'Ошибка при загрузке конфигураций, используется дефолтная:',
        error.message,
      );
      this._config = this.getDefaultConfig();
      return this._config;
    }
  }

  /**
   * Получить объект конфигурации (для обратной совместимости)
   * @returns {Object}
   */
  get config() {
    if (!this._config) {
      this._config = this.loadConfig();
    }
    return this._config;
  }

  /**
   * Сохранение конфигураций в файл
   */
  save() {
    fs.mkdirSync(path.dirname(this.configPath), { recursive: true });
    fs.writeFileSync(
      this.configPath,
      JSON.stringify(this._config, null, 2),
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
      recentUsed: [],
      remoteServerUrl: '',
      logLevel: 'INFO',
      useLocalMocks: true,
      apiUrl: '',
      configurations: {},
    };
  }

  /**
   * Получить список конфигураций
   * Последняя использованная конфигурация возвращается первой
   * @returns {Array<{id: string, name: string, description?: string, usageCount?: number, isLastUsed?: boolean}>}
   */
  getList() {
    const lastUsed = this._config.lastUsed;
    const recent = Array.isArray(this._config.recentUsed)
      ? this._config.recentUsed
      : [];
    const list = Object.entries(this._config.configurations).map(
      ([id, config]) => ({
        id,
        name: config.name,
        description: config.description || '',
        usageCount: config.usageCount || 0,
        createdAt: config.createdAt,
        isLastUsed: id === lastUsed,
      }),
    );

    // Сортируем: сначала по истории recentUsed (LRU-порядок), затем lastUsed, затем usageCount
    return list.sort((a, b) => {
      const ai = recent.indexOf(a.id);
      const bi = recent.indexOf(b.id);

      const aInRecent = ai !== -1;
      const bInRecent = bi !== -1;

      if (aInRecent && bInRecent) return ai - bi;
      if (aInRecent) return -1;
      if (bInRecent) return 1;

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
    return this._config.configurations[id] || null;
  }

  /**
   * Создать новую конфигурацию
   * @param {string} name
   * @param {Object} modules
   * @param {string} description
   * @param {Object} settings
   * @returns {string} ID созданной конфигурации
   */
  create(name, modules, description = '', settings = {}) {
    const id = this.generateId(name);
    this._config.configurations[id] = {
      name,
      description,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      usageCount: 0,
      modules,
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
    if (!this._config.configurations[id]) {
      throw new Error(`Configuration ${id} not found`);
    }
    this._config.configurations[id] = {
      ...this._config.configurations[id],
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
    if (!this._config.configurations[id]) {
      throw new Error(`Configuration ${id} not found`);
    }
    delete this._config.configurations[id];
    if (this._config.lastUsed === id) {
      this._config.lastUsed = null;
    }
    if (Array.isArray(this._config.recentUsed)) {
      this._config.recentUsed = this._config.recentUsed.filter(
        (item) => item !== id,
      );
    }
    this.save();
  }

  /**
   * Увеличить счетчик использования
   * @param {string} id
   */
  incrementUsage(id) {
    if (this._config.configurations[id]) {
      this._config.configurations[id].usageCount =
        (this._config.configurations[id].usageCount || 0) + 1;
      const recent = Array.isArray(this._config.recentUsed)
        ? this._config.recentUsed
        : [];
      const nextRecent = [id, ...recent.filter((item) => item !== id)];
      this._config.recentUsed = nextRecent;
      this._config.lastUsed = id;
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

    while (this._config.configurations[id]) {
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
      this._config.remoteServerUrl && this._config.remoteServerUrl.trim() !== ''
    );
  }

  /**
   * Получить Remote Server URL
   * @returns {string}
   */
  getRemoteServerUrl() {
    return this._config.remoteServerUrl || '';
  }

  /**
   * Установить Remote Server URL
   * @param {string} url
   */
  setRemoteServerUrl(url) {
    this._config.remoteServerUrl = url.trim().replace(/\/+$/, '');
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
    const baseUrl = this._config.remoteServerUrl.trim().replace(/\/+$/, '');
    return `${baseUrl}/modules/${moduleName}/latest/remoteEntry.js`;
  }

  /**
   * Получить настройки конфигурации
   * @param {string} configId - ID конфигурации
   * @returns {Object} Настройки конфигурации
   */
  getConfigSettings(configId) {
    const config = this.get(configId);
    const globalApiUrl = this._config.apiUrl || '';
    const globalLogLevel = this._config.logLevel || 'INFO';
    const globalUseLocalMocks = this._config.useLocalMocks !== false;

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

  /**
   * Получить глобальный URL API сервера (fallback)
   * @returns {string}
   */
  getGlobalApiUrl() {
    return this._config.apiUrl || '';
  }

  /**
   * Установить глобальный URL API сервера (fallback)
   * @param {string} url
   */
  setGlobalApiUrl(url) {
    this._config.apiUrl = url.trim();
    this.save();
  }
}
