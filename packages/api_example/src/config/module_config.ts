import { type ModuleConfig } from '@platform/core';
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
  mockModuleInfo: {
    name: 'api_example',
    version: '1.0.0',
    loadType: 'normal',
    loadPriority: 2,
    remoteEntry: '',
    dependencies: [],
    featureFlags: ['api.module.load.feature'],
    accessPermissions: ['api.module.load.permission'],
  },
  mockModuleData: {
    features: {
      'api.module.load.feature': true,
      'api.module.request.feature': true,
    },
    permissions: {
      'api.module.load.permission': true,
      'api.module.request.permission': true,
    },
    params: {
      'api.module.load.param': 'SomeValue',
      'api.module.request.param': 'SomeValue',
    },
  },
} as ModuleConfig;
