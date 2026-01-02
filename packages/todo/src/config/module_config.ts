import { type ModuleConfig } from '@platform/core';
import { routes } from './routes';

import en_todo from './i18n/en_todo.json';
import ru_todo from './i18n/ru_todo.json';
import { log } from '@platform/core';
import { DI_CONFIG } from './di.config';

export default {
  ROUTES: () => routes,
  onModuleInit: (bootstrap) => {
    DI_CONFIG(bootstrap.di);
    log.debug('initialized', { prefix: 'module.todo' });
  },
  I18N: (i18n) => {
    i18n.addResourceBundle('en', 'todo', en_todo);
    i18n.addResourceBundle('ru', 'todo', ru_todo);
  },
  mockModuleInfo: {
    name: 'todo',
    loadType: 'normal',
    loadPriority: 1,
    remoteEntry: '',
    dependencies: [],
    featureFlags: ['todo.module.load.feature'],
    accessPermissions: ['todo.module.load.permission'],
  },
  mockModuleData: {
    features: {
      'todo.module.load.feature': true,
    },
    permissions: {
      'todo.module.load.permission': true,
    },
    params: {
      'todo.module.load.param': 'SomeValue',
    },
  },
} as ModuleConfig;
