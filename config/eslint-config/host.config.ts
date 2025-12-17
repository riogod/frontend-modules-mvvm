import type { ESLintConfig } from './types';
import { baseConfig } from './base.config';
import path from 'path';

/**
 * Конфиг для приложений (host)
 * Включает React поддержку и специфичные правила для приложений
 */
export const createHostConfig = (
  options: {
    tsconfigPath?: string;
    localRules?: ESLintConfig['rules'];
    localOverrides?: ESLintConfig['overrides'];
    localSettings?: ESLintConfig['settings'];
    localIgnorePatterns?: string[];
  } = {},
): ESLintConfig => {
  const {
    tsconfigPath,
    localRules,
    localOverrides,
    localSettings,
    localIgnorePatterns,
  } = options;

  const tsconfig =
    tsconfigPath || path.join(process.cwd(), 'tsconfig.base.json');

  return {
    ...baseConfig,
    extends: [
      ...(baseConfig.extends || []),
      'plugin:react/recommended',
      'plugin:react/jsx-runtime',
    ],
    ignorePatterns: ['!**/*', ...(localIgnorePatterns || [])],
    env: {
      browser: true,
      es2022: true,
    },
    settings: {
      react: {
        version: 'detect',
      },
      ...localSettings,
    },
    overrides: [
      ...(baseConfig.overrides || []),
      {
        parserOptions: {
          ecmaVersion: 'latest',
          sourceType: 'module',
          project: [tsconfig],
        },
        files: ['*.ts', '*.tsx', '*.mts', '*.mjs', '*.js', '*.jsx'],
        rules: {
          '@typescript-eslint/no-for-in-array': 'off',
          '@typescript-eslint/ban-ts-comment': 'off',
          'no-restricted-imports': [
            'error',
            {
              paths: [
                {
                  name: '@mui/material',
                  message:
                    'Direct imports from @mui/material are not allowed. Use @platform/ui instead for tree shaking support.',
                },
                {
                  name: '@mui/icons-material',
                  message:
                    'Direct imports from @mui/icons-material are not allowed. Use @platform/ui instead for tree shaking support.',
                },
              ],
              patterns: [
                {
                  group: ['@mui/material/*'],
                  message:
                    'Direct imports from @mui/material/* are not allowed. Use @platform/ui instead for tree shaking support.',
                },
                {
                  group: ['@mui/icons-material/*'],
                  message:
                    'Direct imports from @mui/icons-material/* are not allowed. Use @platform/ui instead for tree shaking support.',
                },
                {
                  group: ['@host/modules/*/!(interface|types)'],
                  message:
                    'Direct imports from other modules are not allowed. Only types and interfaces can be imported.',
                },
                {
                  group: [
                    '../modules/*/!(interface|types)',
                    '../../modules/*/!(interface|types)',
                    '../../../modules/*/!(interface|types)',
                  ],
                  message:
                    'Relative imports from other modules are not allowed. Only types and interfaces can be imported.',
                },
              ],
            },
          ],
          ...localRules,
        },
      },
      {
        files: ['src/modules/**/*.{ts,tsx,js,jsx}'],
        rules: {
          'no-restricted-imports': [
            'error',
            {
              patterns: [
                {
                  group: ['@host/modules/*/!(interface|types)'],
                  message:
                    'Direct imports from other modules are not allowed. Only types and interfaces can be imported.',
                },
                {
                  group: ['../../*/**/!(*.interface|*.types).{ts,tsx}'],
                  message:
                    'Relative imports from other modules are not allowed. Only interfaces and types can be imported.',
                },
              ],
            },
          ],
        },
      },
      {
        parserOptions: {
          ecmaVersion: 'latest',
          sourceType: 'module',
          project: [tsconfig],
        },
        files: [
          'src/**/*.test.ts',
          'src/**/*.spec.ts',
          'src/**/*.test.tsx',
          'src/**/*.spec.tsx',
          'src/**/*.test.js',
          'src/**/*.spec.js',
          'src/**/*.test.jsx',
          'src/**/*.spec.jsx',
        ],
        rules: {
          '@typescript-eslint/ban-ts-comment': 'off',
          '@typescript-eslint/no-explicit-any': 'off',
          '@typescript-eslint/no-unused-vars': 'off',
          '@typescript-eslint/no-unsafe-assignment': 'off',
          '@typescript-eslint/unbound-method': 'off',
          '@typescript-eslint/require-await': 'off',
          'no-global-assign': 'off',
          '@typescript-eslint/no-unsafe-argument': 'off',
          '@typescript-eslint/no-unsafe-member-access': 'off',
          '@typescript-eslint/no-unsafe-call': 'off',
          'no-native-reassign': 'off',
        },
      },
      ...(localOverrides || []),
    ],
  };
};
