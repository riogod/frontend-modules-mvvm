import { ModuleConfig } from "../../../interface.ts";

/**
 * Динамически загружает конфигурацию модуля
 * Vite автоматически создаст отдельный chunk для динамических импортов
 *
 * @param {string} path - Путь к конфигурации модуля относительно корня проекта (app).
 * @return {Promise<ModuleConfig>} - Promise с конфигурацией модуля.
 */
export function loadLazyModuleConfig(path: string): Promise<ModuleConfig> {
  // Преобразуем относительный путь в абсолютный от корня проекта
  // Если путь начинается с '../', заменяем на '/src/'
  const absolutePath = path.startsWith('../')
    ? path.replace('../', '/src/')
    : path.startsWith('./')
      ? path.replace('./', '/src/')
      : path.startsWith('/')
        ? path
        : `/src/${path}`;

  return import(/* @vite-ignore */ absolutePath).then((module) => module.default as ModuleConfig);
}