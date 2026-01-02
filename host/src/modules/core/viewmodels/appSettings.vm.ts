import { makeAutoObservable } from 'mobx';
import { inject, injectable } from 'inversify';
import { AppModel } from '../models/app.model';
import { IOC_CORE_TOKENS } from '@platform/core';

@injectable()
export class AppSettingsViewModel {
  get notification() {
    return this.appModel.notification;
  }

  get isAppStarted() {
    return this.appModel.isAppStarted;
  }

  get isBootstrapped() {
    return this.appModel.isBootstrapped;
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
