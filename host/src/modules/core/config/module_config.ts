import { type ModuleConfig } from '@platform/core';
import { routes } from './routes';
import { HttpErrorHandler } from './http_errors';
import { log } from '@platform/core';
import { DI_CONFIG } from './di.config';

export default {
  ROUTES: () => routes,
  onModuleInit: (bootstrap) => {
    DI_CONFIG(bootstrap.di);
    HttpErrorHandler(bootstrap);
    log.debug('initialized', { prefix: 'module.core' });
  },
} as ModuleConfig;
