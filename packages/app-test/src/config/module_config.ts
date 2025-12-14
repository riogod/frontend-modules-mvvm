import { type ModuleConfig } from '@platform/core';
import { routes } from './routes';

import en_app_test from './i18n/en_app-test.json';
import ru_app_test from './i18n/ru_app-test.json';
import { log } from '@platform/core';
import { DI_CONFIG } from './di.config';

export default {
  ROUTES: () => routes,
  onModuleInit: (bootstrap) => {
    DI_CONFIG(bootstrap.di);
    log.debug('initialized', { prefix: 'module.app-test' });
  },
  I18N: (i18n) => {
    i18n.addResourceBundle('en', 'app-test', en_app_test);
    i18n.addResourceBundle('ru', 'app-test', ru_app_test);
  },
  // Данные для dev/server и манифеста (используются ManifestBuilder и dev-server)
  mockModuleInfo: {
    name: 'app-test',
    loadType: 'normal',
    loadPriority: 1,
    remoteEntry: '',
    dependencies: [],
    featureFlags: ['app-test.module.load.feature'],
    accessPermissions: ['app-test.module.load.permission'],
  },
  mockModuleData: {
    features: {
      'app-test.module.load.feature': true,
    },
    permissions: {
      'app-test.module.load.permission': true,
    },
    params: {
      'app-test.module.load.param': 'SomeValue',
    },
  },
} as ModuleConfig;

