/* eslint-env node */
const { createEslintConfig } = require('./createEslintConfig');
const path = require('path');

module.exports = createEslintConfig({
  type: 'lib',
  react: false,
  tsconfigPath: path.join(__dirname, 'tsconfig.json'),
});

