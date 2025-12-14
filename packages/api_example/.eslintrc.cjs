/* eslint-env node */
const path = require('path');
const { createEslintConfig } = require('@platform/eslint-config');

module.exports = createEslintConfig({
  type: 'module',
  tsconfigPath: path.resolve(__dirname, '../../tsconfig.base.json'),
  // Опционально: путь к локальному конфигу для расширения
  localConfigPath: './.eslintrc.local.cjs',
  rules: {
    'react-hooks/static-components': 'off',
  },
});
