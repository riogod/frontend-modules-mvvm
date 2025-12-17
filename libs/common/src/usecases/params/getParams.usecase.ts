import { makeAutoObservable } from 'mobx';
import { inject, injectable } from 'inversify';
import { AppParamsModel } from '../../models';
import { IOC_CORE_TOKENS } from '@platform/core';

@injectable()
export class GetParamsUsecase {
  constructor(
    @inject(IOC_CORE_TOKENS.MODEL_ACCESS_CONTROL)
    private appParamsModel: AppParamsModel,
  ) {
    makeAutoObservable(this);
  }

  execute<T = unknown>(keys: string[]): Record<string, T | undefined> {
    return this.appParamsModel.getParamsByKeys<T>(keys);
  }
}
