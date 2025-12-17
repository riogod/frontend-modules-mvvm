import { makeAutoObservable } from 'mobx';
import { inject, injectable } from 'inversify';
import { AccessControlModel, AccessControlsType } from '../../models';
import { IOC_CORE_TOKENS } from '@platform/core';

@injectable()
export class SetFeatureFlagsUsecase {
  constructor(
    @inject(IOC_CORE_TOKENS.MODEL_ACCESS_CONTROL)
    private accessControlModel: AccessControlModel,
  ) {
    makeAutoObservable(this);
  }

  execute(flags: Partial<AccessControlsType>): void {
    this.accessControlModel.setFeatureFlags(flags);
  }
}
