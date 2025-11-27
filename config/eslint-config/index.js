const path = require('path');
const fs = require('fs');

/**
 * Загружает локальный конфиг если он существует
 */
function loadLocalConfig(localConfigPath) {
  if (!localConfigPath) {
    return null;
  }

  const resolvedPath = path.resolve(localConfigPath);

  if (!fs.existsSync(resolvedPath)) {
    return null;
  }

  try {
    // Поддерживаем как .js/.mjs, так и .json файлы
    if (resolvedPath.endsWith('.json')) {
      const content = fs.readFileSync(resolvedPath, 'utf-8');
      return JSON.parse(content);
    } else {
      // Для .js/.mjs файлов используем require
      delete require.cache[resolvedPath];
      return require(resolvedPath);
    }
  } catch (error) {
    console.warn(`Failed to load local config from ${resolvedPath}:`, error);
    return null;
  }
}

/**
 * Базовый конфиг для всех TypeScript проектов
 */
const baseConfig = {
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

/**
 * Создает конфиг для приложений (host)
 */
function createHostConfig(options = {}) {
  const {
    tsconfigPath,
    localRules = {},
    localOverrides = [],
    localSettings = {},
    localIgnorePatterns = [],
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
    ignorePatterns: ['!**/*', ...localIgnorePatterns],
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
      ...localOverrides,
    ],
  };
}

/**
 * Создает конфиг для библиотек (libs)
 */
function createLibConfig(options = {}) {
  const {
    react = false,
    tsconfigPath,
    localRules = {},
    localOverrides = [],
    localSettings = {},
    localIgnorePatterns = [],
    localEnv = {},
  } = options;

  const tsconfig =
    tsconfigPath || path.join(process.cwd(), 'tsconfig.base.json');

  const config = {
    ...baseConfig,
    ignorePatterns: ['!**/*', ...localIgnorePatterns],
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
          '@typescript-eslint/no-unsafe-return': 'off',
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
      ...localOverrides,
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
}

/**
 * Фабрика для создания ESLint конфигураций
 * Поддерживает расширение локальными конфигами
 */
function createEslintConfig(options) {
  const { type, localConfigPath, ...restOptions } = options;

  // Загружаем локальный конфиг если он существует
  const localConfig = loadLocalConfig(localConfigPath);

  // Объединяем опции с локальным конфигом
  const mergedOptions = localConfig
    ? {
        ...restOptions,
        rules: { ...restOptions.rules, ...localConfig.rules },
        overrides: [
          ...(restOptions.overrides || []),
          ...(localConfig.overrides || []),
        ],
        settings: { ...restOptions.settings, ...localConfig.settings },
        env: { ...restOptions.env, ...localConfig.env },
        ignorePatterns: [
          ...(restOptions.ignorePatterns || []),
          ...(localConfig.ignorePatterns || []),
        ],
        react: localConfig.react ?? restOptions.react,
        tsconfigPath: localConfig.tsconfigPath || restOptions.tsconfigPath,
      }
    : restOptions;

  // Создаем базовый конфиг в зависимости от типа
  let base;

  switch (type) {
    case 'host':
      base = createHostConfig({
        tsconfigPath:
          typeof mergedOptions.tsconfigPath === 'string'
            ? mergedOptions.tsconfigPath
            : mergedOptions.tsconfigPath?.[0],
        localRules: mergedOptions.rules,
        localOverrides: mergedOptions.overrides,
        localSettings: mergedOptions.settings,
        localIgnorePatterns: mergedOptions.ignorePatterns,
      });
      break;

    case 'lib':
      base = createLibConfig({
        react: mergedOptions.react,
        tsconfigPath:
          typeof mergedOptions.tsconfigPath === 'string'
            ? mergedOptions.tsconfigPath
            : mergedOptions.tsconfigPath?.[0],
        localRules: mergedOptions.rules,
        localOverrides: mergedOptions.overrides,
        localSettings: mergedOptions.settings,
        localIgnorePatterns: mergedOptions.ignorePatterns,
        localEnv: mergedOptions.env,
      });
      break;

    case 'base':
    default:
      base = { ...baseConfig };
      if (mergedOptions.rules) {
        base.rules = { ...base.rules, ...mergedOptions.rules };
      }
      if (mergedOptions.overrides) {
        base.overrides = [
          ...(base.overrides || []),
          ...mergedOptions.overrides,
        ];
      }
      if (mergedOptions.settings) {
        base.settings = { ...mergedOptions.settings };
      }
      if (mergedOptions.env) {
        base.env = { ...mergedOptions.env };
      }
      if (mergedOptions.ignorePatterns) {
        base.ignorePatterns = [
          ...(base.ignorePatterns || []),
          ...mergedOptions.ignorePatterns,
        ];
      }
      break;
  }

  return base;
}

module.exports = {
  baseConfig,
  createHostConfig,
  createLibConfig,
  createEslintConfig,
};
