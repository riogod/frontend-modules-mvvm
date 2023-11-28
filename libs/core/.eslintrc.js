// @ts-check
/* eslint-env node */

'use strict';

/**
 * An object with ESLint options.
 * @type {import('eslint').Linter.Config}
 */
const options = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    project: './tsconfig.json',
  },
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
  ],
};

module.exports = options;
