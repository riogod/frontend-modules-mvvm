import { type Module, ModuleLoadType } from './interface';
import CoreConfig from './core/config/module_config';
import CoreLayoutConfig from './core.layout/config/module_config';
import LocalModuleConfig from './local-normal/config/module_config';

export const app_modules: Module[] = [
  {
    name: 'core',
    description: 'Core module - Отвечает за базовые функции',
    config: CoreConfig,
    loadType: ModuleLoadType.INIT,
    loadPriority: 0,
  },
  {
    name: 'core.layout',
    description:
      'Core layout module - Содержит основной макет приложения и отвечает за базовые функции',
    config: CoreLayoutConfig,
    loadType: ModuleLoadType.INIT,
    loadPriority: 2,
  },
  {
    name: 'local-module',
    description: 'Local module - Содержит локальные данные',
    config: LocalModuleConfig,
    loadType: ModuleLoadType.NORMAL,
    loadPriority: 3,
    loadCondition: {
      featureFlags: ['local-normal.load.feature'],
      accessPermissions: ['local-normal.load.permission'],
    },
  },
];
