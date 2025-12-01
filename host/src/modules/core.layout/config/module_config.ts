import { type ModuleConfig } from '../../../bootstrap/interface';
import ru_common from './i18n/ru_common.json';
import en_common from './i18n/en_common.json';
import { log } from '@platform/core';

export default {
  onModuleInit: () => {
    log.debug('initialized', { prefix: 'module.core.layout' });
  },
  I18N: (i18n) => {
    i18n.addResourceBundle('ru', 'common', ru_common);
    i18n.addResourceBundle('en', 'common', en_common);
  },
} as ModuleConfig;
