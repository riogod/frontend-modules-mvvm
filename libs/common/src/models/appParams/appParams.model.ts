import { makeAutoObservable } from 'mobx';
import { injectable } from 'inversify';

import type { AppParamsType } from './appParams.interface';

/**
 * Модель для управления параметрами приложения.
 * Параметры поставляются при старте приложения через AppStartDTO.
 */
@injectable()
export class AppParamsModel {
  private _params: Partial<AppParamsType> = {};
  // Кеш для мемоизации результатов getParams
  private _paramsCache = new Map<object, Record<string, unknown>>();

  /**
   * Получить все параметры приложения
   */
  get allParams(): Partial<AppParamsType> {
    return this._params;
  }

  constructor() {
    makeAutoObservable(this);
  }

  /**
   * Метод для получения списка параметров.
   *
   * Возвращает объект с ключами из enum и значениями параметров.
   * Ключи - ключи enum'а, значения - значения параметров из _params.
   *
   * Если параметр не найден, то значение undefined.
   *
   * Результаты мемоизируются для повышения производительности.
   * Кеш автоматически инвалидируется при изменении _params.
   *
   * @param enumParam ENUM со списком параметров
   */
  getParams<T extends Record<string, string | number>>(
    enumParam: T,
  ): Record<keyof T, unknown> {
    // Проверяем кеш
    const cached = this._paramsCache.get(enumParam);
    if (cached) {
      return cached as Record<keyof T, unknown>;
    }

    // Вычисляем результат
    const mappedParams = {} as Record<keyof T, unknown>;

    Object.keys(enumParam).forEach((key) => {
      // Пропускаем числовые ключи (обратное отображение для числовых enum'ов)
      if (!isNaN(Number(key))) {
        return;
      }
      const typedKey = key as keyof T;
      mappedParams[typedKey] = this._params[String(enumParam[typedKey])];
    });

    // Сохраняем в кеш
    this._paramsCache.set(enumParam, mappedParams as Record<string, unknown>);

    return mappedParams;
  }

  /**
   * Метод для получения конкретного параметра
   * @param key значение ключа
   */
  getParam<T = unknown>(key: string): T | undefined {
    return this._params[key] as T | undefined;
  }

  /**
   * Метод для получения конкретного параметра с типизацией
   * @param key значение ключа
   * @returns значение параметра или undefined, если параметр не найден
   */
  getParamTyped<T = unknown>(key: string): T | undefined {
    return this._params[key] as T | undefined;
  }

  /**
   * Метод для получения параметров по массиву ключей с типизацией
   * @param keys массив ключей параметров
   * @returns объект с параметрами, где ключи - это ключи из массива, значения - типизированные параметры
   */
  getParamsByKeys<T = unknown>(keys: string[]): Record<string, T | undefined> {
    const result: Record<string, T | undefined> = {};
    keys.forEach((key) => {
      result[key] = this._params[key] as T | undefined;
    });
    return result;
  }

  /**
   * Метод для установки параметров
   * @param params объект с ключами и значениями параметров
   */
  setParams(params: Partial<AppParamsType>): void {
    this._params = params;
    this._invalidateParamsCache();
  }

  /**
   * Метод для обновления параметров
   * @param params объект с ключами и значениями параметров
   */
  updateParams(params: Partial<AppParamsType>): void {
    this._params = { ...this._params, ...params };
    this._invalidateParamsCache();
  }

  /**
   * Метод для установки конкретного параметра
   * @param key ключ параметра
   * @param value значение параметра
   */
  setParam(key: string, value: unknown): void {
    this._params[key] = value;
    this._invalidateParamsCache();
  }

  /**
   * Метод для удаления конкретного параметра
   * @param key значение ключа
   */
  removeParam(key: string): void {
    delete this._params[key];
    this._invalidateParamsCache();
  }

  /**
   * Метод для проверки наличия параметров.
   * Возвращает true в случае наличия всех запрашиваемых параметров
   *
   * @param keys string | string[] ключей параметров
   */
  hasParams(keys: string[] | string): boolean {
    if (keys instanceof Array) {
      return keys.every((key: string) => key in this._params);
    }

    return keys in this._params;
  }

  /**
   * Инвалидирует кеш параметров при изменении _params
   */
  private _invalidateParamsCache(): void {
    this._paramsCache.clear();
  }
}
