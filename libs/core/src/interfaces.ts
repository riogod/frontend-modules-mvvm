import { type Container } from 'inversify';
import { type APIClient } from './APIClient';
import { type ModuleI18n } from './ModuleInterfaces';

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
   * Используем ModuleI18n вместо i18next.i18n, чтобы избежать
   * прямой зависимости от i18next в shared библиотеках
   */
  readonly i18n: ModuleI18n;
}
