import { Module } from "./interface";
import CoreConfig from "./core/config/module_config";
import TodoConfig from "./todo/config/module_config";
import ApiConfig from "./api_example/config/module_config";

export const app_modules: Module[] = [
  {
    name: "core",
    description:
      "Core module - Содержит основной макет приложения и отвечает за базовые функции",
    path: "core",
    config: CoreConfig,
  },
  {
    name: "todo",
    path: "todo",
    description: "Todo module - Показывает пример работы с моделью Todo",
    config: TodoConfig,
  },
  {
    name: "api",
    description:
      "API example module - Показывает пример реализации работы с API",
    path: "api_example",
    config: ApiConfig,
  },
];
