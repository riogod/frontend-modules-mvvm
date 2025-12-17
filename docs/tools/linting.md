# Линтинг (ESLint)

Проект использует централизованную фабрику конфигураций ESLint для обеспечения единых стандартов кода.

## Быстрый старт

```bash
# Линтинг всего проекта
npm run lint

# Линтинг host-приложения
npm run lint:host

# Линтинг всех библиотек
npm run lint:libs

# Линтинг всех модулей
npm run lint:modules
```

---

## Команды линтинга

### Host-приложение

```bash
npm run lint:host
```

### Библиотеки (libs/)

```bash
# Все библиотеки
npm run lint:libs

# Конкретная библиотека
npm run lint:lib -- --name=ui

# Несколько библиотек
npm run lint:lib -- --name=ui --name=core

# Список через запятую
npm run lint:lib -- --modules=ui,core,common

# Через переменную окружения
MODULES=ui,core npm run lint:lib

# Параллельный запуск
npm run lint:lib -- --all --parallel

# Автоматическое исправление
npm run lint:lib -- --name=ui --fix

# Подробный вывод
npm run lint:lib -- --name=ui --verbose
```

### Модули (packages/)

```bash
# Все модули
npm run lint:modules

# Конкретный модуль
npm run lint:module -- --name=todo

# Несколько модулей
npm run lint:module -- --name=todo --name=api_example

# Список через запятую
npm run lint:module -- --modules=todo,api_example

# Через переменную окружения
MODULES=todo,api_example npm run lint:module

# Параллельный запуск
npm run lint:module -- --all --parallel

# Автоматическое исправление
npm run lint:module -- --name=todo --fix
```

---

## Типы конфигураций

Фабрика `createEslintConfig` поддерживает 4 типа конфигураций:

| Тип      | Описание                   | Использование          |
| -------- | -------------------------- | ---------------------- |
| `base`   | Базовый конфиг TypeScript  | Корень монорепозитория |
| `host`   | Конфиг для host-приложения | `host/`                |
| `lib`    | Конфиг для библиотек       | `libs/*`               |
| `module` | Конфиг для MFE модулей     | `packages/*`           |

---

## Настройка ESLint

### Для host-приложения

Создайте `.eslintrc.js` в директории `host/`:

```javascript
/* eslint-env node */
const { createEslintConfig } = require('@platform/eslint-config');

module.exports = createEslintConfig({
  type: 'host',
  tsconfigPath: './tsconfig.base.json',
  localConfigPath: './.eslintrc.local.js', // опционально
  ignorePatterns: ['.eslintrc.js', '**/public/**/*'],
});
```

### Для библиотеки

Создайте `.eslintrc.cjs` в директории библиотеки:

```javascript
/* eslint-env node */
const { createEslintConfig } = require('@platform/eslint-config');
const path = require('path');

module.exports = createEslintConfig({
  type: 'lib',
  react: true, // включить React поддержку
  tsconfigPath: path.resolve(__dirname, 'tsconfig.eslint.json'),
  localConfigPath: './.eslintrc.local.js',
  ignorePatterns: ['node_modules', 'dist/**/*', 'coverage/**/*'],
});
```

### Для MFE модуля

Создайте `.eslintrc.cjs` в директории модуля:

```javascript
/* eslint-env node */
const path = require('path');
const { createEslintConfig } = require('@platform/eslint-config');

module.exports = createEslintConfig({
  type: 'module',
  tsconfigPath: path.resolve(__dirname, '../../tsconfig.base.json'),
  localConfigPath: './.eslintrc.local.cjs',
  rules: {
    // Локальные правила модуля
  },
});
```

---

## Локальное расширение конфига

Вы можете создать `.eslintrc.local.js` для добавления специфичных правил без изменения основного конфига.

### Пример .eslintrc.local.js

```javascript
module.exports = {
  rules: {
    'custom-rule': 'error',
    '@typescript-eslint/no-explicit-any': 'warn',
  },
  overrides: [
    {
      files: ['src/specific/**/*.ts'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'error',
      },
    },
  ],
  ignorePatterns: ['custom-pattern/**/*'],
};
```

> **Примечание**: Локальный конфиг автоматически объединяется с базовым.

---

## Структура конфигурации

```
config/eslint-config/
├── index.js              # JavaScript экспорт (для .eslintrc.js)
├── index.ts              # TypeScript экспорт
├── createEslintConfig.ts # Фабрика конфигураций
├── base.config.ts        # Базовый конфиг
├── host.config.ts        # Конфиг для host
├── lib.config.ts         # Конфиг для библиотек
├── module.config.ts      # Конфиг для модулей
├── types.ts              # TypeScript типы
├── plugins/
│   └── platform.js       # Кастомный плагин
└── rules/
    └── no-global-css.js  # Правило запрета глобальных CSS
```

---

## Устранение проблем

### Ошибка: Cannot find tsconfig

```
Parsing error: Cannot read file 'tsconfig.json'
```

**Решение**: Укажите правильный путь к tsconfig:

```javascript
module.exports = createEslintConfig({
  type: 'lib',
  tsconfigPath: path.resolve(__dirname, './tsconfig.eslint.json'),
});
```

### Ошибка: Plugin not found

```
ESLint couldn't find the plugin "@platform/eslint-config"
```

**Решение**: Убедитесь, что зависимости установлены:

```bash
npm install
```

### Много ошибок — как исправить автоматически?

```bash
# Для конкретного модуля
npm run lint:module -- --name=todo --fix

# Для библиотеки
npm run lint:lib -- --name=ui --fix
```

---

## Интеграция с IDE

### VS Code

Установите расширение [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint).

Добавьте в `.vscode/settings.json`:

```json
{
  "eslint.workingDirectories": [{ "mode": "auto" }],
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  }
}
```

> **Примечание**: `"mode": "auto"` автоматически определяет рабочие директории по наличию `.eslintrc.*` файлов.

### WebStorm / IntelliJ IDEA

1. Откройте **Settings → Languages & Frameworks → JavaScript → Code Quality Tools → ESLint**
2. Выберите **Automatic ESLint configuration**
3. Включите **Run eslint --fix on save**

---

## Связанные разделы

- [Тестирование](./testing.md) — Vitest и тестирование
- [Создание модуля](../modules/creating-module.md) — Структура модуля
- [Создание библиотек](../libs/create.md) — Структура библиотеки
- [UI библиотека](../libs/ui.md) — Компоненты @platform/ui
