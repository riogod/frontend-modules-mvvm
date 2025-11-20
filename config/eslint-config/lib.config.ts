import type { ESLintConfig } from './types';
import { baseConfig } from './base.config';
import path from 'path';

/**
 * Конфиг для библиотек (libs)
 * Может включать React поддержку в зависимости от типа библиотеки
 */
export const createLibConfig = (options: {
    react?: boolean;
    tsconfigPath?: string;
    localRules?: ESLintConfig['rules'];
    localOverrides?: ESLintConfig['overrides'];
    localSettings?: ESLintConfig['settings'];
    localIgnorePatterns?: string[];
    localEnv?: ESLintConfig['env'];
} = {}): ESLintConfig => {
    const {
        react = false,
        tsconfigPath,
        localRules,
        localOverrides,
        localSettings,
        localIgnorePatterns,
        localEnv,
    } = options;

    const tsconfig = tsconfigPath || path.join(process.cwd(), 'tsconfig.base.json');

    const config: ESLintConfig = {
        ...baseConfig,
        ignorePatterns: ['!**/*', ...(localIgnorePatterns || [])],
        env: {
            ...localEnv,
        },
        overrides: [
            ...(baseConfig.overrides || []),
            {
                parserOptions: {
                    ecmaVersion: 'latest',
                    sourceType: 'module',
                    project: [tsconfig],
                },
                files: ['*.ts', '*.tsx', '*.js', '*.jsx'],
                rules: {
                    '@typescript-eslint/no-for-in-array': 'off',
                    '@typescript-eslint/ban-ts-comment': 'off',
                    ...localRules,
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

    if (react) {
        config.extends = [
            ...(baseConfig.extends || []),
            'plugin:react/recommended',
            'plugin:react/jsx-runtime',
        ];
        config.env = {
            browser: true,
            es2022: true,
            ...localEnv,
        };
        config.settings = {
            react: {
                version: 'detect',
            },
            ...localSettings,
        };
    }

    return config;
};

