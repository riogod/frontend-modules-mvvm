import { makeAutoObservable } from "mobx";
import { inject, injectable } from "inversify";
import { AccessControlModel, AccessControlsType } from "../../models";

@injectable()
export class UpdatePermissionsUsecase {

  constructor(
    @inject('AccessControlModel')
    private accessControlModel: AccessControlModel,
  ) {
    makeAutoObservable(this);
  }

  execute(permissions: Partial<AccessControlsType>): void {
    this.accessControlModel.updatePermissions(permissions);
  }

}
