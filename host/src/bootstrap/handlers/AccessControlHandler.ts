import {
  AccessControlModel,
  GetFeatureFlagsUsecase,
  GetFeatureFlagUsecase,
  GetPermissionsUsecase,
  GetPermissionUsecase,
  RemoveFeatureFlagsUsecase,
  RemovePermissionsUsecase,
  SetFeatureFlagsUsecase,
  SetPermissionsUsecase,
  UpdateFeatureFlagsUsecase,
  UpdatePermissionsUsecase,
} from '@platform/common';
import { type Bootstrap } from '..';
import { AbstractInitHandler } from './AbstractInitHandler';
import { IOC_CORE_TOKENS, log } from '@platform/core';
import { AppStartRepository } from '../services/accessControl/data/app.repository';

/**
 * Обработчик инициализации DI контейнера.
 */
export class AccessControlHandler extends AbstractInitHandler {
  async handle(bootstrap: Bootstrap): Promise<Bootstrap> {
    log.debug('AccessControlHandler: starting', {
      prefix: 'bootstrap.handlers',
    });

    // Binding Repositories to DI container
    bootstrap.di
      .bind<AppStartRepository>(IOC_CORE_TOKENS.REPOSITORY_APP_START)
      .to(AppStartRepository);
    // Binding Models to DI container
    bootstrap.di
      .bind<AccessControlModel>(IOC_CORE_TOKENS.MODEL_ACCESS_CONTROL)
      .to(AccessControlModel);

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

    const accessControlModel = bootstrap.di.get<AccessControlModel>(
      IOC_CORE_TOKENS.MODEL_ACCESS_CONTROL,
    );

    // Используем user данные из манифеста, если они есть
    const userData = bootstrap.getUserData();

    if (userData) {
      // Используем данные из манифеста
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
      log.debug('AccessControlHandler: using user data from manifest', {
        prefix: 'bootstrap.handlers',
      });
    } else {
      // Fallback: загружаем из API или используем defaults
      const appStartRepository = bootstrap.di.get<AppStartRepository>(
        IOC_CORE_TOKENS.REPOSITORY_APP_START,
      );
      const appStart = await appStartRepository.getAppStart();

      accessControlModel.setFeatureFlags(appStart.data.features);
      accessControlModel.setPermissions(appStart.data.permissions);
      log.debug('AccessControlHandler: using user data from API', {
        prefix: 'bootstrap.handlers',
      });
    }

    log.debug('AccessControlHandler: completed', {
      prefix: 'bootstrap.handlers',
    });
    return await super.handle(bootstrap);
  }
}
