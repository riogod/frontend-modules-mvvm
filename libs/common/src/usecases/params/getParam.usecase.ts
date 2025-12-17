import { makeAutoObservable } from 'mobx';
import { inject, injectable } from 'inversify';
import { IOC_CORE_TOKENS } from '@platform/core';
import { AppParamsModel } from '../../models';

@injectable()
export class GetParamUsecase {
  constructor(
    @inject(IOC_CORE_TOKENS.MODEL_APP_PARAMS)
    private appParamsModel: AppParamsModel,
  ) {
    makeAutoObservable(this);
  }

  execute<T = unknown>(key: string): T | undefined {
    return this.appParamsModel.getParamTyped<T>(key);
  }
}
