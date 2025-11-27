import { makeAutoObservable } from 'mobx';
import { inject, injectable } from 'inversify';
import { AppModel } from '../models/app.model.ts';
import { IOC_CORE_TOKENS } from '@platform/core';

@injectable()
export class AppSettingsViewModel {
  get notification() {
    return this.appModel.notification;
  }
  constructor(
    @inject(IOC_CORE_TOKENS.MODEL_APP)
    private appModel: AppModel,
  ) {
    makeAutoObservable(this);
  }

  clearNotification() {
    this.appModel.notification = '';
  }
}
