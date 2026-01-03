import { makeAutoObservable } from 'mobx';
import { inject, injectable } from 'inversify';
import { AppModel } from '../models/app.model';
import { IOC_CORE_TOKENS } from '@platform/core';
import { type LoadingPhase } from '../models/app.interface';

@injectable()
export class AppSettingsViewModel {
  get notification() {
    return this.appModel.notification;
  }

  get loadingPhase() {
    return this.appModel.loadingPhase;
  }

  setLoadingPhase(phase: LoadingPhase) {
    this.appModel.loadingPhase = phase;
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
