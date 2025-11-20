import { makeAutoObservable } from "mobx";
import { inject, injectable } from "inversify";
import { AccessControlModel } from "../../models/accessControl.model";
import { AccessControlsType } from "../../models/app.interface";

@injectable()
export class UpdatePermissionsUsecase {

  constructor(
    @inject(AccessControlModel)
    private accessControlModel: AccessControlModel,
  ) {
    makeAutoObservable(this);
  }

  execute(permissions: Partial<AccessControlsType>): void {
    this.accessControlModel.updatePermissions(permissions);
  }

}
