import { makeAutoObservable } from "mobx";
import { inject, injectable } from "inversify";
import { AccessControlModel, AccessControlsType } from "../../models";


@injectable()
export class SetFeatureFlagsUsecase {

  constructor(
    @inject('AccessControlModel')
    private accessControlModel: AccessControlModel,
  ) {
    makeAutoObservable(this);
  }

  execute(flags: Partial<AccessControlsType>): void {
    this.accessControlModel.setFeatureFlags(flags);
  }

}
