import { APIClientHandler } from './handlers/APIClient';
import { RouterHandler } from './handlers/RouterHandler';
import { RouterPostHandler } from './handlers/RouterPostHandler';
import { APIClient } from '@todo/core';
import { Module } from '../modules/interface';
import { ModulesHandler } from './handlers/ModulesHandler';
import { Container } from 'inversify';
import { DIHandler } from './handlers/DIHandler';
import { HTTPErrorHandler } from './handlers/HTTPErrorHandler';
import { ClientHashHandler } from './handlers/ClientHashHandler';
import { InitI18nHandler } from './handlers/InitI18nHandler.ts';
import i18next, { i18n } from 'i18next';
import { MockServiceHandler } from './handlers/MockServiceHandler.ts';
import { BootstrapMockService } from './services/mockService.ts';
import { BootstrapRouterService } from './services/routerService.ts';
import { IAppConfig } from '../config/app.ts';
// Import all @injectable classes
import { AppModel } from '../modules/core/models/app.model';
import { LocalStorageRepository } from '../modules/core/data/localStorage.repository';
import { UiSettingsViewModel } from '../modules/core/viewmodels/uiSettings.vm';
import { AppSettingsViewModel } from '../modules/core/viewmodels/appSettings.vm';
import { TodoListModel } from '../modules/todo/models/todo_list.model';
import { TodoListViewModel } from '../modules/todo/viewmodels/todo_list.vm';
import { JokesModel } from '../modules/api_example/models/jokes.model';
import { JokesRepository } from '../modules/api_example/data/jokes.repository';
import { JokeViewModel } from '../modules/api_example/viewmodels/joke.vm';

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
    .setNext(new ClientHashHandler(config))
    .setNext(new RouterHandler(config))
    .setNext(new InitI18nHandler(config))
    .setNext(new DIHandler(config)) // DI must be initialized before modules use it
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
  mockService: BootstrapMockService | null = null;

  private _APIClient: APIClient | null = null;
  private _di: Container = new Container({
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
   *
   * @return {void}
   */
  initDI(): void {
    // Inversify 7 requires explicit registration of @injectable classes
    // Register all @injectable classes
    this._di.bind(LocalStorageRepository).toSelf().inSingletonScope();
    this._di.bind(AppModel).toSelf().inSingletonScope();
    this._di.bind(UiSettingsViewModel).toSelf().inSingletonScope();
    this._di.bind(AppSettingsViewModel).toSelf().inSingletonScope();
    this._di.bind(TodoListModel).toSelf().inSingletonScope();
    this._di.bind(TodoListViewModel).toSelf().inSingletonScope();
    this._di.bind(JokesRepository).toSelf().inSingletonScope();
    this._di.bind(JokesModel).toSelf().inSingletonScope();
    this._di.bind(JokeViewModel).toSelf().inSingletonScope();

    if (this._APIClient) {
      this._di.bind<APIClient>(APIClient).toConstantValue(this._APIClient);
    }
  }

  /**
   * Инициализация модулей приложения путем обработки их конфигураций.
   *
   * @return {Promise<void>} - Промис зарезолвиться после обработки всех конфигураций модулей.
   */
  async initModules(): Promise<void> {
    for (const module of this.modules) {
      if (module.config.ROUTES) {
        const routes = module.config.ROUTES();
        this.routerService.router.add(routes);
        this.routerService.addRoutes(routes);
      }

      if (module.config.onModuleInit) {
        await module.config.onModuleInit(this);
      }

      if (module.config.I18N && this.i18n) {
        module.config.I18N(this.i18n);
      }

      if (
        process.env.NODE_ENV === 'development' &&
        module.config.mockHandlers &&
        this.mockService
      ) {
        this.mockService.addHandlers(module.config.mockHandlers);
      }
    }
  }
}
