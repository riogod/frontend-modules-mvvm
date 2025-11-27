import { type AxiosError, IOC_CORE_TOKENS } from '@platform/core';
import { type Bootstrap } from '../../../bootstrap/index.ts';
import type { AppModel } from '../models/app.model.ts';

type TCallbacks = (error: AxiosError) => void;

export const HttpErrorHandler = (bootstrap: Bootstrap) => {
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
