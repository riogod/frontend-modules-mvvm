import { type ModuleConfig } from '../../../bootstrap/interface.ts';
import { routes } from './routes.ts';
import { HttpErrorHandler } from './http_errors.ts';
import { log } from '@platform/core';
import { DI_CONFIG } from './di.config.ts';

export default {
  ROUTES: () => routes,
  onModuleInit: (bootstrap) => {
    DI_CONFIG(bootstrap.di);
    HttpErrorHandler(bootstrap);
    log.debug('initialized', { prefix: 'module.core' });
  },
} as ModuleConfig;
