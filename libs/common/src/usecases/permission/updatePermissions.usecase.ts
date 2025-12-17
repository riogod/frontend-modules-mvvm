import { makeAutoObservable } from 'mobx';
import { inject, injectable } from 'inversify';
import { IOC_CORE_TOKENS } from '@platform/core';
import { AccessControlModel, AccessControlsType } from '../../models';

@injectable()
export class UpdatePermissionsUsecase {
  constructor(
    @inject(IOC_CORE_TOKENS.MODEL_ACCESS_CONTROL)
    private accessControlModel: AccessControlModel,
  ) {
    makeAutoObservable(this);
  }

  execute(permissions: Partial<AccessControlsType>): void {
    this.accessControlModel.updatePermissions(permissions);
  }
}
