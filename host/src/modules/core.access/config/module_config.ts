import { type ModuleConfig } from '../../../bootstrap/interface.ts';
import { LoadStartParamUsecase } from '../usecases/loadStartParam.usecase';
import { handlers } from './mocks';
import { log } from '@todo/core';

export default {
  onModuleInit: async (bootstrap) => {
    await bootstrap.di.get(LoadStartParamUsecase).execute();
    log.debug('initialized', { prefix: 'module.core.access' });
  },
  mockHandlers: handlers,
} as ModuleConfig;
