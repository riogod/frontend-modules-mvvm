import type { Route } from "@riogz/router";
import type { Router } from "@riogz/router";
import type { FunctionComponent, ReactNode } from "react";
import { type Container } from "inversify";

export interface RouterDependencies {
  di: Container;
  menu: IMenuItem[];
}

export interface IRoute extends Route<RouterDependencies> {
  /**
   * Переопределение интерфейса дочерних роутов
   */
  children?: IRoute[];
  /**
   * Объект конфигурации отображения роута в меню, ключ - тег меню, значение - объект конфигурации
   */
  menu?: IMenuConfig;
  /**
   * Компонент отображаемой страницы
   */
  pageComponent?: FunctionComponent;
}

export interface IMenuItemNavigate {
  id?: string;
  path: string;
}
export interface IMenuConfig {
  /**
   * Наименование кнопки перехода в табе или меню
   */
  text: string;
  /**
   * Условие отображения пункта в меню, помимо featureToggle и accessPermission
   * @param router - инстанс роутера
   * @param container - инстанс DI
   */
  viewCondition?: (router: Router<Record<string, any>>) => boolean;
  /**
   * Навигация роута
   */
  navigate?: IMenuItemNavigate;
  /**
   * Иконка для отображения роута в сайдбаре
   */
  icon?: ReactNode;
  /**
   * Порядок отображения и активации пункта в меню (указывать в диапазоне от 1 до 1000, значение по умолчанию 1000)
   */
  sortOrder?: number;
  /**
   * Меню всегда раскрыто
   */
  menuAlwaysExpand?: boolean;
}

export interface IMenuItem {
  /**
   * Идентификатор меню
   */
  id: string;
  /**
   * Путь роута
   */
  path: string;
  /**
   * Название роута
   */
  text: string;
  /**
   * Иконка для отображения роута в сайдбаре
   */
  icon?: ReactNode;
  /**
   * Порядок отображения и активации пункта в меню (указывать в диапазоне от 1 до 1000, значение по умолчанию 1000)
   */
  sortOrder?: number;
  /**
   * Навигация роута
   */
  navigate?: IMenuItemNavigate;
  /**
   * Дочерние элементы меню
   */
  children?: IMenuItem[];
  /**
   * Компонент отображаемой страницы
   */
  pageComponent?: FunctionComponent;
  /**
   * Меню всегда раскрыто
   */
  menuAlwaysExpand?: boolean;
  /**
   * компонент замены сабменю
   */
  menuComponent?: FunctionComponent;
}

export type IRoutes = IRoute[];
