import { Module, ModuleLoadType } from "./interface";
import CoreConfig from "./_init_modules/core/config/module_config";
import TodoConfig from "./todo/config/module_config";
import ApiConfig from "./api_example/config/module_config";

export const app_modules: Module[] = [
  {
    name: "core",
    description:
      "Core module - Содержит основной макет приложения и отвечает за базовые функции",
    config: CoreConfig,
    loadType: ModuleLoadType.INIT,
    loadPriority: 0,
  },
  {
    name: "todo",
    description: "Todo module - Показывает пример работы с моделью Todo",
    config: TodoConfig,
    loadType: ModuleLoadType.LAZY,
    loadPriority: 2,
  },
  {
    name: "api",
    description:
      "API example module - Показывает пример реализации работы с API",
    config: ApiConfig,
    loadType: ModuleLoadType.LAZY,
    loadPriority: 3,
    loadCondition: {
      dependencies: ['core'],
      featureFlags: ['api.module.load.feature'],
      accessPermissions: ['api.module.load.permission'],
    },
  },
];
