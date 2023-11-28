import { APIClientHandler } from "./handlers/APIClient";
import { RouterHandler } from "./handlers/RouterHandler";
import { RouterPostHandler } from "./handlers/RouterPostHandler";
import { APIClient } from "@todo/core";
import { Module } from "../modules/interface";
import { ModulesHandler } from "./handlers/ModulesHandler";
import { Container } from "inversify";
import { buildProviderModule } from "inversify-binding-decorators";
import { DIHandler } from "./handlers/DIHandler";
import { HTTPErrorHandler } from "./handlers/HTTPErrorHandler";
import { ClientHashHandler } from "./handlers/ClientHashHandler";
import { InitI18nHandler } from "./handlers/InitI18nHandler.ts";
import i18next from "i18next";
import { MockServiceHandler } from "./handlers/MockServiceHandler.ts";
import { BootstrapMockService } from "./services/mockService.ts";
import { BootstrapRouterService } from "./services/routerService.ts";

/**
 * Запускает процесс старта приложения и определяет последовательность выполнения обработчиков.
 *
 * @param {Bootstrap} bootstrap - Инстанс класса Bootstrap.
 * @param {Record<string, any>} config - Файл конфигурации.
 * @return {Promise<Bootstrap>} Возвращает промис проинициализированного Bootstrap.
 */
export const initBootstrap = async (
  bootstrap: Bootstrap,
  config: Record<string, any>,
): Promise<Bootstrap> => {
  const handler = new APIClientHandler(config);
  handler
    .setNext(new ClientHashHandler(config))
    .setNext(new RouterHandler(config))
    .setNext(new InitI18nHandler(config))
    .setNext(new ModulesHandler(config))
    .setNext(new MockServiceHandler(config))
    .setNext(new DIHandler(config))
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
  i18n = i18next;
  routerService = new BootstrapRouterService();
  mockService: BootstrapMockService | null = null;

  private _APIClient: APIClient | null = null;
  private _di: Container = new Container({
    autoBindInjectable: true,
    defaultScope: "Singleton",
  });

  /**
   * @return {APIClient} Клиент для взаимодействия с api
   */
  get getAPIClient(): APIClient {
    if (!this._APIClient) {
      throw new Error("APIClient not initialized");
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
   * @param {Module[]} modules - Принимает массив конфигураций модулей
   */
  constructor(private modules: Module[] = []) {
    if (process.env.NODE_ENV === "development") {
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
    this._di.load(buildProviderModule());

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
        process.env.NODE_ENV === "development" &&
        module.config.mockHandlers &&
        this.mockService
      ) {
        this.mockService.addHandlers(module.config.mockHandlers);
      }
    }
  }
}
