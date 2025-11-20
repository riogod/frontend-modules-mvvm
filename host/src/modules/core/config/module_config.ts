import { type ModuleConfig } from '../../../bootstrap/interface.ts';
import { routes } from './routes.ts';
import { HttpErrorHandler } from './http_errors.ts';
import { log } from '@todo/core';

export default {
  ROUTES: () => routes,
  onModuleInit: (bootstrap) => {
    HttpErrorHandler(bootstrap)
    log.debug('initialized', { prefix: 'module.core' });
  },
} as ModuleConfig;
