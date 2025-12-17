/* eslint-env node */
const { createEslintConfig } = require('@platform/eslint-config');
const path = require('path');

module.exports = createEslintConfig({
  type: 'lib',
  react: false,
  tsconfigPath: path.resolve(__dirname, 'tsconfig.lib.json'),
  ignorePatterns: ['.eslintrc.cjs', '.eslintrc.local.js'],
  // Опционально: путь к локальному конфигу для расширения
  localConfigPath: './.eslintrc.local.js',
});
