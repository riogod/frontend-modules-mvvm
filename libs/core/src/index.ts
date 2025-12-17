export * from './APIClient';
export type * from './Router';
export * from './Logger';
export * from './ModuleInterfaces';

export const IOC_CORE_TOKENS = {
  APIClient: Symbol.for('APIClient'),

  // Repositories
  REPOSITORY_APP_START: Symbol.for('AppStartRepository'),
  REPOSITORY_LOCAL_STORAGE: Symbol.for('LocalStorageRepository'),
  // Models
  MODEL_ACCESS_CONTROL: Symbol.for('AccessControlModel'),
  MODEL_APP: Symbol.for('AppModel'),
  MODEL_APP_PARAMS: Symbol.for('AppParamsModel'),

  // Usecases
  USECASE_GET_FEATURE_FLAG: Symbol.for('GetFeatureFlagUsecase'),
  USECASE_GET_FEATURE_FLAGS: Symbol.for('GetFeatureFlagsUsecase'),
  USECASE_REMOVE_FEATURE_FLAGS: Symbol.for('RemoveFeatureFlagsUsecase'),
  USECASE_SET_FEATURE_FLAGS: Symbol.for('SetFeatureFlagsUsecase'),
  USECASE_UPDATE_FEATURE_FLAGS: Symbol.for('UpdateFeatureFlagsUsecase'),
  USECASE_GET_PERMISSION: Symbol.for('GetPermissionUsecase'),
  USECASE_GET_PERMISSIONS: Symbol.for('GetPermissionsUsecase'),
  USECASE_REMOVE_PERMISSIONS: Symbol.for('RemovePermissionsUsecase'),
  USECASE_SET_PERMISSIONS: Symbol.for('SetPermissionsUsecase'),
  USECASE_UPDATE_PERMISSIONS: Symbol.for('UpdatePermissionsUsecase'),
  USECASE_GET_PARAM: Symbol.for('GetParamUsecase'),
  USECASE_GET_PARAMS: Symbol.for('GetParamsUsecase'),
  USECASE_SET_PARAMS: Symbol.for('SetParamsUsecase'),
  USECASE_UPDATE_PARAMS: Symbol.for('UpdateParamsUsecase'),
  USECASE_REMOVE_PARAM: Symbol.for('RemoveParamUsecase'),

  // ViewModels
  VIEW_MODEL_APP_SETTINGS: Symbol.for('AppSettingsViewModel'),
  VIEW_MODEL_UI_SETTINGS: Symbol.for('UiSettingsViewModel'),
} as const;
