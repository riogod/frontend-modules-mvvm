/* eslint-env node */
const { createEslintConfig } = require('@platform/eslint-config');
const path = require('path');

module.exports = createEslintConfig({
  type: 'lib',
  react: false,
  tsconfigPath: path.join(__dirname, 'tsconfig.json'),
  ignorePatterns: ['.eslintrc.cjs', '.eslintrc.local.js'],
});
