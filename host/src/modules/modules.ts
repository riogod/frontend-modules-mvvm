import { type Module, ModuleLoadType } from "./interface.ts";
import CoreConfig from "./core/config/module_config";
import TodoConfig from "./todo/config/module_config";
import CoreLayoutConfig from "./core.layout/config/module_config";


export const app_modules: Module[] = [
  {
    name: "core",
    description:
      "Core module - Отвечает за базовые функции",
    config: CoreConfig,
    loadType: ModuleLoadType.INIT,
    loadPriority: 0,
  },
  // {
  //   name: "core.access",
  //   description:
  //     "Core access module - Отвечает за доступ к модулям",
  //   config: CoreAccessConfig,
  //   loadType: ModuleLoadType.INIT,
  //   loadPriority: 1,
  // },
  {
    name: "core.layout",
    description:
      "Core layout module - Содержит основной макет приложения и отвечает за базовые функции",
    config: CoreLayoutConfig,
    loadType: ModuleLoadType.INIT,
    loadPriority: 2,
  },
  {
    name: "todo",
    description: "Todo module - Показывает пример работы с моделью Todo",
    config: TodoConfig,
    loadType: ModuleLoadType.NORMAL,
    loadPriority: 1,
  },
  {
    name: "api",
    description:
      "API example module - Показывает пример реализации работы с API",
    // Динамический импорт конфига - модуль будет вынесен в отдельный чанк
    config: import('./api_example/config/module_config').then(m => m.default),
    loadType: ModuleLoadType.NORMAL,
    loadPriority: 2,
    loadCondition: {
      dependencies: ['core', 'todo'],
      featureFlags: ['api.module.load.feature'],
      accessPermissions: ['api.module.load.permission'],
    },
  },
];
