import {
  type AxiosError,
  IOC_CORE_TOKENS,
  type IBootstrap,
} from '@platform/core';
import type { AppModel } from '../models/app.model';

type TCallbacks = (error: AxiosError) => void;

export const HttpErrorHandler = (bootstrap: IBootstrap) => {
  const appModel = bootstrap.di.get<AppModel>(IOC_CORE_TOKENS.MODEL_APP);

  const errorMap: Record<string, TCallbacks> = {
    '500': () => {
      appModel.notification = 'Service error: 500!';
    },
    '401': (err) => {
      throw err;
    },
  };

  for (const [errorNum, callback] of Object.entries(errorMap)) {
    bootstrap.getAPIClient.addErrorCb(errorNum, callback);
  }
};
