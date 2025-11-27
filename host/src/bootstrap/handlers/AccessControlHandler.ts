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
import { log } from '@platform/core';
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
      .bind<AppStartRepository>('AppStartRepository')
      .to(AppStartRepository);
    // Binding Models to DI container
    bootstrap.di
      .bind<AccessControlModel>('AccessControlModel')
      .to(AccessControlModel);

    // Binding Usecases to DI container
    bootstrap.di
      .bind<GetFeatureFlagUsecase>('GetFeatureFlagUsecase')
      .to(GetFeatureFlagUsecase);
    bootstrap.di
      .bind<GetFeatureFlagsUsecase>('GetFeatureFlagsUsecase')
      .to(GetFeatureFlagsUsecase);
    bootstrap.di
      .bind<RemoveFeatureFlagsUsecase>('RemoveFeatureFlagsUsecase')
      .to(RemoveFeatureFlagsUsecase);
    bootstrap.di
      .bind<SetFeatureFlagsUsecase>('SetFeatureFlagsUsecase')
      .to(SetFeatureFlagsUsecase);
    bootstrap.di
      .bind<UpdateFeatureFlagsUsecase>('UpdateFeatureFlagsUsecase')
      .to(UpdateFeatureFlagsUsecase);

    bootstrap.di
      .bind<GetPermissionUsecase>('GetPermissionUsecase')
      .to(GetPermissionUsecase);
    bootstrap.di
      .bind<GetPermissionsUsecase>('GetPermissionsUsecase')
      .to(GetPermissionsUsecase);
    bootstrap.di
      .bind<RemovePermissionsUsecase>('RemovePermissionsUsecase')
      .to(RemovePermissionsUsecase);
    bootstrap.di
      .bind<SetPermissionsUsecase>('SetPermissionsUsecase')
      .to(SetPermissionsUsecase);
    bootstrap.di
      .bind<UpdatePermissionsUsecase>('UpdatePermissionsUsecase')
      .to(UpdatePermissionsUsecase);

    const appStartRepository =
      bootstrap.di.get<AppStartRepository>('AppStartRepository');
    const accessControlModel =
      bootstrap.di.get<AccessControlModel>('AccessControlModel');
    const appStart = await appStartRepository.getAppStart();

    accessControlModel.setFeatureFlags(appStart.data.features);
    accessControlModel.setPermissions(appStart.data.permissions);

    log.debug('AccessControlHandler: completed', {
      prefix: 'bootstrap.handlers',
    });
    return await super.handle(bootstrap);
  }
}
