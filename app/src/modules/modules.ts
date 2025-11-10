import { Module, ModuleLoadType } from "./interface.ts";
import { loadLazyModuleConfig } from "../bootstrap/services/moduleLoader/ModuleLoaderHelpers/index.ts";
// Статический импорт только для INIT и NORMAL модулей
import CoreConfig from "./core/config/module_config";

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
    config: loadLazyModuleConfig('../modules/todo/config/module_config'),
    loadType: ModuleLoadType.LAZY,
    loadPriority: 1,
  },
  {
    name: "api",
    description:
      "API example module - Показывает пример реализации работы с API",
    config: loadLazyModuleConfig('../modules/api_example/config/module_config'),
    loadType: ModuleLoadType.LAZY,
    loadPriority: 2,
    loadCondition: {
      dependencies: ['core', 'todo'],
      featureFlags: ['api.module.load.feature'],
      accessPermissions: ['api.module.load.permission'],
    },
  },
];
