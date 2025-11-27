import { type ModuleConfig } from '../../../bootstrap/interface';
import { routes } from './routes';
import en_api from './i18n/en_api.json';
import ru_api from './i18n/ru_api.json';
import { handlers } from './mocks';
import { log } from '@platform/core';
import { DI_CONFIG } from './di.config';

export default {
  ROUTES: () => routes,
  onModuleInit: (bootstrap) => {
    DI_CONFIG(bootstrap.di);
    log.debug('initialized', { prefix: 'module.api' });
  },
  I18N: (i18n) => {
    i18n.addResourceBundle('en', 'api', en_api);
    i18n.addResourceBundle('ru', 'api', ru_api);
  },
  mockHandlers: handlers,
} as ModuleConfig;
