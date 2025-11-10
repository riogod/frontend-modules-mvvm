import { makeAutoObservable } from "mobx";
import { inject, injectable } from "inversify";
import { AccessControlModel } from "../../models/accessControl.model";

@injectable()
export class RemovePermissionsUsecase {

  constructor(
    @inject(AccessControlModel)
    private accessControlModel: AccessControlModel,
  ) {
    makeAutoObservable(this);
  }

  execute(key: string): void {
    this.accessControlModel.removePermission(key);
  }

}
