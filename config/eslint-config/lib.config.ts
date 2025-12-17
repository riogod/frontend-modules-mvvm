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
    
    // Определяем путь к tsconfig.spec.json для тестовых файлов
    // Если tsconfigPath указывает на tsconfig.lib.json, используем tsconfig.spec.json из той же директории
    // Используем resolve для получения абсолютного пути
    const tsconfigSpec = tsconfigPath 
        ? path.resolve(path.dirname(tsconfigPath), 'tsconfig.spec.json')
        : path.resolve(process.cwd(), 'tsconfig.spec.json');

    const config: ESLintConfig = {
        ...baseConfig,
        ignorePatterns: ['!**/*', ...(localIgnorePatterns || [])],
        env: {
            ...localEnv,
        },
        overrides: [
            ...(baseConfig.overrides || []),
            // Сначала обрабатываем тестовые файлы с tsconfig.spec.json
            {
                parserOptions: {
                    ecmaVersion: 'latest',
                    sourceType: 'module',
                    project: [tsconfigSpec],
                },
                files: [
                    '**/*.test.ts',
                    '**/*.spec.ts',
                    '**/*.test.tsx',
                    '**/*.spec.tsx',
                    '**/*.test.js',
                    '**/*.spec.js',
                    '**/*.test.jsx',
                    '**/*.spec.jsx',
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
            // Затем обрабатываем остальные файлы с tsconfig.lib.json
            {
                parserOptions: {
                    ecmaVersion: 'latest',
                    sourceType: 'module',
                    project: [tsconfig],
                },
                files: ['*.ts', '*.tsx', '*.js', '*.jsx'],
                excludedFiles: [
                    '**/*.test.ts',
                    '**/*.spec.ts',
                    '**/*.test.tsx',
                    '**/*.spec.tsx',
                    '**/*.test.js',
                    '**/*.spec.js',
                    '**/*.test.jsx',
                    '**/*.spec.jsx',
                ],
                rules: {
                    '@typescript-eslint/no-for-in-array': 'off',
                    '@typescript-eslint/ban-ts-comment': 'off',
                    '@typescript-eslint/no-unsafe-return': 'off',
                    ...localRules,
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

