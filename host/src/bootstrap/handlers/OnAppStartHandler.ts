import {
  AccessControlModel,
  AppParamsModel,
  GetFeatureFlagsUsecase,
  GetFeatureFlagUsecase,
  GetPermissionsUsecase,
  GetPermissionUsecase,
  GetParamUsecase,
  GetParamsUsecase,
  RemoveFeatureFlagsUsecase,
  RemoveParamUsecase,
  RemovePermissionsUsecase,
  SetFeatureFlagsUsecase,
  SetParamsUsecase,
  SetPermissionsUsecase,
  UpdateFeatureFlagsUsecase,
  UpdateParamsUsecase,
  UpdatePermissionsUsecase,
} from '@platform/common';
import { type Bootstrap } from '..';
import { AbstractInitHandler } from './AbstractInitHandler';
import { IOC_CORE_TOKENS, log } from '@platform/core';
import { AppStartRepository } from '../services/appStart/data/app.repository';

/**
 * Обработчик инициализации DI контейнера.
 */
export class OnAppStartHandler extends AbstractInitHandler {
  async handle(bootstrap: Bootstrap): Promise<Bootstrap> {
    log.debug('OnAppStartHandler: starting', {
      prefix: 'bootstrap.handlers.OnAppStartHandler',
    });

    // Binding Repositories to DI container
    bootstrap.di
      .bind<AppStartRepository>(IOC_CORE_TOKENS.REPOSITORY_APP_START)
      .to(AppStartRepository);
    // Binding Models to DI container
    bootstrap.di
      .bind<AccessControlModel>(IOC_CORE_TOKENS.MODEL_ACCESS_CONTROL)
      .to(AccessControlModel);
    bootstrap.di
      .bind<AppParamsModel>(IOC_CORE_TOKENS.MODEL_APP_PARAMS)
      .to(AppParamsModel);

    // Binding Usecases to DI container
    bootstrap.di
      .bind<GetFeatureFlagUsecase>(IOC_CORE_TOKENS.USECASE_GET_FEATURE_FLAG)
      .to(GetFeatureFlagUsecase);
    bootstrap.di
      .bind<GetFeatureFlagsUsecase>(IOC_CORE_TOKENS.USECASE_GET_FEATURE_FLAGS)
      .to(GetFeatureFlagsUsecase);
    bootstrap.di
      .bind<RemoveFeatureFlagsUsecase>(
        IOC_CORE_TOKENS.USECASE_REMOVE_FEATURE_FLAGS,
      )
      .to(RemoveFeatureFlagsUsecase);
    bootstrap.di
      .bind<SetFeatureFlagsUsecase>(IOC_CORE_TOKENS.USECASE_SET_FEATURE_FLAGS)
      .to(SetFeatureFlagsUsecase);
    bootstrap.di
      .bind<UpdateFeatureFlagsUsecase>(
        IOC_CORE_TOKENS.USECASE_UPDATE_FEATURE_FLAGS,
      )
      .to(UpdateFeatureFlagsUsecase);

    bootstrap.di
      .bind<GetPermissionUsecase>(IOC_CORE_TOKENS.USECASE_GET_PERMISSION)
      .to(GetPermissionUsecase);
    bootstrap.di
      .bind<GetPermissionsUsecase>(IOC_CORE_TOKENS.USECASE_GET_PERMISSIONS)
      .to(GetPermissionsUsecase);
    bootstrap.di
      .bind<RemovePermissionsUsecase>(
        IOC_CORE_TOKENS.USECASE_REMOVE_PERMISSIONS,
      )
      .to(RemovePermissionsUsecase);
    bootstrap.di
      .bind<SetPermissionsUsecase>(IOC_CORE_TOKENS.USECASE_SET_PERMISSIONS)
      .to(SetPermissionsUsecase);
    bootstrap.di
      .bind<UpdatePermissionsUsecase>(
        IOC_CORE_TOKENS.USECASE_UPDATE_PERMISSIONS,
      )
      .to(UpdatePermissionsUsecase);
    bootstrap.di
      .bind<GetParamUsecase>(IOC_CORE_TOKENS.USECASE_GET_PARAM)
      .to(GetParamUsecase);
    bootstrap.di
      .bind<GetParamsUsecase>(IOC_CORE_TOKENS.USECASE_GET_PARAMS)
      .to(GetParamsUsecase);
    bootstrap.di
      .bind<SetParamsUsecase>(IOC_CORE_TOKENS.USECASE_SET_PARAMS)
      .to(SetParamsUsecase);
    bootstrap.di
      .bind<UpdateParamsUsecase>(IOC_CORE_TOKENS.USECASE_UPDATE_PARAMS)
      .to(UpdateParamsUsecase);
    bootstrap.di
      .bind<RemoveParamUsecase>(IOC_CORE_TOKENS.USECASE_REMOVE_PARAM)
      .to(RemoveParamUsecase);

    const accessControlModel = bootstrap.di.get<AccessControlModel>(
      IOC_CORE_TOKENS.MODEL_ACCESS_CONTROL,
    );
    const appParamsModel = bootstrap.di.get<AppParamsModel>(
      IOC_CORE_TOKENS.MODEL_APP_PARAMS,
    );

    // Используем user данные из манифеста, если они есть
    // Используем сохраненный манифест, если он есть, чтобы избежать повторного запроса
    const manifest = bootstrap.getAppStartManifest();
    const userData = bootstrap.getUserData();

    if (manifest && manifest.data) {
      // Используем данные из сохраненного манифеста
      accessControlModel.setFeatureFlags(manifest.data.features || {});
      accessControlModel.setPermissions(manifest.data.permissions || {});
      appParamsModel.setParams(manifest.data.params);
      log.debug('OnAppStartHandler: using data from cached manifest', {
        prefix: 'bootstrap.handlers.OnAppStartHandler',
      });
    } else if (userData) {
      // Fallback: используем user данные из манифеста (если манифест не содержит data)
      // Преобразуем массивы строк в объекты Record<string, boolean>
      const permissions: Record<string, boolean> = {};
      for (const perm of userData.permissions) {
        permissions[perm] = true;
      }

      const featureFlags: Record<string, boolean> = {};
      for (const flag of userData.featureFlags) {
        featureFlags[flag] = true;
      }

      accessControlModel.setPermissions(permissions);
      accessControlModel.setFeatureFlags(featureFlags);
      // userData не содержит params, устанавливаем пустой объект

      appParamsModel.setParams({});
      log.debug('OnAppStartHandler: using user data from manifest', {
        prefix: 'bootstrap.handlers.OnAppStartHandler',
      });
    } else {
      // Последний fallback: загружаем из API только если нет данных в манифесте
      const appStartRepository = bootstrap.di.get<AppStartRepository>(
        IOC_CORE_TOKENS.REPOSITORY_APP_START,
      );
      const appStart = await appStartRepository.getAppStart();

      accessControlModel.setFeatureFlags(appStart.data.features);
      accessControlModel.setPermissions(appStart.data.permissions);
      appParamsModel.setParams(appStart.data.params);
      log.debug('OnAppStartHandler: using user data from API (fallback)', {
        prefix: 'bootstrap.handlers.OnAppStartHandler',
      });
    }

    log.debug('OnAppStartHandler: completed', {
      prefix: 'bootstrap.handlers.OnAppStartHandler',
    });
    return await super.handle(bootstrap);
  }
}
