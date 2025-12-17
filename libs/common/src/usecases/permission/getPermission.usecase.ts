import { makeAutoObservable } from 'mobx';
import { inject, injectable } from 'inversify';
import { IOC_CORE_TOKENS } from '@platform/core';
import { AccessControlModel } from '../../models';

@injectable()
export class GetPermissionUsecase {
  constructor(
    @inject(IOC_CORE_TOKENS.MODEL_ACCESS_CONTROL)
    private accessControlModel: AccessControlModel,
  ) {
    makeAutoObservable(this);
  }

  execute(key: string): boolean {
    return this.accessControlModel.getPermission(key);
  }
}
