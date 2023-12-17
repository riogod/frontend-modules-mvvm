import { makeAutoObservable } from "mobx";
import { inject, injectable } from "inversify";
import { AppModel } from "../models/app.model.ts";

@injectable()
export class AppSettingsViewModel {
  get notification() {
    return this.appModel.notification;
  }
  constructor(
    @inject(AppModel)
    private appModel: AppModel,
  ) {
    makeAutoObservable(this);
  }

  clearNotification() {
    this.appModel.notification = "";
  }
}
