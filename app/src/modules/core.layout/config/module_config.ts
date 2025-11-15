import { ModuleConfig } from '../../../bootstrap/interface.ts';
import ru_common from './i18n/ru_common.json';
import en_common from './i18n/en_common.json';


export default {
  I18N: (i18n) => {
    i18n.addResourceBundle('ru', 'common', ru_common);
    i18n.addResourceBundle('en', 'common', en_common);
  },
} as ModuleConfig;
