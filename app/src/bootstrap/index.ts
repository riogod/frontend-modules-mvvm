import { APIClientHandler } from './handlers/APIClient';
import { RouterHandler } from './handlers/RouterHandler';
import { RouterPostHandler } from './handlers/RouterPostHandler';
import { APIClient } from '@todo/core';
import { ModulesHandler } from './handlers/ModulesHandler';
import { Container } from 'inversify';
import { DIHandler } from './handlers/DIHandler';
import { HTTPErrorHandler } from './handlers/HTTPErrorHandler';
import { InitI18nHandler } from './handlers/InitI18nHandler.ts';
import i18next, { i18n } from 'i18next';
import { MockServiceHandler } from './handlers/MockServiceHandler.ts';
import { BootstrapMockService } from './services/mockService.ts';
import { BootstrapRouterService } from './services/routerService.ts';
import { BootstrapModuleLoader } from './services/moduleLoader/';
import { IAppConfig } from '../config/app.ts';
import { buildProviderModule } from '@inversifyjs/binding-decorators';
import { Module } from '../modules/interface.ts';


/**
 * Запускает процесс старта приложения и определяет последовательность выполнения обработчиков.
 *
 * @param {Bootstrap} bootstrap - Инстанс класса Bootstrap.
 * @param {Record<string, any>} config - Файл конфигурации.
 * @return {Promise<Bootstrap>} Возвращает промис проинициализированного Bootstrap.
 */
export const initBootstrap = async (
  bootstrap: Bootstrap,
  config: IAppConfig,
): Promise<Bootstrap> => {
  const handler = new APIClientHandler(config);
  handler
    .setNext(new RouterHandler(config))
    .setNext(new DIHandler(config))
    .setNext(new InitI18nHandler(config))
    .setNext(new ModulesHandler(config))
    .setNext(new MockServiceHandler(config))
    .setNext(new RouterPostHandler(config))
    .setNext(new HTTPErrorHandler(config));

  return await handler.handle(bootstrap);
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
    autobind: true,
    defaultScope: 'Singleton',
  });

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
    this._APIClient = new APIClient(baseURL);
  }

  /**
   * Инициализация DI контейнера и биндинг Api клиента в него.
   * Автоматически регистрирует все классы с @injectable и @provide через buildProviderModule.
   *
   * @return {void}
   */
  initDI(): void {
    // Автоматическая регистрация всех классов с @injectable и @provide через @inversifyjs/binding-decorators
    void this._di.load(buildProviderModule());

    if (this._APIClient) {
      this._di.bind<APIClient>(APIClient).toConstantValue(this._APIClient);
    }
  }

  /**
   * Инициализация ModuleLoader с зависимостями
   * Должен быть вызван после инициализации router, i18n и DI
   * Ждет завершения добавления модулей в реестр перед возвратом
   *
   * @return {Promise<void>}
   */
  async initModuleLoader(): Promise<void> {
    this.moduleLoader.init(this);
    // Ждем завершения добавления модулей, чтобы они были доступны при загрузке INIT модулей
    await this.moduleLoader.addModules(this.modules);
  }
}
