import { makeAutoObservable } from "mobx";
import { inject, injectable } from "inversify";
import { AppModel } from "../models/app.model.ts";
import { ThemeMode } from "../models/app.interface.ts";

@injectable()
export class UiSettingsViewModel {
  get themeMode() {
    return this.appModel.appThemeMode;
  }

  get colorModeSettings() {
    return this.appModel.colorModeSettings;
  }

  constructor(
    @inject(AppModel)
    private appModel: AppModel,
  ) {
    makeAutoObservable(this);
  }

  setThemeMode(themeMode: ThemeMode) {
    this.appModel.appThemeMode = themeMode === "system" ? undefined : themeMode;
  }
}
