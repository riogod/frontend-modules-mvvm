import { ModuleConfig } from '../../../bootstrap/interface.ts';
import { routes } from './routes.ts';
import { HttpErrorHandler } from './http_errors.ts';
import ru_common from './i18n/ru_common.json';
import en_common from './i18n/en_common.json';
import { SetFeatureFlagsUsecase } from '../usecases/featureFlag/setFeatureFlags.usecase.ts';
import { SetPermissionsUsecase } from '../usecases/permission/setPermissions.usecase.ts';

export default {
  ROUTES: () => routes,
  onModuleInit: (bootstrap) => {

    HttpErrorHandler(bootstrap)

    bootstrap.di.get(SetFeatureFlagsUsecase).execute({
      'api.module.load.feature': true,
    });

    bootstrap.di.get(SetPermissionsUsecase).execute({
      'api.module.load.permission': true,
    });


  },
  I18N: (i18n) => {
    i18n.addResourceBundle('ru', 'common', ru_common);
    i18n.addResourceBundle('en', 'common', en_common);
  },
} as ModuleConfig;
