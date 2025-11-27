import type { ESLintConfig } from './types';

/**
 * Базовый конфиг для всех TypeScript проектов
 */
export const baseConfig: ESLintConfig = {
  root: true,
  ignorePatterns: ['**/*'],
  plugins: [],
  overrides: [
    {
      files: '*.json',
      parser: 'jsonc-eslint-parser',
      rules: {},
    },
    {
      files: ['*.ts', '*.tsx', '*.mts', '*.mjs', '*.js', '*.jsx'],
      rules: {},
    },
    {
      files: ['*.ts', '*.tsx', '*.mts'],
      extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended',
        'plugin:@typescript-eslint/recommended-requiring-type-checking',
        'plugin:react-hooks/recommended',
      ],
      rules: {
        '@typescript-eslint/no-non-null-assertion': 'off',
        '@typescript-eslint/triple-slash-reference': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-unsafe-assignment': 'off',
        '@typescript-eslint/no-unsafe-call': 'off',
        '@typescript-eslint/no-unsafe-return': 'off',
        '@typescript-eslint/no-empty-interface': 'off',
        '@typescript-eslint/no-inferrable-types': 'off',
        '@typescript-eslint/no-unsafe-member-access': 'off',
        '@typescript-eslint/no-duplicate-enum-values': 'off',
        '@typescript-eslint/no-unsafe-argument': 'off',
        // Требуем использование type для импортов и экспортов типов
        '@typescript-eslint/consistent-type-imports': [
          'error',
          {
            prefer: 'type-imports',
            fixStyle: 'inline-type-imports',
          },
        ],
        '@typescript-eslint/consistent-type-exports': 'error',
      },
    },
    {
      files: ['*.js', '*.jsx'],
      extends: ['eslint:recommended'],
      rules: {},
    },
  ],
};
