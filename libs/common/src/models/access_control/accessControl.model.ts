import { makeAutoObservable } from 'mobx';
import { injectable } from 'inversify';

import type { AccessControlsType } from './accessControl.interface';

@injectable()
export class AccessControlModel {
  private _featureFlags: Partial<AccessControlsType> = {};
  private _permissions: Partial<AccessControlsType> = {};
  // Кеш для мемоизации результатов getFeatureFlags
  private _featureFlagsCache = new Map<object, Record<string, boolean>>();
  // Кеш для мемоизации результатов getPermissions
  private _permissionsCache = new Map<object, Record<string, boolean>>();

  get allFeatureFlags(): Partial<AccessControlsType> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return this._featureFlags;
  }

  get allPermissions(): Partial<AccessControlsType> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return this._permissions;
  }

  constructor(
  ) {
    makeAutoObservable(this);
  }

  /**
   *  Метод для получения списка feature flags.
   * 
   *  Возвращает объект с ключами из enum и значениями feature flags.
   *  Ключи - ключи enum'а, значения - значения feature flags из _featureFlags.
   * 
   *  Если feature flag не найден, то значение false.
   * 
   *  Результаты мемоизируются для повышения производительности.
   *  Кеш автоматически инвалидируется при изменении _featureFlags.
   * 
   * @param enumParam ENUM со списком feature flags
   */
  getFeatureFlags<T extends Record<string, string | number>>(enumParam: T): Record<keyof T, boolean> {
    // Проверяем кеш
    const cached = this._featureFlagsCache.get(enumParam);
    if (cached) {
      return cached as Record<keyof T, boolean>;
    }

    // Вычисляем результат
    const mappedFT = {} as Record<keyof T, boolean>;

    Object.keys(enumParam).forEach((key) => {
      // Пропускаем числовые ключи (обратное отображение для числовых enum'ов)
      if (!isNaN(Number(key))) {
        return;
      }
      const typedKey = key as keyof T;
      mappedFT[typedKey] = Boolean(this._featureFlags[String(enumParam[typedKey])]);
    });

    // Сохраняем в кеш
    this._featureFlagsCache.set(enumParam, mappedFT as Record<string, boolean>);

    return mappedFT;
  }

  /**
   *  Метод для получения конкретного feature flag
   * @param key значение ключа
   */
  getFeatureFlag(key: string): boolean {
    return Boolean(this._featureFlags[key]);
  }

  /**
   *  Метод для установки feature flags
   * @param flags объект с ключами и значениями feature flags
   */
  setFeatureFlags(flags: Partial<AccessControlsType>): void {
    this._featureFlags = flags;
    this._invalidateFeatureFlagsCache();
  }

  /**
   *  Метод для обновления feature flags
   * @param flags объект с ключами и значениями feature flags
   */
  updateFeatureFlags(flags: Partial<AccessControlsType>): void {
    this._featureFlags = { ...this._featureFlags, ...flags };
    this._invalidateFeatureFlagsCache();
  }

  /**
   *  Метод для удаления конкретного feature flag
   * @param key значение ключа
   */
  removeFeatureFlag(key: string): void {
    delete this._featureFlags[key];
    this._invalidateFeatureFlagsCache();
  }

  /**
   *  Метод для получения массива значений или значения feature flag.
   *  Возвращает true в случае наличия всех запрашиваемых feature flag
   *
   * @param flags string | string[] ключей feature flags
   */
  includesFeatureFlags(flags: string[] | string): boolean {
    if (flags instanceof Array) {
      return flags.every((flag: string) => this._featureFlags[flag]);
    }

    return Boolean(this._featureFlags[flags]);
  }

  /**
   *  Метод для получения списка permissions.
   * 
   *  Возвращает объект с ключами из enum и значениями permissions.
   *  Ключи - ключи enum'а, значения - значения permissions из _permissions.
   * 
   *  Если permission не найден, то значение false.
   * 
   *  Результаты мемоизируются для повышения производительности.
   *  Кеш автоматически инвалидируется при изменении _permissions.
   * 
   * @param enumParam ENUM со списком permissions
   */
  getPermissions<T extends Record<string, string | number>>(enumParam: T): Record<keyof T, boolean> {
    // Проверяем кеш
    const cached = this._permissionsCache.get(enumParam);
    if (cached) {
      return cached as Record<keyof T, boolean>;
    }

    // Вычисляем результат
    const mappedPermissions = {} as Record<keyof T, boolean>;

    Object.keys(enumParam).forEach((key) => {
      // Пропускаем числовые ключи (обратное отображение для числовых enum'ов)
      if (!isNaN(Number(key))) {
        return;
      }
      const typedKey = key as keyof T;
      mappedPermissions[typedKey] = Boolean(this._permissions[String(enumParam[typedKey])]);
    });

    // Сохраняем в кеш
    this._permissionsCache.set(enumParam, mappedPermissions as Record<string, boolean>);

    return mappedPermissions;
  }

  /**
   *  Метод для получения конкретного permission
   * @param key значение ключа
   */
  getPermission(key: string): boolean {
    return Boolean(this._permissions[key]);
  }

  /**
   *  Метод для установки permissions
   * @param permissions объект с ключами и значениями permissions
   */
  setPermissions(permissions: Partial<AccessControlsType>): void {
    this._permissions = permissions;
    this._invalidatePermissionsCache();
  }

  /**
   *  Метод для обновления permissions
   * @param permissions объект с ключами и значениями permissions
   */
  updatePermissions(permissions: Partial<AccessControlsType>): void {
    this._permissions = { ...this._permissions, ...permissions };
    this._invalidatePermissionsCache();
  }

  /**
   *  Метод для удаления конкретного permission
   * @param key значение ключа
   */
  removePermission(key: string): void {
    delete this._permissions[key];
    this._invalidatePermissionsCache();
  }

  /**
   *  Метод для получения массива значений или значения permission.
   *  Возвращает true в случае наличия всех запрашиваемых permissions
   *
   * @param permissions string | string[] ключей permissions
   */
  includesPermissions(permissions: string[] | string): boolean {
    if (permissions instanceof Array) {
      return permissions.every((permission: string) => this._permissions[permission]);
    }

    return Boolean(this._permissions[permissions]);
  }

  /**
   * Инвалидирует кеш feature flags при изменении _featureFlags
   */
  private _invalidateFeatureFlagsCache(): void {
    this._featureFlagsCache.clear();
  }

  /**
   * Инвалидирует кеш permissions при изменении _permissions
   */
  private _invalidatePermissionsCache(): void {
    this._permissionsCache.clear();
  }

}
