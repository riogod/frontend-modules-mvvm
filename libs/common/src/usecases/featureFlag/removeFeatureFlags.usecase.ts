import { makeAutoObservable } from 'mobx';
import { inject, injectable } from 'inversify';
import { AccessControlModel } from '../../models';
import { IOC_CORE_TOKENS } from '@platform/core';

@injectable()
export class RemoveFeatureFlagsUsecase {
  constructor(
    @inject(IOC_CORE_TOKENS.MODEL_ACCESS_CONTROL)
    private accessControlModel: AccessControlModel,
  ) {
    makeAutoObservable(this);
  }

  execute(key: string): void {
    this.accessControlModel.removeFeatureFlag(key);
  }
}
