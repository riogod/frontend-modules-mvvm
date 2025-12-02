import { type Container } from 'inversify';
import { type APIClient } from './APIClient';
import { type i18n } from 'i18next';

/**
 * Интерфейс Bootstrap объекта для инициализации модулей
 * Определяет минимальный набор свойств и методов, необходимых модулям
 */
export interface IBootstrap {
  /**
   * DI контейнер для регистрации зависимостей модуля
   */
  readonly di: Container;

  /**
   * APIClient для работы с API
   */
  readonly getAPIClient: APIClient;

  /**
   * i18n instance для локализации
   */
  readonly i18n: i18n;
}
