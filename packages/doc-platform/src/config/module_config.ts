import { type ModuleConfig } from '@platform/core';
import { routes } from './routes';

import en_doc_platform from './i18n/en_doc-platform.json';
import ru_doc_platform from './i18n/ru_doc-platform.json';
import { log } from '@platform/core';
import { DI_CONFIG } from './di.config';

export default {
  ROUTES: () => routes,
  onModuleInit: (bootstrap) => {
    DI_CONFIG(bootstrap.di);
    log.debug('initialized', { prefix: 'module.doc-platform' });
  },
  I18N: (i18n) => {
    i18n.addResourceBundle('en', 'doc-platform', en_doc_platform);
    i18n.addResourceBundle('ru', 'doc-platform', ru_doc_platform);
  },
  // Данные для dev/server и манифеста (используются ManifestBuilder и dev-server)
  mockModuleInfo: {
    name: 'doc-platform',
    loadType: 'normal',
    loadPriority: 1,
    remoteEntry: '',
    dependencies: [],
    featureFlags: ['doc-platform.module.load.feature'],
    accessPermissions: ['doc-platform.module.load.permission'],
  },
  mockModuleData: {
    features: {
      'doc-platform.module.load.feature': true,
    },
    permissions: {
      'doc-platform.module.load.permission': true,
    },
    params: {
      'doc-platform.module.load.param': 'SomeValue',
    },
  },
} as ModuleConfig;

