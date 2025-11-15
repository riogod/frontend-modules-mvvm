import { ModuleConfig } from '../../../bootstrap/interface.ts';
import { routes } from './routes.ts';
import { HttpErrorHandler } from './http_errors.ts';

export default {
  ROUTES: () => routes,
  onModuleInit: (bootstrap) => HttpErrorHandler(bootstrap),
} as ModuleConfig;
