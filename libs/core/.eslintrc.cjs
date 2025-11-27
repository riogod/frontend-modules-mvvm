/* eslint-env node */
const { createEslintConfig } = require('@platform/eslint-config');

module.exports = createEslintConfig({
  type: 'lib',
  react: false,
  tsconfigPath: './tsconfig.base.json',
  ignorePatterns: ['.eslintrc.cjs', '.eslintrc.local.js'],
  // Опционально: путь к локальному конфигу для расширения
  localConfigPath: './.eslintrc.local.js',
});
