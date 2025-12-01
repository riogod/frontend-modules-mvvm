import { APIClientHandler } from './handlers/APIClient';
import { RouterHandler } from './handlers/RouterHandler';
import { RouterPostHandler } from './handlers/RouterPostHandler';
import { APIClient, IOC_CORE_TOKENS, log } from '@platform/core';
import { ModulesHandler } from './handlers/ModulesHandler';
import { Container } from 'inversify';
import { DIHandler } from './handlers/DIHandler';
import { HTTPErrorHandler } from './handlers/HTTPErrorHandler';
import { InitI18nHandler } from './handlers/InitI18nHandler';
import i18next, { type i18n } from 'i18next';
import { MockServiceHandler } from './handlers/MockServiceHandler';
import { BootstrapMockService } from './services/mockService';
import { BootstrapRouterService } from './services/routerService';
import { BootstrapModuleLoader } from './services/moduleLoader/';
import { type IAppConfig } from '../config/app';
import { buildProviderModule } from '@inversifyjs/binding-decorators';
import { type Module } from '../modules/interface';
import { AccessControlHandler } from './handlers/AccessControlHandler';
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
  log.debug('Bootstrap initialization started', { prefix: 'bootstrap' });

  const handler = new APIClientHandler(config);
  handler
    .setNext(new ModulesDiscoveryHandler(config)) // Загрузка манифеста
    .setNext(new RouterHandler(config))
    .setNext(new DIHandler(config))
    .setNext(new InitI18nHandler(config))
    .setNext(new MockServiceHandler(config))
    .setNext(new AccessControlHandler(config))
    .setNext(new ModulesHandler(config))
    .setNext(new RouterPostHandler(config))
    .setNext(new HTTPErrorHandler(config));

  const result = await handler.handle(bootstrap);

  log.debug('Bootstrap initialization completed', { prefix: 'bootstrap' });

  return result;
};

/**
 *  Класс Bootstrap определяет основные сервисы приложения.
 *  содержит все обработчики, сервисы и инициализаторы для запуска приложения
 *
 *  @param {Module[]} modules - Модули приложения.
 */
export class Bootstrap {
  i18n: i18n = i18next;
  routerService = new BootstrapRouterService();
  moduleLoader = new BootstrapModuleLoader();
  mockService: BootstrapMockService | null = null;

  private _APIClient: APIClient | null = null;
  private _di: Container = new Container({
    defaultScope: 'Singleton',
  });
  private discoveredModules: Module[] = [];
  private userData: { permissions: string[]; featureFlags: string[] } | null =
    null;

  /**
   * @return {APIClient} Клиент для взаимодействия с api
   */
  get getAPIClient(): APIClient {
    if (!this._APIClient) {
      throw new Error('APIClient not initialized');
    }
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
    if (process.env.NODE_ENV === 'development') {
      this.mockService = new BootstrapMockService();
    }
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
      prefix: 'bootstrap',
    });
    this._APIClient = new APIClient(baseURL);
    log.debug('APIClient initialized', { prefix: 'bootstrap' });
  }

  /**
   * Инициализация DI контейнера и биндинг Api клиента в него.
   * Автоматически регистрирует все классы с @injectable и @provide через buildProviderModule.
   *
   * @return {void}
   */
  initDI(): void {
    log.debug('Initializing DI container', { prefix: 'bootstrap' });
    // Автоматическая регистрация всех классов с @injectable и @provide через @inversifyjs/binding-decorators
    void this._di.load(buildProviderModule());

    if (this._APIClient) {
      this._di
        .bind<APIClient>(IOC_CORE_TOKENS.APIClient)
        .toConstantValue(this._APIClient);
      log.debug('APIClient bound to DI container', { prefix: 'bootstrap' });
    }
    log.debug('DI container initialized', { prefix: 'bootstrap' });
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
      prefix: 'bootstrap',
    });
    this.moduleLoader.init(this);
    log.debug('ModuleLoader initialized', {
      prefix: 'bootstrap',
    });
  }

  /**
   * Устанавливает данные пользователя из манифеста
   */
  setUserData(user: { permissions: string[]; featureFlags: string[] }): void {
    this.userData = user;
  }

  /**
   * Получает данные пользователя из манифеста
   */
  getUserData(): { permissions: string[]; featureFlags: string[] } | null {
    return this.userData;
  }

  /**
   * Устанавливает модули, обнаруженные через манифест
   */
  setDiscoveredModules(modules: Module[]): void {
    this.discoveredModules = modules;
  }

  /**
   * Получает модули, обнаруженные через манифест
   */
  getDiscoveredModules(): Module[] {
    return this.discoveredModules;
  }
}
