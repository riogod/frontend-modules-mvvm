/* eslint-env node */
const { createEslintConfig } = require('@todo/eslint-config');

module.exports = createEslintConfig({
  type: 'app',
  tsconfigPath: './tsconfig.base.json',
  // Опционально: путь к локальному конфигу для расширения
  localConfigPath: './.eslintrc.local.js',
});

