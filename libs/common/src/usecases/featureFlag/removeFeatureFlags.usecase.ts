import { makeAutoObservable } from "mobx";
import { inject, injectable } from "inversify";
import { AccessControlModel } from "../../models";


@injectable()
export class RemoveFeatureFlagsUsecase {

  constructor(
    @inject('AccessControlModel')
    private accessControlModel: AccessControlModel,
  ) {
    makeAutoObservable(this);
  }

  execute(key: string): void {
    this.accessControlModel.removeFeatureFlag(key);
  }

}
