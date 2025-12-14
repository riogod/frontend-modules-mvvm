# Задача 010: CSS изоляция и стилизация

## Статус: 🟡 В процессе

## Описание

Обеспечение консистентного UI и изоляции CSS стилей между модулями. Проект использует **MUI (Material UI)** как основной инструмент стилизации через `sx` prop и `styled` компоненты — это CSS-in-JS подход с автоматической изоляцией стилей.

**Текущее состояние:**

- ⬜ ESLint правило для предотвращения глобальных CSS отсутствует
- ⬜ CSS Modules не настроены в Vite конфигурации (необходимо для изоляции стилей)

## Зависимости

- **Задача 001**: Реструктуризация проекта (модули в packages/)
- **Задача 002**: Vite конфигурация для модулей

## Подзадачи

### 1. Создание ESLint правила для глобальных стилей

- [ ] Создать директорию `config/eslint-config/rules/`

- [ ] Создать `config/eslint-config/rules/no-global-css.js`:

```javascript
/**
 * ESLint правило: запрет импорта глобальных CSS в MFE модулях
 * Разрешены только CSS Modules (.module.css) и импорты из @platform/ui
 */
module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow global CSS imports in MFE modules',
      category: 'Best Practices',
    },
    messages: {
      noGlobalCss:
        'Global CSS imports are not allowed in modules. Use MUI sx prop, styled components, or CSS Modules instead.',
    },
  },
  create(context) {
    return {
      ImportDeclaration(node) {
        const importPath = node.source.value;

        // Проверяем импорт CSS файлов
        if (
          typeof importPath === 'string' &&
          (importPath.endsWith('.css') || importPath.endsWith('.scss'))
        ) {
          // Разрешаем CSS Modules
          if (importPath.includes('.module.')) {
            return;
          }

          // Разрешаем импорт из @platform/ui
          if (importPath.includes('@platform/ui')) {
            return;
          }

          // Разрешаем импорт из node_modules (библиотеки)
          if (importPath.startsWith('@') || !importPath.startsWith('.')) {
            return;
          }

          context.report({
            node,
            messageId: 'noGlobalCss',
          });
        }
      },
    };
  },
};
```

### 2. Обновление ESLint конфигурации для модулей

- [ ] Обновить `config/eslint-config/base.config.ts`:

```typescript
import type { ESLintConfig } from './types';

/**
 * Базовый конфиг для всех TypeScript проектов
 */
export const baseConfig: ESLintConfig = {
  root: true,
  ignorePatterns: ['**/*'],
  plugins: ['platform'], // Добавить кастомный плагин
  overrides: [
    // ... существующие overrides ...
    {
      // Правило только для packages/ (MFE модули)
      files: ['packages/*/src/**/*.{ts,tsx}'],
      rules: {
        'platform/no-global-css': 'error',
      },
    },
  ],
};
```

- [ ] Создать `config/eslint-config/plugins/platform.js`:

```javascript
const noGlobalCss = require('../rules/no-global-css');

module.exports = {
  rules: {
    'no-global-css': noGlobalCss,
  },
};
```

### 3. Настройка CSS Modules в Vite

**Важно:** Vite поддерживает CSS Modules по умолчанию для файлов `.module.css`, но для правильной изоляции между модулями необходимо настроить генерацию уникальных имен классов с префиксом модуля.

- [ ] Обновить `config/vite-config/module.config.js` для поддержки CSS Modules:

```javascript
// В начале файла добавить импорт (если еще нет):
import crypto from 'crypto';

// В функции createModuleConfig добавить в возвращаемый объект:
css: {
  modules: {
    // Генерация уникальных имен классов с префиксом модуля
    // Это обеспечивает изоляцию стилей между разными модулями
    generateScopedName: (name, filename) => {
      const modulePart = moduleName.replace(/-/g, '_');
      // В production используем короткий хеш для минимизации размера
      if (process.env.NODE_ENV === 'production') {
        const hash = crypto
          .createHash('md5')
          .update(filename + name)
          .digest('base64')
          .substring(0, 5)
          .replace(/[+/=]/g, '_');
        return `${modulePart}_${name}_${hash}`;
      }
      // В dev используем читаемое имя для отладки
      return `${modulePart}__${name}`;
    },
    // Преобразование kebab-case в camelCase для удобства использования
    // Например: .my-class -> styles.myClass
    localsConvention: 'camelCase',
  },
},
```

**Примечания:**

- CSS Modules автоматически активируются для файлов с расширением `.module.css`, `.module.scss`, `.module.less`
- Имена классов будут иметь префикс модуля (например, `todo__container` для модуля `todo`)
- В production имена классов будут хешированы для минимизации размера
- Использование: `import styles from './Component.module.css'` → `className={styles.container}`

### 4. Тестирование изоляции и CSS Modules

- [ ] Проверить отсутствие глобальных CSS файлов в packages/ (разрешены только `.module.css`):

  ```bash
  find packages -name "*.css" ! -name "*.module.css" -o -name "*.scss" ! -name "*.module.scss"
  ```

- [ ] Создать тестовый компонент с CSS Modules для проверки:
  - Создать `packages/todo/src/view/components/TestCssModule/TestCssModule.tsx`
  - Создать `packages/todo/src/view/components/TestCssModule/TestCssModule.module.css`
  - Проверить, что имена классов генерируются с префиксом модуля
  - Проверить работу в dev и production режимах

- [ ] Проверить ESLint правило при добавлении глобального CSS (должна быть ошибка)
- [ ] Проверить работу тем (светлая/темная) в модулях
- [ ] Проверить, что CSS Modules работают корректно вместе с MUI компонентами

## Definition of Done (DoD)

1. ⬜ ESLint правило `no-global-css` создано и включено
2. ⬜ CSS Modules настроены в `module.config.js` с генерацией уникальных имен классов
3. ⬜ Протестирована работа CSS Modules (создан пример компонента с `.module.css`)

## Архитектура стилизации

```
┌─────────────────────────────────────────────────────────┐
│                    Host Application                      │
│  ┌───────────────────────────────────────────────────┐  │
│  │           ThemeProvider (MUI)                      │  │
│  │  ┌─────────────────┐  ┌─────────────────────────┐ │  │
│  │  │   themeDark.ts  │  │    themeLight.ts        │ │  │
│  │  └─────────────────┘  └─────────────────────────┘ │  │
│  └───────────────────────────────────────────────────┘  │
│                          │                               │
│                          ▼                               │
│  ┌───────────────────────────────────────────────────┐  │
│  │              MFE Modules                           │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌───────────┐  │  │
│  │  │   Todo      │  │ API Example │  │  Other    │  │  │
│  │  │ (sx prop)   │  │ (sx prop)   │  │ (styled)  │  │  │
│  │  │ + CSS Mod.  │  │             │  │ + CSS Mod.│  │  │
│  │  └─────────────┘  └─────────────┘  └───────────┘  │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

## Пример структуры компонента

```
packages/todo/src/view/components/
├── TodoItem/
│   ├── index.ts
│   ├── TodoItem.tsx          # Использует MUI sx prop
│   └── TodoItem.module.css   # Опционально, для сложных стилей
```

## Сравнение подходов

| Подход         | Изоляция          | Производительность | Когда использовать              |
| -------------- | ----------------- | ------------------ | ------------------------------- |
| MUI `sx`       | ✅ Автоматическая | ⚡ Отличная        | Простые стили                   |
| MUI `styled`   | ✅ Автоматическая | ⚡ Отличная        | Переиспользуемые стили          |
| CSS Modules    | ✅ По хешу        | ⚡ Отличная        | Сложные анимации, media queries |
| Глобальный CSS | ❌ Нет            | ⚡ Быстрая         | **Запрещено в модулях**         |

## Риски и митигация

| Риск                                 | Вероятность | Влияние | Митигация                          |
| ------------------------------------ | ----------- | ------- | ---------------------------------- |
| Случайное добавление глобального CSS | Низкая      | Среднее | ESLint правило                     |
| Дублирование компонентов             | Низкая      | Низкое  | Code review, документация          |
| Конфликты с MUI стилями              | Низкая      | Среднее | Избегать переопределения глобально |

## Время выполнения

Ожидаемое время: **2-3 часа** (основная работа уже сделана через MUI)

## Примечания

- **MUI — основной инструмент стилизации** — CSS-in-JS с автоматической изоляцией
- **CSS Modules — дополнительный инструмент** для сложных стилей, анимаций и media queries
- CSS Modules обеспечивают изоляцию на уровне модуля через префиксы в именах классов
- ESLint правило предотвращает случайное добавление глобальных стилей
- Глобальные стили разрешены только в Host (`host/src/main.css`)
- Все UI компоненты должны импортироваться из `@platform/ui`
- CSS Modules можно комбинировать с MUI: использовать `className` prop вместе с `sx` prop для дополнительных стилей

```

```
