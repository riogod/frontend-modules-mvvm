import type { Container } from 'inversify';
import { IOC_CORE_TOKENS } from '@platform/core';
import { LocalStorageRepository } from '../data/localStorage.repository';
import { AppSettingsViewModel } from '../viewmodels/appSettings.vm';
import { UiSettingsViewModel } from '../viewmodels/uiSettings.vm';
import { AppModel } from '../models/app.model';

export enum CORE_DI_TOKENS {}

export const DI_CONFIG = (container: Container) => {
  container
    .bind(IOC_CORE_TOKENS.REPOSITORY_LOCAL_STORAGE)
    .to(LocalStorageRepository);

  container
    .bind(IOC_CORE_TOKENS.VIEW_MODEL_APP_SETTINGS)
    .to(AppSettingsViewModel);
  container
    .bind(IOC_CORE_TOKENS.VIEW_MODEL_UI_SETTINGS)
    .to(UiSettingsViewModel);
  container.bind(IOC_CORE_TOKENS.MODEL_APP).to(AppModel);
  return container;
};
