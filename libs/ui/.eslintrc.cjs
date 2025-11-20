/* eslint-env node */
const { createEslintConfig } = require('@todo/eslint-config');

module.exports = createEslintConfig({
  type: 'lib',
  react: true,
  tsconfigPath: './libs/ui/tsconfig.eslint.json',
  ignorePatterns: [
    'node_modules',
    'storybook-static/**/*',
    '.cache/**/*',
    'coverage/**/*',
    'dist/**/*',
  ],
  // Опционально: путь к локальному конфигу для расширения
  localConfigPath: './.eslintrc.local.js',
});

