# ESLint Configuration Factory

Централизованная фабрика конфигураций ESLint для монорепозитория.

## Преимущества

- ✅ **DRY принцип**: Один источник правды для всех конфигов
- ✅ **Расширяемость**: Легко добавить локальные правила через `.eslintrc.local.js`
- ✅ **Типобезопасность**: TypeScript типы для всех конфигов
- ✅ **Консистентность**: Единые правила для всех проектов

## Использование

### Для приложений (host)

Создайте `.eslintrc.js` в корне приложения:

```javascript
const { createEslintConfig } = require('@todo/eslint-config');

module.exports = createEslintConfig({
  type: 'host',
  tsconfigPath: './tsconfig.base.json',
  // Опционально: путь к локальному конфигу для расширения
  localConfigPath: './.eslintrc.local.js',
});
```

**Особенности конфига для host:**
- Включает React поддержку
- Правила для запрета прямых импортов из `@mui/material` и `@mui/icons-material`
- Правила для ограничения импортов между модулями
- Специальные правила для тестовых файлов

### Для библиотек (libs)

Создайте `.eslintrc.js` в корне библиотеки:

```javascript
const { createEslintConfig } = require('../../config/eslint-config');

module.exports = createEslintConfig({
  type: 'lib',
  react: true, // если библиотека использует React
  tsconfigPath: './tsconfig.base.json',
  ignorePatterns: [
    'node_modules',
    'dist/**/*',
    'coverage/**/*',
  ],
  // Опционально: путь к локальному конфигу для расширения
  localConfigPath: './.eslintrc.local.js',
});
```

**Особенности конфига для lib:**
- Может включать или исключать React поддержку
- Базовые правила для TypeScript
- Специальные правила для тестовых файлов

### Для корневого уровня

Создайте `.eslintrc.js` в корне монорепозитория:

```javascript
const { createEslintConfig } = require('./config/eslint-config');

module.exports = createEslintConfig({
  type: 'base',
  // Опционально: путь к локальному конфигу для расширения
  localConfigPath: './.eslintrc.local.js',
});
```

### Локальное расширение конфига

Вы можете создать `.eslintrc.local.js` (или `.eslintrc.local.json`) в любой директории для добавления специфичных правил. Локальный конфиг автоматически объединится с базовым конфигом.

**Пример `.eslintrc.local.js`:**

```javascript
module.exports = {
  // Дополнительные правила
  rules: {
    'custom-rule': 'error',
    '@typescript-eslint/no-explicit-any': 'warn',
  },
  
  // Дополнительные overrides
  overrides: [
    {
      files: ['src/specific/**/*.ts'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'error',
      },
    },
  ],
  
  // Дополнительные настройки
  settings: {
    'custom-setting': 'value',
  },
  
  // Дополнительные ignore patterns
  ignorePatterns: [
    'custom-pattern/**/*',
  ],
};
```

**Пример `.eslintrc.local.json`:**

```json
{
  "rules": {
    "custom-rule": "error"
  },
  "overrides": [
    {
      "files": ["src/specific/**/*.ts"],
      "rules": {
        "@typescript-eslint/no-explicit-any": "error"
      }
    }
  ]
}
```

## API

### `createEslintConfig(options)`

#### Параметры

- `type: 'base' | 'host' | 'lib'` - Тип конфигурации
  - `'base'` - Базовый конфиг для всех TypeScript проектов
  - `'host'` - Конфиг для приложений/host с React поддержкой
  - `'lib'` - Конфиг для библиотек (может включать React)
- `tsconfigPath?: string | string[]` - Путь к tsconfig.json для type-aware правил
- `react?: boolean` - Включить React поддержку (только для `type: 'lib'`)
- `ignorePatterns?: string[]` - Дополнительные ignore patterns
- `rules?: Record<string, unknown>` - Дополнительные правила
- `overrides?: Array<{...}>` - Дополнительные overrides
- `settings?: Record<string, unknown>` - Дополнительные настройки
- `env?: Record<string, boolean>` - Environment настройки
- `localConfigPath?: string` - Путь к локальному конфигу для расширения (`.js` или `.json`)

## Структура

```
config/eslint-config/
├── index.js              # JavaScript версия (для использования в .eslintrc.js)
├── index.ts              # TypeScript версия (для разработки)
├── base.config.ts        # Базовый конфиг
├── host.config.ts        # Конфиг для приложений (host)
├── lib.config.ts         # Конфиг для библиотек
├── createEslintConfig.ts # Фабрика конфигураций
├── types.ts              # TypeScript типы
├── package.json
├── tsconfig.json
└── README.md
```

## Миграция со старых конфигов

Старые `.eslintrc.json` файлы можно удалить после создания `.eslintrc.js` файлов. ESLint автоматически будет использовать `.eslintrc.js` если он существует.

