import { makeAutoObservable } from "mobx";
import { inject, injectable } from "inversify";
import { AccessControlModel } from "../models/accessControl.model";
import { AppStartRepository } from "../data/app.repository";

@injectable()
export class LoadStartParamUsecase {

  constructor(
    @inject(AccessControlModel)
    private accessControlModel: AccessControlModel,
    @inject(AppStartRepository)
    private appStartRepository: AppStartRepository,

  ) {
    makeAutoObservable(this);
  }

  async execute(): Promise<void> {
    const appStart = await this.appStartRepository.getAppStart();

    this.accessControlModel.setFeatureFlags(appStart.data.features);
    this.accessControlModel.setPermissions(appStart.data.permissions);
  }

}
