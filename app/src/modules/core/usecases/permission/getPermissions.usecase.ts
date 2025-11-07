import { makeAutoObservable } from "mobx";
import { inject, injectable } from "inversify";
import { AccessControlModel } from "../../models/accessControl.model";

@injectable()
export class GetPermissionsUsecase {

  constructor(
    @inject(AccessControlModel)
    private accessControlModel: AccessControlModel,
  ) {
    makeAutoObservable(this);
  }

  execute<T extends Record<string, string | number>>(enumParam: T): Record<keyof T, boolean> {
    return this.accessControlModel.getPermissions(enumParam);
  }

}
