import { makeAutoObservable } from 'mobx';
import { inject, injectable } from 'inversify';
import { IOC_CORE_TOKENS } from '@platform/core';
import { AccessControlModel } from '../../models';

@injectable()
export class GetPermissionsUsecase {
  constructor(
    @inject(IOC_CORE_TOKENS.MODEL_ACCESS_CONTROL)
    private accessControlModel: AccessControlModel,
  ) {
    makeAutoObservable(this);
  }

  execute<T extends Record<string, string | number>>(
    enumParam: T,
  ): Record<keyof T, boolean> {
    return this.accessControlModel.getPermissions(enumParam);
  }
}
