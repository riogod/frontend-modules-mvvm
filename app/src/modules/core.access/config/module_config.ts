import { ModuleConfig } from '../../../bootstrap/interface.ts';

import { LoadStartParamUsecase } from '../usecases/loadStartParam.usecase';
import { handlers } from './mocks';

export default {
  onModuleInit: async (bootstrap) => {

    console.log('onModuleInit: core.access');
    await bootstrap.di.get(LoadStartParamUsecase).execute();


  },
  mockHandlers: handlers,
} as ModuleConfig;
