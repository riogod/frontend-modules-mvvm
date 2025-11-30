# Задача 010: CSS изоляция и стилизация

## Статус: ⚪ Не начата

## Описание

Обеспечение консистентного UI и изоляции CSS стилей между модулями. Включает аудит существующих стилей, настройку CSS Modules с уникальными хешами, перенос общих компонентов в `libs/ui` и настройку ESLint правил для предотвращения глобальных стилей в модулях.

## Зависимости

- **Задача 001**: Реструктуризация проекта (модули в packages/)
- **Задача 002**: Vite конфигурация для модулей

## Подзадачи

### 1. Аудит существующих CSS файлов

- [ ] Проверить все CSS файлы в `packages/*/`:
  ```bash
  find packages -name "*.css" -o -name "*.scss" | head -20
  ```
- [ ] Составить список файлов с глобальными стилями
- [ ] Определить компоненты, которые нужно перенести в `libs/ui`

### 2. Настройка CSS Modules в Vite

- [ ] Обновить `config/vite-config/module.config.ts`:

  ```typescript
  export function createModuleConfig(options: ModuleConfigOptions) {
    const { moduleName } = options;

    return {
      // ... остальная конфигурация
      css: {
        modules: {
          // Генерация уникальных имен классов
          generateScopedName: (name, filename, css) => {
            // Формат: [module]__[local]__[hash]
            const modulePart = moduleName.replace(/-/g, '_');
            const hash = crypto
              .createHash('md5')
              .update(css)
              .digest('base64')
              .substring(0, 5);
            return `${modulePart}__${name}__${hash}`;
          },
          // Включить CSS Modules для всех .module.css файлов
          localsConvention: 'camelCase',
        },
        // Добавить префикс для предотвращения коллизий
        preprocessorOptions: {
          scss: {
            additionalData: `$module-prefix: "${moduleName}";`,
          },
        },
      },
    };
  }
  ```

### 3. Создание CSS переменных для темы

- [ ] Обновить `libs/ui/src/theme/cssVariables.ts`:

  ```typescript
  /**
   * CSS переменные, синхронизированные с MUI темой
   * Используются для стилизации в CSS Modules
   */
  export const cssVariables = {
    // Цвета
    '--color-primary': 'var(--mui-palette-primary-main)',
    '--color-secondary': 'var(--mui-palette-secondary-main)',
    '--color-error': 'var(--mui-palette-error-main)',
    '--color-warning': 'var(--mui-palette-warning-main)',
    '--color-info': 'var(--mui-palette-info-main)',
    '--color-success': 'var(--mui-palette-success-main)',

    // Фон
    '--bg-default': 'var(--mui-palette-background-default)',
    '--bg-paper': 'var(--mui-palette-background-paper)',

    // Текст
    '--text-primary': 'var(--mui-palette-text-primary)',
    '--text-secondary': 'var(--mui-palette-text-secondary)',

    // Отступы (синхронизация с MUI spacing)
    '--spacing-1': '8px',
    '--spacing-2': '16px',
    '--spacing-3': '24px',
    '--spacing-4': '32px',

    // Радиусы
    '--border-radius-sm': '4px',
    '--border-radius-md': '8px',
    '--border-radius-lg': '12px',

    // Тени
    '--shadow-1': 'var(--mui-shadows-1)',
    '--shadow-2': 'var(--mui-shadows-2)',
    '--shadow-3': 'var(--mui-shadows-3)',
  };

  /**
   * Инжектирует CSS переменные в :root
   */
  export function injectCSSVariables(): void {
    const style = document.createElement('style');
    style.id = 'platform-css-variables';

    const cssText = Object.entries(cssVariables)
      .map(([key, value]) => `${key}: ${value};`)
      .join('\n');

    style.textContent = `:root {\n${cssText}\n}`;
    document.head.appendChild(style);
  }
  ```

### 4. Миграция на CSS Modules

- [ ] Для каждого компонента в packages/\*:
  - Переименовать `Component.css` → `Component.module.css`
  - Обновить импорты:

    ```typescript
    // Было:
    import './Component.css';

    // Стало:
    import styles from './Component.module.css';
    ```

  - Обновить использование классов:

    ```tsx
    // Было:
    <div className="component-container">

    // Стало:
    <div className={styles.container}>
    ```

### 5. Создание ESLint правила для глобальных стилей

- [ ] Создать `config/eslint-config/rules/no-global-css.js`:

  ```javascript
  module.exports = {
    meta: {
      type: 'problem',
      docs: {
        description: 'Disallow global CSS imports in MFE modules',
        category: 'Best Practices',
      },
      messages: {
        noGlobalCss:
          'Global CSS imports are not allowed in modules. Use CSS Modules instead.',
      },
    },
    create(context) {
      return {
        ImportDeclaration(node) {
          const importPath = node.source.value;

          // Проверяем импорт CSS файлов
          if (
            typeof importPath === 'string' &&
            importPath.endsWith('.css') &&
            !importPath.includes('.module.')
          ) {
            // Разрешаем импорт из libs/ui
            if (importPath.includes('@platform/ui')) {
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

### 6. Обновление ESLint конфигурации

- [ ] Обновить `config/eslint-config/base.config.ts`:

  ```typescript
  import noGlobalCss from './rules/no-global-css';

  export default {
    // ... существующая конфигурация
    plugins: {
      platform: {
        rules: {
          'no-global-css': noGlobalCss,
        },
      },
    },
    rules: {
      // Включить правило для packages/
      'platform/no-global-css': 'error',
    },
  };
  ```

### 7. Создание утилит для работы с CSS Modules

- [ ] Создать `libs/ui/src/utils/classNames.ts`:

  ```typescript
  type ClassValue = string | undefined | null | false | ClassValue[];

  /**
   * Утилита для объединения CSS классов
   * Поддерживает условные классы и CSS Modules
   *
   * @example
   * cn(styles.container, isActive && styles.active, className)
   */
  export function cn(...classes: ClassValue[]): string {
    return classes
      .flat()
      .filter((c): c is string => typeof c === 'string' && c.length > 0)
      .join(' ');
  }

  /**
   * Создает функцию для работы с CSS Modules
   *
   * @example
   * const cx = createCx(styles);
   * <div className={cx('container', { active: isActive })}>
   */
  export function createCx(styles: Record<string, string>) {
    return function cx(
      ...args: (string | Record<string, boolean | undefined>)[]
    ): string {
      const classes: string[] = [];

      for (const arg of args) {
        if (typeof arg === 'string') {
          if (styles[arg]) {
            classes.push(styles[arg]);
          }
        } else if (typeof arg === 'object') {
          for (const [key, value] of Object.entries(arg)) {
            if (value && styles[key]) {
              classes.push(styles[key]);
            }
          }
        }
      }

      return classes.join(' ');
    };
  }
  ```

### 8. Перенос общих компонентов в libs/ui

- [ ] Идентифицировать переиспользуемые компоненты в модулях
- [ ] Перенести их в `libs/ui/src/components/`
- [ ] Обновить импорты в модулях:

  ```typescript
  // Было (в модуле):
  import { Button } from './components/Button';

  // Стало (из libs/ui):
  import { Button } from '@platform/ui';
  ```

### 9. Настройка CSS изоляции в Federation

- [ ] Обновить `config/vite-config/module.config.ts`:
  ```typescript
  build: {
    cssCodeSplit: true, // Отдельные CSS файлы для каждого чанка
    rollupOptions: {
      output: {
        // Добавить хеш модуля к CSS файлам
        assetFileNames: (assetInfo) => {
          if (assetInfo.name?.endsWith('.css')) {
            return `assets/${moduleName}-[name]-[hash][extname]`;
          }
          return 'assets/[name]-[hash][extname]';
        },
      },
    },
  }
  ```

### 10. Документация по стилизации

- [ ] Создать `docs/styling-guide.md`:

  ````markdown
  # Руководство по стилизации

  ## Правила для MFE модулей

  1. **Используйте CSS Modules**
     - Все CSS файлы должны иметь суффикс `.module.css`
     - Импортируйте как объект: `import styles from './Component.module.css'`

  2. **Не используйте глобальные стили**
     - ESLint выдаст ошибку при импорте `.css` без `.module`
     - Глобальные стили только в Host приложении

  3. **Используйте CSS переменные**
     - `var(--color-primary)` вместо хардкод цветов
     - Переменные синхронизированы с MUI темой

  4. **Переиспользуйте компоненты из @platform/ui**
     - Не создавайте дубликаты Button, Input, Card и т.д.
     - Если нужен новый общий компонент - добавьте в libs/ui

  ## Примеры

  ### CSS Module

  ```css
  /* Component.module.css */
  .container {
    padding: var(--spacing-2);
    background: var(--bg-paper);
    border-radius: var(--border-radius-md);
  }

  .title {
    color: var(--text-primary);
    font-size: 1.25rem;
  }
  ```
  ````

  ### Использование в компоненте

  ```tsx
  import styles from './Component.module.css';
  import { cn } from '@platform/ui';

  function Component({ className, isActive }) {
    return (
      <div
        className={cn(styles.container, isActive && styles.active, className)}
      >
        <h2 className={styles.title}>Title</h2>
      </div>
    );
  }
  ```

  ```

  ```

### 11. Тестирование изоляции

- [ ] Создать два модуля с одинаковыми именами классов
- [ ] Убедиться, что стили не конфликтуют
- [ ] Проверить корректность загрузки CSS при lazy loading модулей
- [ ] Проверить работу темы (светлая/темная) в модулях

## Definition of Done (DoD)

1. ✅ Все CSS файлы в packages/ используют CSS Modules
2. ✅ CSS Modules настроены с уникальными хешами для каждого модуля
3. ✅ ESLint правило `no-global-css` создано и включено
4. ✅ CSS переменные для темы созданы и документированы
5. ✅ Утилиты `cn` и `createCx` созданы в libs/ui
6. ✅ Общие компоненты перенесены в libs/ui
7. ✅ Документация по стилизации создана
8. ✅ Нет конфликтов стилей между модулями
9. ✅ CSS корректно загружается при lazy loading
10. ✅ Тема (светлая/темная) работает во всех модулях

## Пример структуры компонента с CSS Modules

```
packages/todo/src/view/components/
├── TodoItem/
│   ├── index.ts
│   ├── TodoItem.tsx
│   └── TodoItem.module.css
└── TodoList/
    ├── index.ts
    ├── TodoList.tsx
    └── TodoList.module.css
```

## Пример сгенерированных CSS классов

```css
/* До компиляции (TodoItem.module.css) */
.container {
  padding: 16px;
}

.title {
  font-weight: bold;
}

/* После компиляции (в браузере) */
.module_todo__container__x7k2m {
  padding: 16px;
}

.module_todo__title__p3n9q {
  font-weight: bold;
}
```

## CSS переменные и MUI тема

```
MUI Theme                    CSS Variables
    │                            │
    ▼                            ▼
┌───────────┐           ┌────────────────┐
│ palette:  │ ────────► │ --color-primary │
│  primary  │           │ --color-secondary│
│  secondary│           │ --bg-default    │
│ ...       │           │ --text-primary  │
└───────────┘           └────────────────┘
                                │
                                ▼
                    ┌─────────────────────┐
                    │  CSS Modules        │
                    │  .container {       │
                    │    background:      │
                    │    var(--bg-paper); │
                    │  }                  │
                    └─────────────────────┘
```

## Риски и митигация

| Риск                             | Вероятность | Влияние | Митигация                                             |
| -------------------------------- | ----------- | ------- | ----------------------------------------------------- |
| Миграция большого количества CSS | Средняя     | Среднее | Постепенная миграция, скрипт автоматизации            |
| Конфликты с MUI стилями          | Низкая      | Среднее | Использовать MUI компоненты, избегать переопределения |
| Потеря стилей при HMR            | Низкая      | Низкое  | Тестирование, правильная настройка Vite               |

## Время выполнения

Ожидаемое время: **4-6 часов**

## Примечания

- CSS Modules обеспечивают изоляцию на уровне сборки
- CSS переменные обеспечивают консистентность с MUI темой
- ESLint правило предотвращает случайное добавление глобальных стилей
- Глобальные стили разрешены только в Host приложении (для normalize, fonts и т.д.)
