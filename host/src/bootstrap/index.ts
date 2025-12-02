import { APIClientHandler } from './handlers/APIClient';
import { RouterHandler } from './handlers/RouterHandler';
import { RouterPostHandler } from './handlers/RouterPostHandler';
import {
  APIClient,
  IOC_CORE_TOKENS,
  log,
  type IBootstrap,
} from '@platform/core';
import { ModulesHandler } from './handlers/ModulesHandler';
import { Container } from 'inversify';
import { DIHandler } from './handlers/DIHandler';
import { HTTPErrorHandler } from './handlers/HTTPErrorHandler';
import { InitI18nHandler } from './handlers/InitI18nHandler';
import i18next, { type i18n } from 'i18next';
import { BootstrapRouterService } from './services/routerService';
import { BootstrapModuleLoader } from './services/moduleLoader/';
import { type IAppConfig } from '../config/app';
import { buildProviderModule } from '@inversifyjs/binding-decorators';
import { type Module } from '../modules/interface';
import type { AppStartDTO } from './services/appStart/data/app.dto';
import { OnAppStartHandler } from './handlers/OnAppStartHandler';
import { ModulesDiscoveryHandler } from './handlers/ModulesDiscoveryHandler';

/**
 * Запускает процесс старта приложения и определяет последовательность выполнения обработчиков.
 *
 * @param {Bootstrap} bootstrap - Инстанс класса Bootstrap.
 * @param {IAppConfig} config - Файл конфигурации.
 * @return {Promise<Bootstrap>} Возвращает промис проинициализированного Bootstrap.
 */
export const initBootstrap = async (
  bootstrap: Bootstrap,
  config: IAppConfig,
): Promise<Bootstrap> => {
  log.debug('Bootstrap initialization started', {
    prefix: 'bootstrap.initBootstrap',
  });

  log.debug('Creating handler chain', { prefix: 'bootstrap.initBootstrap' });
  const handler = new APIClientHandler(config);
  handler
    .setNext(new ModulesDiscoveryHandler(config)) // Загрузка манифеста
    .setNext(new RouterHandler(config))
    .setNext(new DIHandler(config))
    .setNext(new InitI18nHandler(config))
    .setNext(new OnAppStartHandler(config))
    .setNext(new ModulesHandler(config))
    .setNext(new RouterPostHandler(config))
    .setNext(new HTTPErrorHandler(config));
  log.debug('Handler chain created', { prefix: 'bootstrap.initBootstrap' });

  log.debug('Executing handler chain', { prefix: 'bootstrap.initBootstrap' });
  const result = await handler.handle(bootstrap);
  log.debug('Handler chain executed', { prefix: 'bootstrap.initBootstrap' });

  log.debug('Bootstrap initialization completed', {
    prefix: 'bootstrap.initBootstrap',
  });

  return result;
};

/**
 *  Класс Bootstrap определяет основные сервисы приложения.
 *  содержит все обработчики, сервисы и инициализаторы для запуска приложения
 *
 *  @param {Module[]} modules - Модули приложения.
 */
export class Bootstrap implements IBootstrap {
  i18n: i18n = i18next;
  routerService = new BootstrapRouterService();
  moduleLoader = new BootstrapModuleLoader();

  private _APIClient: APIClient | null = null;
  private _di: Container = new Container({
    defaultScope: 'Singleton',
  });
  private discoveredModules: Module[] = [];
  private userData: { permissions: string[]; featureFlags: string[] } | null =
    null;
  private appStartManifest: AppStartDTO | null = null;

  /**
   * @return {APIClient} Клиент для взаимодействия с api
   */
  get getAPIClient(): APIClient {
    if (!this._APIClient) {
      log.error('APIClient not initialized', {
        prefix: 'bootstrap.getAPIClient',
      });
      throw new Error('APIClient not initialized');
    }
    log.debug('APIClient accessed', { prefix: 'bootstrap.getAPIClient' });
    return this._APIClient;
  }

  /**
   * @return {Container} DI контейнер.
   */
  get di(): Container {
    return this._di;
  }

  /**
   * Конструктор класса.
   * Для локального запуска приложения используется мок сервис.
   *
   *
   * @param {Module[]} modules - Принимает массив конфигураций модулей
   */
  constructor(private modules: Module[] = []) {
    log.debug(`Bootstrap constructor: modules=${modules.length}`, {
      prefix: 'bootstrap.constructor',
    });
    // Модули будут добавлены в реестр при вызове initModuleLoader()
    // Это гарантирует, что все модули будут добавлены до загрузки INIT модулей
  }

  /**
   * Инициализация Api клиента
   *
   * @param {string} baseURL - Базовый URL для Api клиента.
   * @return {void}
   */
  initAPIClient(baseURL: string): void {
    log.debug(`Initializing APIClient with baseURL: ${baseURL}`, {
      prefix: 'bootstrap.initAPIClient',
    });
    this._APIClient = new APIClient(baseURL);
    log.debug('APIClient initialized', { prefix: 'bootstrap.initAPIClient' });
  }

  /**
   * Инициализация DI контейнера и биндинг Api клиента в него.
   * Автоматически регистрирует все классы с @injectable и @provide через buildProviderModule.
   *
   * @return {void}
   */
  initDI(): void {
    log.debug('Initializing DI container', { prefix: 'bootstrap.initDI' });
    // Автоматическая регистрация всех классов с @injectable и @provide через @inversifyjs/binding-decorators
    void this._di.load(buildProviderModule());

    if (this._APIClient) {
      this._di
        .bind<APIClient>(IOC_CORE_TOKENS.APIClient)
        .toConstantValue(this._APIClient);
      log.debug('APIClient bound to DI container', {
        prefix: 'bootstrap.initDI',
      });
    }
    log.debug('DI container initialized', { prefix: 'bootstrap.initDI' });
  }

  /**
   * Инициализация ModuleLoader с зависимостями
   * Должен быть вызван после инициализации router, i18n и DI
   * Модули добавляются отдельно в ModulesHandler после получения discovered modules
   *
   * @return {void}
   */
  initModuleLoader(): void {
    // Модули теперь добавляются в ModulesHandler после получения discovered modules
    log.debug('Initializing ModuleLoader', {
      prefix: 'bootstrap.initModuleLoader',
    });
    this.moduleLoader.init(this);
    log.debug('ModuleLoader initialized', {
      prefix: 'bootstrap.initModuleLoader',
    });
  }

  /**
   * Устанавливает данные пользователя из манифеста
   */
  setUserData(user: { permissions: string[]; featureFlags: string[] }): void {
    log.debug(
      `Setting user data: permissions=${user.permissions.length}, featureFlags=${user.featureFlags.length}`,
      { prefix: 'bootstrap.setUserData' },
    );
    this.userData = user;
  }

  /**
   * Получает данные пользователя из манифеста
   */
  getUserData(): { permissions: string[]; featureFlags: string[] } | null {
    const hasUserData = this.userData !== null;
    log.debug(`Getting user data: ${hasUserData ? 'present' : 'null'}`, {
      prefix: 'bootstrap.getUserData',
    });
    return this.userData;
  }

  /**
   * Устанавливает модули, обнаруженные через манифест
   */
  setDiscoveredModules(modules: Module[]): void {
    log.debug(`Setting discovered modules: ${modules.length}`, {
      prefix: 'bootstrap.setDiscoveredModules',
    });
    this.discoveredModules = modules;
  }

  /**
   * Получает модули, обнаруженные через манифест
   */
  getDiscoveredModules(): Module[] {
    log.debug(`Getting discovered modules: ${this.discoveredModules.length}`, {
      prefix: 'bootstrap.getDiscoveredModules',
    });
    return this.discoveredModules;
  }

  /**
   * Сохраняет манифест приложения для повторного использования
   */
  setAppStartManifest(manifest: AppStartDTO): void {
    log.debug('Setting app start manifest', {
      prefix: 'bootstrap.setAppStartManifest',
    });
    this.appStartManifest = manifest;
  }

  /**
   * Получает сохраненный манифест приложения
   */
  getAppStartManifest(): AppStartDTO | null {
    return this.appStartManifest;
  }
}
