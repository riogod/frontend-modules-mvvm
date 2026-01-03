import { makeAutoObservable } from 'mobx';
import { inject, injectable } from 'inversify';

import { LocalStorageRepository } from '../data/localStorage.repository';
import { type LoadingPhase, type ThemeMode } from './app.interface';
import { IOC_CORE_TOKENS } from '@platform/core';

@injectable()
export class AppModel {
  private _defaultColorMode: ThemeMode =
    window.matchMedia &&
    window.matchMedia('(prefers-color-scheme:dark)').matches
      ? 'dark'
      : 'light';
  private _colorMode: Omit<ThemeMode, 'system'>;
  private _colorModeSettings: ThemeMode;
  private _notification: string = '';
  private _loadingPhase: LoadingPhase = 'init';

  get loadingPhase(): LoadingPhase {
    return this._loadingPhase;
  }

  set loadingPhase(phase: LoadingPhase) {
    this._loadingPhase = phase;
  }

  get colorModeSettings(): ThemeMode {
    return this._colorModeSettings;
  }

  get notification() {
    return this._notification;
  }

  set notification(notification: string) {
    this._notification = notification;
  }

  get appThemeMode(): Omit<ThemeMode, 'system'> {
    return this._colorMode;
  }

  set appThemeMode(themeMode: ThemeMode | undefined) {
    if (!themeMode) {
      this.localStorageRepository.removeKey('themeMode');
      this._colorMode = this._defaultColorMode;
      this._colorModeSettings = 'system';
      return;
    }
    this.localStorageRepository.setKey<ThemeMode>('themeMode', themeMode);
    this._colorMode = themeMode;
    this._colorModeSettings = themeMode;
  }

  constructor(
    @inject(IOC_CORE_TOKENS.REPOSITORY_LOCAL_STORAGE)
    private localStorageRepository: LocalStorageRepository,
  ) {
    makeAutoObservable(this);

    const getThemeMode =
      this.localStorageRepository.getKey<ThemeMode>('themeMode');

    this._colorMode = getThemeMode || this._defaultColorMode;
    this._colorModeSettings = getThemeMode || 'system';
  }
}
