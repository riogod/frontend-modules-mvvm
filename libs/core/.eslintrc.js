/* eslint-env node */
const { createEslintConfig } = require('@todo/eslint-config');

module.exports = createEslintConfig({
  type: 'lib',
  react: false,
  tsconfigPath: './tsconfig.base.json',
  // Опционально: путь к локальному конфигу для расширения
  localConfigPath: './.eslintrc.local.js',
});

