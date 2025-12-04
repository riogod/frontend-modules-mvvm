export default {
  // name игнорируется - используется автоматически из moduleName
  // Federation имя создается как module_${moduleName.replace(/-/g, '_')}
  exposes: {},
  shared: {},
  // Не указываем base - используется автоматически из module.config.js
  remotes: {},
};


