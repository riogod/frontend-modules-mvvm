import { type Module, ModuleLoadType } from './interface';
import CoreConfig from './core/config/module_config';
// import TodoConfig from '@platform/module-todo/config/module_config';
import CoreLayoutConfig from './core.layout/config/module_config';

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
];
