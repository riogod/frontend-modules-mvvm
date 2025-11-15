import { ModuleConfig } from '../../../bootstrap/interface.ts';

import { SetFeatureFlagsUsecase } from '../usecases/featureFlag/setFeatureFlags.usecase.ts';
import { SetPermissionsUsecase } from '../usecases/permission/setPermissions.usecase.ts';

export default {
  onModuleInit: (bootstrap) => {

    
    bootstrap.di.get(SetFeatureFlagsUsecase).execute({
      'api.module.load.feature': true,
    });

    bootstrap.di.get(SetPermissionsUsecase).execute({
      'api.module.load.permission': true,
    });


  },
} as ModuleConfig;
