import { type Module } from '../../../modules/interface';
import { type IRoute } from '@platform/core';

/**
 * Статус загрузки модуля
 */
export type ModuleLoadStatus =
  | 'pending'
  | 'loading'
  | 'preloaded'
  | 'loaded'
  | 'failed';

/**
 * Информация о загруженном модуле
 */
export interface LoadedModule {
  module: Module;
  status: ModuleLoadStatus;
  error?: Error;
}

/**
 * Типы для параметров onEnterNode хука маршрута
 */
export type RouteState = Parameters<NonNullable<IRoute['onEnterNode']>>[0];
export type RouteFromState = Parameters<NonNullable<IRoute['onEnterNode']>>[1];
export type RouteDependencies = Parameters<
  NonNullable<IRoute['onEnterNode']>
>[2];
