import { makeAutoObservable } from "mobx";
import { inject, injectable } from "inversify";
import { AccessControlModel } from "../../models";

@injectable()
export class GetPermissionUsecase {

  constructor(
    @inject('AccessControlModel')
    private accessControlModel: AccessControlModel,
  ) {
    makeAutoObservable(this);
  }

  execute(key: string): boolean {
    return this.accessControlModel.getPermission(key);
  }

}
