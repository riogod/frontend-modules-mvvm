/* eslint-env node */
const { createEslintConfig } = require('@platform/eslint-config');
const path = require('path');

module.exports = createEslintConfig({
  type: 'lib',
  react: true,
  tsconfigPath: path.resolve(__dirname, 'tsconfig.eslint.json'),
  ignorePatterns: [
    'node_modules',
    'storybook-static/**/*',
    '.cache/**/*',
    'coverage/**/*',
    'dist/**/*',
    'src/**/*.stories.tsx',
  ],
  // Опционально: путь к локальному конфигу для расширения
  localConfigPath: './.eslintrc.local.js',
});
