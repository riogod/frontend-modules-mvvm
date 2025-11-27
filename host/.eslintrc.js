/* eslint-env node */
const { createEslintConfig } = require('@platform/eslint-config');

module.exports = createEslintConfig({
  type: 'host',
  tsconfigPath: './tsconfig.base.json',
  // Опционально: путь к локальному конфигу для расширения
  localConfigPath: './.eslintrc.local.js',
});
