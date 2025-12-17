import { makeAutoObservable } from 'mobx';
import { inject, injectable } from 'inversify';
import { AppParamsModel, AppParamsType } from '../../models';
import { IOC_CORE_TOKENS } from '@platform/core';

@injectable()
export class UpdateParamsUsecase {
  constructor(
    @inject(IOC_CORE_TOKENS.MODEL_ACCESS_CONTROL)
    private appParamsModel: AppParamsModel,
  ) {
    makeAutoObservable(this);
  }

  execute(params: Partial<AppParamsType>): void {
    this.appParamsModel.updateParams(params);
  }
}
