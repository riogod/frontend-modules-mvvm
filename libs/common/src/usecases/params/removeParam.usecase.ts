import { makeAutoObservable } from 'mobx';
import { inject, injectable } from 'inversify';
import { AppParamsModel } from '../../models';
import { IOC_CORE_TOKENS } from '@platform/core';

@injectable()
export class RemoveParamUsecase {
  constructor(
    @inject(IOC_CORE_TOKENS.MODEL_ACCESS_CONTROL)
    private appParamsModel: AppParamsModel,
  ) {
    makeAutoObservable(this);
  }

  execute(key: string): void {
    this.appParamsModel.removeParam(key);
  }
}
