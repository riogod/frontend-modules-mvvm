import { type ModuleConfig } from '@platform/core';
import { routes } from './routes';

import en_local_normal from './i18n/en_local-normal.json';
import ru_local_normal from './i18n/ru_local-normal.json';
import { log } from '@platform/core';
import { DI_CONFIG } from './di.config';
import { handlers } from './mocks';

export default {
  ROUTES: () => routes,
  onModuleInit: (bootstrap) => {
    DI_CONFIG(bootstrap.di);
    log.debug('initialized', { prefix: 'module.local-normal' });
  },
  I18N: (i18n) => {
    i18n.addResourceBundle('en', 'local-normal', en_local_normal);
    i18n.addResourceBundle('ru', 'local-normal', ru_local_normal);
  },
  mockHandlers: handlers,
} as ModuleConfig;
