/**
 * Локальная конфигурация Module Federation для doc-platform модуля
 */
export default {
  // name игнорируется - используется автоматически из moduleName
  // Federation имя создается как moduleName (плагин добавляет префикс 'module_')
  exposes: {},
  shared: {},
  // base автоматический из module.config.js: /modules/${moduleName}/latest/
  remotes: {},
};

