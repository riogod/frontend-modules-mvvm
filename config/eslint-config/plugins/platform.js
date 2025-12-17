const noGlobalCss = require('../rules/no-global-css');

// ESLint плагин должен экспортировать объект с правилами
// Для использования в legacy формате через массив строк
// плагин должен быть доступен как модуль
module.exports = {
  meta: {
    name: 'platform',
    version: '1.0.0',
  },
  rules: {
    'no-global-css': noGlobalCss,
  },
};
