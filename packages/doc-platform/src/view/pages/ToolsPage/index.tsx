import { type FC } from 'react';
import { Container, Typography, Paper } from '@platform/ui';
import { useTranslation } from 'react-i18next';
import { MarkdownRenderer } from '../../common';

const pageMarkdown = `# Сборка проекта

Руководство по сборке host-приложения и MFE модулей.

---

## Быстрый старт

\`\`\`bash
# Собрать всё (модули + host)
npm run build:all

# Собрать только host
npm run build:host

# Собрать только модули
npm run build:modules

# Собрать конкретный модуль
npm run build:module -- --name=todo
\`\`\`

---

## Команды сборки

| Команда                                | Описание                       |
| -------------------------------------- | ------------------------------ |
| \`npm run build\`                        | Сборка host                    |
| \`npm run build:host\`                   | Сборка host                    |
| \`npm run build:module -- --name=<m>\`   | Сборка конкретного модуля      |
| \`npm run build:modules\`                | Сборка всех модулей            |
| \`npm run build:all\`                    | Сборка модулей + host          |
| \`npm run build:host:analyze\`           | Анализ бандла host             |
| \`npm run analyze:module -- --name=<m>\` | Анализ бандла модуля           |
| \`npm run preview\`                      | Предпросмотр production сборки |

---

## Структура dist/

После выполнения \`npm run build:all\`:

\`\`\`
dist/
├── assets/                     # Ассеты host-приложения
│   ├── index-[hash].js         # Главный бандл
│   ├── index-[hash].css        # Стили
│   └── vendor-[hash].js        # Vendor библиотеки
├── modules/                    # MFE модули
│   ├── todo/
│   │   ├── latest/             # Актуальная версия
│   │   │   ├── remoteEntry.js  # Точка входа Module Federation
│   │   │   └── *.js            # Чанки модуля
│   │   └── 1.0.0/              # Версионированная копия
│   └── api_example/
│       ├── latest/
│       └── 1.0.0/
├── index.html                  # HTML входная точка
└── favicon.ico
\`\`\`

> **Важно**: Папка \`modules/\` сохраняется при пересборке host. Это позволяет собирать модули и host независимо.

---

## Сборка Host

### Команда

\`\`\`bash
npm run build:host
\`\`\`

### Конфигурация

Host использует \`config/vite-config/host.config.js\`:

\`\`\`javascript
{
  target: 'esnext',
  minify: 'esbuild',
  sourcemap: true,
  cssCodeSplit: false,
  modulePreload: false,
  emptyOutDir: false,  // Сохраняет modules/
}
\`\`\`

---

## Сборка модулей

### Скрипт build-module.mjs

\`\`\`bash
# Один модуль
npm run build:module -- --name=todo

# Несколько модулей
npm run build:module -- --name=todo --name=api_example

# Все модули
npm run build:module -- --all

# Параллельная сборка
npm run build:module -- --all --parallel

# Через переменную окружения
MODULES=todo,api_example npm run build:module

# С анализом бандла
npm run build:module -- --name=todo --analyze

# С подробным выводом
npm run build:module -- --name=todo --verbose
\`\`\`

### Параметры

| Параметр     | Описание                     |
| ------------ | ---------------------------- |
| \`--name=<m>\` | Имя модуля для сборки        |
| \`--all\`      | Собрать все модули           |
| \`--parallel\` | Параллельная сборка          |
| \`--analyze\`  | Анализ размера бандла        |
| \`--verbose\`  | Подробный вывод              |
| \`--modules=\` | Список модулей через запятую |

### Версионирование

Каждый модуль собирается в две директории:

- \`latest/\` — всегда актуальная версия
- \`{version}/\` — копия для версионирования (из \`package.json\`)

\`\`\`bash
# Обновить версию модуля
node scripts/version-module.mjs todo patch   # 1.0.0 → 1.0.1
node scripts/version-module.mjs todo minor   # 1.0.0 → 1.1.0
node scripts/version-module.mjs todo major   # 1.0.0 → 2.0.0

# Интерактивный режим
node scripts/version-module.mjs
\`\`\`

---

## Переменные окружения

### При сборке

\`\`\`bash
# Установить уровень логирования
LOG_LEVEL=ERROR npm run build:host

# Установить префикс приложения
VITE_APP_PREFIX=/app/ npm run build:host

# Установить Апи урл
VITE_API_URL=https://api.example.com/backend npm run build:host
\`\`\`



---

# Лаунчер (CLI для локальной разработки)

Лаунчер — интерактивный инструмент командной строки для управления конфигурациями запуска и модулями приложения.

## Быстрый старт

\`\`\`bash
# Запуск интерактивного меню
npm start

# Запуск последней конфигурации
npm start -- --last

# Запуск конкретной конфигурации
npm start -- --config Development
\`\`\`

## Главное меню

При запуске \`npm start\` отображается интерактивное меню:

\`\`\`
🚀 Frontend MFE Launcher

Выберите действие:
  1. Development (2 модулей) [используется: 15 раз] ★
  2. Staging (1 модулей) [используется: 5 раз]
  → Создать новую конфигурацию
  → Создать новый MFE модуль
  → Глобальные настройки
  → Выход
\`\`\`

| Элемент                   | Описание                              |
| ------------------------- | ------------------------------------- |
| **Номер**                 | Порядковый номер конфигурации         |
| **Имя**                   | Название конфигурации                 |
| **Количество модулей**    | Сколько модулей включено              |
| **Счетчик использования** | Сколько раз запускалась               |
| **★**                     | Последняя использованная конфигурация |

---

## Типы источников модулей

При настройке конфигурации вы выбираете источник для каждого модуля:

| Источник          | Иконка | Описание                                                   |
| ----------------- | ------ | ---------------------------------------------------------- |
| **LOCAL**         | 🟢     | Модуль загружается из локальной директории \`packages/\`     |
| **REMOTE**        | 🔵     | Модуль загружается с Remote Server (требует настройки URL) |
| **REMOTE_CUSTOM** | 🟣     | Модуль загружается по произвольному URL                    |
| **Пропустить**    | ⏭️     | Модуль не загружается                                      |

### Когда использовать каждый источник

\`\`\`
LOCAL          → Активная разработка модуля (быстрый HMR)
REMOTE         → Тестирование интеграции с production-версией модуля
REMOTE_CUSTOM  → Тестирование со staging/feature-веткой модуля
Пропустить     → Модуль не нужен в текущей задаче
\`\`\`

---

## Работа с конфигурациями

### Создание конфигурации

1. Выберите **"Создать новую конфигурацию"**
2. Настройте источник для каждого модуля
3. Введите имя конфигурации
4. Введите описание (опционально)
5. Настройте параметры:
   - Уровень логирования
   - Использование локальных моков
   - API URL

### Меню конфигурации

После выбора конфигурации из списка:

\`\`\`
Конфигурация: "Development"

Модули:
  🟢 todo: LOCAL ✅ моки
  🟢 api_example: LOCAL ✅ моки

Настройки конфигурации:
  Уровень логирования: INFO
  Использовать локальные моки: Да
  API URL: ⚠️ не настроен

Что сделать?
  → Запустить
  → Редактировать модули
  → Настроить параметры
  → Удалить
  → Назад
\`\`\`

### Запуск конфигурации

При запуске выполняется:

1. Генерация манифеста модулей
2. Запуск dev-server на порту **1337**
3. Запуск Vite dev server на порту **4200**

---

## Настройка параметров

### Уровни логирования

| Уровень | Описание                                |
| ------- | --------------------------------------- |
| \`NONE\`  | Логи отключены                          |
| \`ERROR\` | Только ошибки                           |
| \`WARN\`  | Ошибки и предупреждения                 |
| \`INFO\`  | Информационные сообщения (по умолчанию) |
| \`DEBUG\` | Детальная отладка                       |
| \`TRACE\` | Максимальная детализация                |

### Моки (MSW)

- **Включены** — API-запросы host перехватываются MSW и возвращают мок-данные
- **Отключены** — Запросы уходят на реальный API (требуется настройка API URL)

---

## Глобальные настройки

Выберите **"Глобальные настройки"** для настройки:

### Remote Server URL

URL сервера для загрузки REMOTE модулей.

\`\`\`
Формат: http://localhost:3000

Результат: {remoteServerUrl}/modules/{moduleName}/latest/remoteEntry.js
\`\`\`

### API URL (глобальный fallback)

URL API сервера, используется если в конфигурации не задан \`apiUrl\`.

\`\`\`
Формат: http://localhost:3001/back/
\`\`\`

---

## Создание MFE модуля

1. Выберите **"Создать новый MFE модуль"**
2. Введите название модуля (kebab-case): \`my-feature\`
3. Следуйте инструкциям мастера

После создания:

1. Модуль появится в \`packages/my-feature/\`
2. Добавьте модуль в \`host/src/modules/modules.ts\`
3. Модуль готов к использованию в конфигурациях

---

## Аргументы командной строки

| Аргумент          | Короткая форма | Описание                                     |
| ----------------- | -------------- | -------------------------------------------- |
| \`--last\`          | \`-l\`           | Запуск последней использованной конфигурации |
| \`--config <name>\` | \`-c <name>\`    | Запуск конфигурации по имени                 |
| \`--create-module\` | —              | Запуск мастера создания модуля               |

### Примеры

\`\`\`bash
# Запуск последней конфигурации без интерактивного меню
npm start -- --last

# Запуск конфигурации "Development"
npm start -- --config Development
npm start -- -c Development

# Создание нового модуля
npm start -- --create-module
\`\`\`

---

## Переменные окружения

| Переменная             | Описание                                        | Пример                                 |
| ---------------------- | ----------------------------------------------- | -------------------------------------- |
| \`LOG_LEVEL\`            | Уровень логирования (приоритет над настройками) | \`LOG_LEVEL=DEBUG npm start\`            |
| \`VITE_USE_LOCAL_MOCKS\` | Использовать моки (приоритет над настройками)   | \`VITE_USE_LOCAL_MOCKS=false npm start\` |

---

## Структура файлов

\`\`\`
.launcher/
├── configs.json           # Сохраненные конфигурации
└── current-manifest.json  # Текущий манифест (генерируется при запуске)

packages/                  # NORMAL модули (настраиваются в конфигурациях)
├── todo/
├── api_example/
└── ...

host/src/modules/          # INIT модули (загружаются всегда)
├── core/
└── core.layout/
\`\`\`

### Формат configs.json

\`\`\`json
{
  "version": "1.0.0",
  "lastUsed": "development",
  "remoteServerUrl": "http://localhost:3000",
  "configurations": {
    "development": {
      "name": "Development",
      "description": "Все модули локально",
      "modules": {
        "todo": {
          "source": "local",
          "path": "packages/todo",
          "priority": 1,
          "useLocalMocks": true
        }
      },
      "settings": {
        "logLevel": "INFO",
        "useLocalMocks": true,
        "apiUrl": ""
      }
    }
  }
}
\`\`\`

---

## Типы модулей

### INIT модули

Модули, которые загружаются всегда локально при инициализации приложения:

- \`core\` — Базовый функционал
- \`core.layout\` — Компоненты макета

> INIT модули не настраиваются в конфигурациях.

### NORMAL модули

Модули из директории \`packages/\`, которые настраиваются в конфигурациях:

- Источник (LOCAL / REMOTE / REMOTE_CUSTOM)
- Приоритет загрузки
- Использование моков

---

## Рекомендуемые конфигурации

### Development

Все модули локально для активной разработки:

\`\`\`
todo: LOCAL ✅ моки
api_example: LOCAL ✅ моки
\`\`\`

### Staging

Смешанная конфигурация для тестирования интеграции:

\`\`\`
todo: LOCAL ✅ моки          # Активно разрабатываем
api_example: REMOTE ❌ моки  # Тестируем с production-версией
\`\`\`

### Production Test

Все модули удаленно для тестирования:

\`\`\`
todo: REMOTE ❌ моки
api_example: REMOTE ❌ моки
\`\`\`

---

## Устранение неполадок

### Модули не найдены

1. Убедитесь, что модули находятся в \`packages/\`
2. Проверьте наличие \`package.json\` в директории модуля

### Конфигурация не запускается

1. Проверьте, что все LOCAL модули существуют
2. Проверьте настройки Remote Server URL (для REMOTE модулей)
3. Смотрите логи в консоли

### Манифест не генерируется

1. Проверьте файл \`packages/{module}/src/config/module_config.ts\`
2. Убедитесь, что модуль имеет правильную структуру

### Порты заняты

Лаунчер использует порты:

- **1337** — dev-server
- **4200** — Vite dev server

Убедитесь, что эти порты свободны.


---

# Линтинг (ESLint)

Проект использует централизованную фабрику конфигураций ESLint для обеспечения единых стандартов кода.

## Быстрый старт

\`\`\`bash
# Линтинг всего проекта
npm run lint

# Линтинг host-приложения
npm run lint:host

# Линтинг всех библиотек
npm run lint:libs

# Линтинг всех модулей
npm run lint:modules
\`\`\`

---

## Команды линтинга

### Host-приложение

\`\`\`bash
npm run lint:host
\`\`\`

### Библиотеки (libs/)

\`\`\`bash
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
\`\`\`

### Модули (packages/)

\`\`\`bash
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
\`\`\`

---

## Типы конфигураций

Фабрика \`createEslintConfig\` поддерживает 4 типа конфигураций:

| Тип      | Описание                   | Использование          |
| -------- | -------------------------- | ---------------------- |
| \`base\`   | Базовый конфиг TypeScript  | Корень монорепозитория |
| \`host\`   | Конфиг для host-приложения | \`host/\`                |
| \`lib\`    | Конфиг для библиотек       | \`libs/*\`               |
| \`module\` | Конфиг для MFE модулей     | \`packages/*\`           |

---

## Настройка ESLint

### Для host-приложения

Создайте \`.eslintrc.js\` в директории \`host/\`:

\`\`\`javascript
/* eslint-env node */
const { createEslintConfig } = require('@platform/eslint-config');

module.exports = createEslintConfig({
  type: 'host',
  tsconfigPath: './tsconfig.base.json',
  localConfigPath: './.eslintrc.local.js', // опционально
  ignorePatterns: ['.eslintrc.js', '**/public/**/*'],
});
\`\`\`

### Для библиотеки

Создайте \`.eslintrc.cjs\` в директории библиотеки:

\`\`\`javascript
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
\`\`\`

### Для MFE модуля

Создайте \`.eslintrc.cjs\` в директории модуля:

\`\`\`javascript
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
\`\`\`

---

## Локальное расширение конфига

Вы можете создать \`.eslintrc.local.js\` для добавления специфичных правил без изменения основного конфига.

### Пример .eslintrc.local.js

\`\`\`javascript
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
\`\`\`

> **Примечание**: Локальный конфиг автоматически объединяется с базовым.

---

## Структура конфигурации

\`\`\`
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
\`\`\`

---

## Устранение проблем

### Ошибка: Cannot find tsconfig

\`\`\`
Parsing error: Cannot read file 'tsconfig.json'
\`\`\`

**Решение**: Укажите правильный путь к tsconfig:

\`\`\`javascript
module.exports = createEslintConfig({
  type: 'lib',
  tsconfigPath: path.resolve(__dirname, './tsconfig.eslint.json'),
});
\`\`\`

### Ошибка: Plugin not found

\`\`\`
ESLint couldn't find the plugin "@platform/eslint-config"
\`\`\`

**Решение**: Убедитесь, что зависимости установлены:

\`\`\`bash
npm install
\`\`\`

### Много ошибок — как исправить автоматически?

\`\`\`bash
# Для конкретного модуля
npm run lint:module -- --name=todo --fix

# Для библиотеки
npm run lint:lib -- --name=ui --fix
\`\`\`

---

## Интеграция с IDE

### VS Code

Установите расширение [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint).

Добавьте в \`.vscode/settings.json\`:

\`\`\`json
{
  "eslint.workingDirectories": [{ "mode": "auto" }],
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  }
}
\`\`\`

> **Примечание**: \`"mode": "auto"\` автоматически определяет рабочие директории по наличию \`.eslintrc.*\` файлов.

### WebStorm / IntelliJ IDEA

1. Откройте **Settings → Languages & Frameworks → JavaScript → Code Quality Tools → ESLint**
2. Выберите **Automatic ESLint configuration**
3. Включите **Run eslint --fix on save**


---

# Storybook

Проект использует **Storybook 9** для разработки и документирования UI-компонентов в изоляции.

---

## Быстрый старт

\`\`\`bash
# Запуск Storybook в режиме разработки
npm run storybook

# Сборка статического Storybook
npm run build-storybook
\`\`\`

После запуска Storybook будет доступен по адресу: http://localhost:6006

---

## Структура

\`\`\`
libs/ui/
├── .storybook/
│   ├── main.ts          # Основная конфигурация
│   └── preview.tsx      # Глобальные декораторы и параметры
└── src/
    ├── components/
    │   └── ui/
    │       └── IconButton/
    │           ├── IconButton.tsx
    │           └── IconButton.stories.tsx    # Stories
    └── hooks/
        └── useSharedComponent/
            ├── useSharedComponent.tsx
            ├── useSharedComponent.stories.tsx
            └── useSharedComponent.mdx        # MDX документация
\`\`\`

> **Соглашение**: Файлы stories размещаются рядом с компонентом с суффиксом \`.stories.tsx\`.

---

## Написание Stories

### Базовый пример

\`\`\`typescript
// IconButton.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { IconButton } from './IconButton';
import DeleteIcon from '@mui/icons-material/Delete';

const meta = {
  title: 'Components/IconButton',
  component: IconButton,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'], // Автогенерация документации
} satisfies Meta<typeof IconButton>;

export default meta;
type Story = StoryObj<typeof meta>;

// Базовый вариант
export const Primary: Story = {
  args: {
    children: <DeleteIcon />,
    color: 'primary',
    size: 'medium',
    disabled: false,
  },
};

// Дополнительные варианты
export const Secondary: Story = {
  args: {
    children: <DeleteIcon />,
    color: 'secondary',
    size: 'medium',
  },
};

export const Small: Story = {
  args: {
    children: <DeleteIcon />,
    size: 'small',
  },
};

export const Disabled: Story = {
  args: {
    children: <DeleteIcon />,
    disabled: true,
  },
};
\`\`\`

### Story с render функцией

\`\`\`typescript
import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { ErrorBoundary } from './ErrorBoundary';
import { Box, Button, Typography } from '@mui/material';

// Компонент, который выбрасывает ошибку
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Тестовая ошибка');
  }
  return <Typography>Компонент работает нормально</Typography>;
};

const meta = {
  title: 'Components/ErrorBoundary',
  component: ErrorBoundary,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Компонент для перехвата и обработки ошибок в React.',
      },
    },
  },
  argTypes: {
    children: {
      control: false,
      description: 'Дочерние компоненты',
    },
    fallback: {
      control: false,
      description: 'Кастомный fallback UI',
    },
    logPrefix: {
      control: 'text',
      description: 'Префикс для логирования',
    },
    showReloadButton: {
      control: 'boolean',
      description: 'Показывать кнопку перезагрузки',
    },
  },
} satisfies Meta<typeof ErrorBoundary>;

export default meta;
type Story = StoryObj<typeof meta>;

// Story без args, с render функцией
type StoryWithRender = Omit<Story, 'args'>;

export const Default: StoryWithRender = {
  render: () => {
    const [shouldThrow, setShouldThrow] = useState(false);

    return (
      <Box sx={{ p: 3 }}>
        <Button
          variant="contained"
          color="error"
          onClick={() => setShouldThrow(true)}
          sx={{ mb: 2 }}
        >
          Вызвать ошибку
        </Button>
        <ErrorBoundary>
          <ThrowError shouldThrow={shouldThrow} />
        </ErrorBoundary>
      </Box>
    );
  },
};
\`\`\`

---

## MDX документация

MDX файлы позволяют создавать богатую документацию с интерактивными примерами.

### Пример MDX файла

\`\`\`\`mdx
{/* ErrorBoundary.mdx */}
import { Meta, Canvas, Controls, ArgTypes } from '@storybook/addon-docs/blocks';
import { ErrorBoundary } from './ErrorBoundary';
import * as ErrorBoundaryStories from './ErrorBoundary.stories';

<Meta of={ErrorBoundaryStories} />

# ErrorBoundary

Компонент для перехвата и обработки ошибок в React-компонентах.

## Основные возможности

- ✅ Автоматический перехват ошибок
- ✅ Логирование через Logger
- ✅ Настраиваемый fallback UI
- ✅ Callback функция для обработки ошибок

## API Reference

<ArgTypes of={ErrorBoundaryStories.Default} />

| Prop               | Тип                                   | По умолчанию      | Описание                       |
| ------------------ | ------------------------------------- | ----------------- | ------------------------------ |
| \`children\`         | \`ReactNode\`                           | —                 | Дочерние компоненты            |
| \`fallback\`         | \`ReactNode | (error: Error) => Node\` | —                 | Кастомный fallback UI          |
| \`logPrefix\`        | \`string\`                              | \`'ErrorBoundary'\` | Префикс для логирования        |
| \`showReloadButton\` | \`boolean\`                             | \`true\`            | Показывать кнопку перезагрузки |

## Примеры

### Базовое использование

\`\`\`tsx
import { ErrorBoundary } from '@platform/ui';

function App() {
  return (
    <ErrorBoundary>
      <YourComponent />
    </ErrorBoundary>
  );
}
\`\`\`
\`\`\`\`

### С кастомным fallback

\`\`\`tsx
<ErrorBoundary
  fallback={(error) => (
    <div>
      <h2>Ошибка</h2>
      <p>{error.message}</p>
    </div>
  )}
>
  <YourComponent />
</ErrorBoundary>
\`\`\`

\`\`\`\`

---

## Организация stories

### Структура title

\`\`\`typescript
// Компоненты UI
title: 'Components/Button'
title: 'Components/IconButton'
title: 'Components/ErrorBoundary'

// Хуки
title: 'Hooks/useSharedComponent'
title: 'Hooks/useVM'

// Утилиты
title: 'Utils/ErrorBoundary'

// По модулям
title: 'Todo/Components/TodoList'
title: 'Todo/Hooks/useTodoVM'
\`\`\`\`

### Группировка stories

\`\`\`typescript
const meta = {
  title: 'Components/Button',
  component: Button,
} satisfies Meta<typeof Button>;

// Варианты
export const Primary: Story = { args: { variant: 'primary' } };
export const Secondary: Story = { args: { variant: 'secondary' } };

// Состояния
export const Disabled: Story = { args: { disabled: true } };
export const Loading: Story = { args: { loading: true } };

// Размеры
export const Small: Story = { args: { size: 'small' } };
export const Large: Story = { args: { size: 'large' } };
\`\`\`

---

## Декораторы

### Глобальные декораторы

Определяются в \`preview.tsx\` и применяются ко всем stories:

\`\`\`typescript
decorators: [
  (Story, context) => (
    <ThemeWrapper theme={context.globals?.theme || 'light'}>
      <Story />
    </ThemeWrapper>
  ),
];
\`\`\`

### Декораторы для story

\`\`\`typescript
export const WithWrapper: Story = {
  decorators: [
    (Story) => (
      <Box sx={{ padding: 4, backgroundColor: 'grey.100' }}>
        <Story />
      </Box>
    ),
  ],
};
\`\`\`

### Декораторы для meta

\`\`\`typescript
const meta = {
  title: 'Components/Button',
  component: Button,
  decorators: [
    (Story) => (
      <Box sx={{ p: 2 }}>
        <Story />
      </Box>
    ),
  ],
} satisfies Meta<typeof Button>;
\`\`\`

---

## Параметры

### Layout

\`\`\`typescript
parameters: {
  layout: 'centered',  // По центру
  layout: 'padded',    // С отступами
  layout: 'fullscreen' // На весь экран
}
\`\`\`

### Docs

\`\`\`typescript
parameters: {
  docs: {
    description: {
      component: 'Описание компонента',
      story: 'Описание конкретной story',
    },
  },
}
\`\`\`

---

## Аддоны

### Установленные аддоны

| Аддон                   | Описание                   |
| ----------------------- | -------------------------- |
| \`@storybook/addon-docs\` | Автогенерация документации |
| \`@storybook/addon-a11y\` | Проверка доступности       |

### addon-docs

Автоматически генерирует документацию из JSDoc комментариев и типов TypeScript:

\`\`\`typescript
interface ButtonProps {
  /** Текст кнопки */
  children: React.ReactNode;
  /** Вариант стиля */
  variant?: 'primary' | 'secondary';
  /** Размер кнопки */
  size?: 'small' | 'medium' | 'large';
  /** Отключена ли кнопка */
  disabled?: boolean;
}
\`\`\`

### addon-a11y

Проверяет компоненты на соответствие стандартам доступности (WCAG).

---

## argTypes

### Управление controls

\`\`\`typescript
argTypes: {
  // Скрыть control
  children: { control: false },

  // Текстовый input
  title: { control: 'text' },

  // Boolean checkbox
  disabled: { control: 'boolean' },

  // Number input
  count: { control: { type: 'number', min: 0, max: 10 } },

  // Select
  variant: {
    control: 'select',
    options: ['primary', 'secondary', 'tertiary'],
  },

  // Radio
  size: {
    control: 'radio',
    options: ['small', 'medium', 'large'],
  },

  // Color picker
  color: { control: 'color' },

  // Описание
  onClick: {
    control: false,
    description: 'Callback при клике',
    table: {
      type: { summary: '() => void' },
    },
  },
}
\`\`\`

---

## Тема

### Переключение темы

Тема переключается через toolbar в Storybook. Глобальный параметр \`theme\` доступен в декораторах:

\`\`\`typescript
globalTypes: {
  theme: {
    description: 'Global theme for components',
    defaultValue: 'light',
    toolbar: {
      title: 'Theme',
      icon: 'circlehollow',
      items: ['light', 'dark'],
      dynamicTitle: true,
    },
  },
},
\`\`\`

### Использование в декораторе

\`\`\`typescript
decorators: [
  (Story, context) => {
    const theme = context.globals?.theme || 'light';
    const muiTheme = theme === 'dark' ? themeDark : themeLight;

    return (
      <ThemeProvider theme={muiTheme}>
        <CssBaseline />
        <Story />
      </ThemeProvider>
    );
  },
],
\`\`\`

---

## Best Practices

### Структура story файла

\`\`\`typescript
// 1. Импорты
import type { Meta, StoryObj } from '@storybook/react';
import { MyComponent } from './MyComponent';

// 2. Meta конфигурация
const meta = {
  title: 'Components/MyComponent',
  component: MyComponent,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  argTypes: {
    /* ... */
  },
} satisfies Meta<typeof MyComponent>;

export default meta;
type Story = StoryObj<typeof meta>;

// 3. Stories в порядке важности
export const Default: Story = {
  args: {
    /* ... */
  },
};
export const Variant: Story = {
  args: {
    /* ... */
  },
};
export const WithState: Story = {
  render: () => {
    /* ... */
  },
};
\`\`\`

### Именование

\`\`\`typescript
// ✅ Правильно — понятные имена
export const Primary: Story = {};
export const Disabled: Story = {};
export const WithLongText: Story = {};
export const Loading: Story = {};

// ❌ Неправильно — непонятные имена
export const Test1: Story = {};
export const Example: Story = {};
\`\`\`

### Покрытие вариантов

Создавайте stories для:

- Основного состояния (Default)
- Всех вариантов (Primary, Secondary)
- Всех размеров (Small, Medium, Large)
- Всех состояний (Disabled, Loading, Error)
- Граничных случаев (Empty, WithLongText)

---

## Команды

| Команда                   | Описание                         |
| ------------------------- | -------------------------------- |
| \`npm run storybook\`       | Запуск dev-сервера на порту 6006 |
| \`npm run build-storybook\` | Сборка статического Storybook    |


---

# Тестирование

Проект использует **Vitest** для модульного тестирования и **Testing Library** для тестирования React-компонентов.

---

## Быстрый старт

\`\`\`bash
# Тестировать всё
npm run test

# Тестировать host-приложение
npm run test:host

# Тестировать конкретную библиотеку
npm run test:lib -- --name=common

# Тестировать конкретный модуль
npm run test:module -- --name=todo

# Тестировать все библиотеки
npm run test:libs

# Тестировать все модули
npm run test:modules
\`\`\`

---

## Структура тестов

\`\`\`
project/
├── host/
│   ├── src/
│   │   ├── bootstrap/
│   │   │   ├── handlers/
│   │   │   │   └── __tests__/          # Тесты обработчиков
│   │   │   │       ├── DIHandler.test.ts
│   │   │   │       └── ModulesHandler.test.ts
│   │   │   └── __tests__/              # Тесты bootstrap
│   │   │       └── bootstrap.test.ts
│   ├── vite.config.mts                 # Конфиг Vitest (встроен)
│   └── vitest.setup.mts                # Setup файл
├── libs/
│   ├── common/
│   │   ├── src/
│   │   │   └── models/
│   │   │       └── __tests__/          # Тесты моделей
│   │   ├── vitest.config.ts            # Конфиг Vitest
│   │   └── vitest.setup.mts            # Setup файл
│   └── ui/
│       ├── src/
│       │   ├── hooks/__tests__/        # Тесты хуков
│       │   └── components/
│       │       └── ErrorBoundary/
│       │           └── ErrorBoundary.test.tsx
│       ├── vitest.config.ts
│       └── vitest.setup.mts
└── packages/
    └── todo/
        └── src/
            └── __tests__/              # Тесты модуля
\`\`\`

> **Соглашение**: Тесты размещаются в папке \`__tests__/\` рядом с тестируемым кодом или непосредственно рядом с файлом с суффиксом \`.test.ts(x)\` / \`.spec.ts(x)\`.

---

## Конфигурация Vitest

### Конфигурация для библиотеки

\`\`\`typescript
// libs/<lib>/vitest.config.ts
/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.mts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
  },
});
\`\`\`

### Setup файл

\`\`\`typescript
// vitest.setup.mts
import 'reflect-metadata';
import '@testing-library/jest-dom';
import { vi, beforeEach } from 'vitest';
import 'vitest-canvas-mock';

// Для глобального доступа к vi в тестах
global.vi = vi;

beforeEach(() => {
  process.env.NODE_ENV = 'test';
});
\`\`\`

### Опции конфигурации

| Опция                  | Описание                                      |
| ---------------------- | --------------------------------------------- |
| \`globals: true\`        | Делает \`describe\`, \`it\`, \`expect\` глобальными |
| \`environment: 'jsdom'\` | Эмуляция DOM для тестов                       |
| \`setupFiles\`           | Файлы, выполняемые перед каждым тестом        |
| \`include\`              | Паттерн для поиска тестовых файлов            |

---

## Написание тестов

### Базовый тест

\`\`\`typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { MyService } from './MyService';

describe('MyService', () => {
  let service: MyService;

  beforeEach(() => {
    service = new MyService();
  });

  it('должен выполнять действие', () => {
    const result = service.doSomething();
    expect(result).toBe('expected');
  });
});
\`\`\`

### Тест с моками

\`\`\`typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { APIClient } from '../APIClient';
import MockAdapter from 'axios-mock-adapter';

describe('APIClient', () => {
  let client: APIClient;
  let mock: MockAdapter;

  beforeEach(() => {
    client = new APIClient('http://example.com');
    mock = new MockAdapter(client.api);
  });

  afterEach(() => {
    mock.reset();
  });

  it('должен выполнять GET запрос', async () => {
    const responseData = { data: 'test' };
    mock.onGet('/users').reply(200, responseData);

    const result = await client.request({
      method: 'GET',
      route: '/users',
    });

    expect(result).toEqual(responseData);
  });

  it('должен обрабатывать ошибки', async () => {
    mock.onGet('/users').reply(500);

    await expect(
      client.request({ method: 'GET', route: '/users' }),
    ).rejects.toThrow();
  });
});
\`\`\`

### Тест React-компонента

\`\`\`typescript
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MyComponent } from './MyComponent';

describe('MyComponent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('должен отображать контент', () => {
    render(<MyComponent title="Test" />);

    expect(screen.getByText('Test')).toBeInTheDocument();
  });

  test('должен обрабатывать клик', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();

    render(<MyComponent onClick={onClick} />);

    await user.click(screen.getByRole('button'));

    expect(onClick).toHaveBeenCalled();
  });

  test('должен обновлять состояние', async () => {
    render(<MyComponent />);

    await userEvent.type(screen.getByRole('textbox'), 'hello');

    await waitFor(() => {
      expect(screen.getByDisplayValue('hello')).toBeInTheDocument();
    });
  });
});
\`\`\`

### Тест с DI-контейнером

\`\`\`typescript
import { describe, test, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useVM } from '../useVM';
import { DIProvider } from '../../providers/DIProvider';

const mockContainer: any = {
  get: (token: string) => token,
};

describe('useVM', () => {
  test('должен выбрасывать ошибку без DIContext', () => {
    expect(() => {
      renderHook(() => useVM('someVM'));
    }).toThrow('DI Container context not initialized');
  });

  test('должен возвращать ViewModel', () => {
    const wrapper = ({ children }: any) => (
      <DIProvider container={mockContainer}>{children}</DIProvider>
    );

    const { result } = renderHook(() => useVM('someVM'), { wrapper });

    expect(result.current).toBe('someVM');
  });
});
\`\`\`

### Тест модели MobX

\`\`\`typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { AccessControlModel } from '../accessControl.model';

describe('AccessControlModel', () => {
  let model: AccessControlModel;

  beforeEach(() => {
    model = new AccessControlModel();
  });

  describe('setFeatureFlags', () => {
    it('должен устанавливать флаги', () => {
      const flags = { flag1: true, flag2: false };

      model.setFeatureFlags(flags);

      expect(model.allFeatureFlags).toEqual(flags);
    });

    it('должен перезаписывать существующие флаги', () => {
      model.setFeatureFlags({ flag1: true });
      model.setFeatureFlags({ flag2: false });

      expect(model.allFeatureFlags).toEqual({ flag2: false });
    });
  });

  describe('getFeatureFlag', () => {
    it('должен возвращать true для включённого флага', () => {
      model.setFeatureFlags({ 'test.flag': true });

      expect(model.getFeatureFlag('test.flag')).toBe(true);
    });

    it('должен возвращать false для несуществующего флага', () => {
      expect(model.getFeatureFlag('unknown')).toBe(false);
    });
  });
});
\`\`\`

### Тест обработчика bootstrap

\`\`\`typescript
import { type Bootstrap } from '../../index';
import { DIHandler } from '../DIHandler';

describe('DIHandler', () => {
  const bootstrapMock: Bootstrap = {
    initDI: vi.fn(),
  } as any;

  test('должен вызывать initDI', async () => {
    const handler = new DIHandler({});

    await handler.handle(bootstrapMock);

    expect(bootstrapMock.initDI).toBeCalled();
  });
});
\`\`\`

---

## Мокирование

### Мокирование модулей

\`\`\`typescript
// Мокаем весь модуль
vi.mock('@platform/core', () => ({
  log: {
    error: vi.fn(),
    info: vi.fn(),
  },
}));

// Мокаем частично
vi.mock('./utils', async () => {
  const actual = await vi.importActual('./utils');
  return {
    ...actual,
    specificFunction: vi.fn(),
  };
});
\`\`\`

### Мокирование функций

\`\`\`typescript
// Создание мока
const mockFn = vi.fn();

// Мок с возвращаемым значением
const mockFn = vi.fn().mockReturnValue('result');

// Мок с промисом
const mockFn = vi.fn().mockResolvedValue({ data: 'test' });

// Мок с реализацией
const mockFn = vi.fn().mockImplementation((arg) => arg * 2);

// Проверка вызовов
expect(mockFn).toHaveBeenCalled();
expect(mockFn).toHaveBeenCalledWith('arg');
expect(mockFn).toHaveBeenCalledTimes(2);
\`\`\`

### Мокирование axios

\`\`\`typescript
import MockAdapter from 'axios-mock-adapter';

const mock = new MockAdapter(axiosInstance);

// GET запрос
mock.onGet('/users').reply(200, { users: [] });

// POST с проверкой body
mock.onPost('/users', { name: 'John' }).reply(201, { id: 1 });

// Ошибка
mock.onGet('/error').reply(500, { message: 'Server error' });

// Сброс после теста
afterEach(() => mock.reset());
\`\`\`

### Мокирование window

\`\`\`typescript
// Мокирование location.reload
const reloadSpy = vi.fn();
Object.defineProperty(window, 'location', {
  value: { ...window.location, reload: reloadSpy },
  writable: true,
});

// Мокирование localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });
\`\`\`

---

## Запуск тестов

### npm-скрипты

| Команда                                  | Описание                    |
| ---------------------------------------- | --------------------------- |
| \`npm run test\`                           | Запуск всех тестов          |
| \`npm run test:host\`                      | Тесты host-приложения       |
| \`npm run test:lib -- --name=<lib>\`       | Тесты конкретной библиотеки |
| \`npm run test:libs\`                      | Тесты всех библиотек        |
| \`npm run test:module -- --name=<module>\` | Тесты конкретного модуля    |
| \`npm run test:modules\`                   | Тесты всех модулей          |

### Параметры скриптов

\`\`\`bash
# Режим наблюдения (watch mode)
npm run test:lib -- --name=common --watch

# UI режим
npm run test:lib -- --name=common --ui

# С покрытием кода
npm run test:lib -- --name=common --coverage

# Подробный вывод
npm run test:lib -- --name=common --verbose

# Несколько библиотек
npm run test:lib -- --name=common --name=core

# Через переменную окружения
MODULES=common,core npm run test:lib

# Параллельный запуск всех
npm run test:libs -- --parallel
\`\`\`

### Фильтрация тестов

\`\`\`bash
# Запуск конкретного файла
npx vitest run src/models/__tests__/myModel.test.ts

# Фильтр по имени теста
npx vitest run -t "должен возвращать"

# Запуск только изменённых тестов
npx vitest --changed
\`\`\`

---

## Покрытие кода

### Генерация отчёта

\`\`\`bash
npm run test:lib -- --name=common --coverage
\`\`\`

### Конфигурация coverage

\`\`\`typescript
// vitest.config.ts
export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      exclude: ['node_modules/', '**/*.test.ts', '**/*.spec.ts', '**/index.ts'],
    },
  },
});
\`\`\`

---

## Testing Library

### Основные запросы

\`\`\`typescript
// По тексту
screen.getByText('Submit');
screen.queryByText('Optional'); // null если нет
screen.findByText('Async'); // Promise

// По роли
screen.getByRole('button', { name: 'Submit' });
screen.getByRole('textbox');
screen.getByRole('heading', { level: 1 });

// По label
screen.getByLabelText('Email');

// По placeholder
screen.getByPlaceholderText('Enter name');

// По test-id
screen.getByTestId('submit-btn');
\`\`\`

### Взаимодействие с userEvent

\`\`\`typescript
import userEvent from '@testing-library/user-event';

const user = userEvent.setup();

// Клик
await user.click(element);

// Ввод текста
await user.type(input, 'hello');

// Очистка и ввод
await user.clear(input);
await user.type(input, 'new value');

// Выбор из select
await user.selectOptions(select, 'option-value');

// Keyboard events
await user.keyboard('{Enter}');
await user.keyboard('{Shift>}A{/Shift}'); // Shift+A
\`\`\`

### Асинхронные проверки

\`\`\`typescript
// waitFor — ожидание условия
await waitFor(() => {
  expect(screen.getByText('Loaded')).toBeInTheDocument();
});

// waitFor с таймаутом
await waitFor(() => expect(callback).toHaveBeenCalled(), { timeout: 3000 });

// findBy* — комбинация getBy + waitFor
const element = await screen.findByText('Async content');
\`\`\`

---

## Утилиты тестирования

### Подавление ошибок в консоли

\`\`\`typescript
beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});
\`\`\`

### Тестирование ошибок

\`\`\`typescript
// Синхронная ошибка
expect(() => throwingFunction()).toThrow('Error message');

// Асинхронная ошибка
await expect(asyncThrowingFunction()).rejects.toThrow('Error');
await expect(promise).rejects.toBeInstanceOf(CustomError);
\`\`\`

### Снапшот тестирование

\`\`\`typescript
test('соответствует снапшоту', () => {
  const { container } = render(<MyComponent />);
  expect(container).toMatchSnapshot();
});

// Inline snapshot
test('inline snapshot', () => {
  expect(result).toMatchInlineSnapshot(\`
    Object {
      "key": "value",
    }
  \`);
});
\`\`\`

---

## Best Practices

### Структура теста

\`\`\`typescript
describe('ComponentName', () => {
  // Setup
  beforeEach(() => {
    // Подготовка перед каждым тестом
  });

  afterEach(() => {
    // Очистка после каждого теста
    vi.clearAllMocks();
  });

  // Группировка по функциональности
  describe('метод или функция', () => {
    test('позитивный сценарий', () => {});
    test('граничный случай', () => {});
    test('обработка ошибки', () => {});
  });
});
\`\`\`

### Именование тестов

\`\`\`typescript
// ✅ Правильно — описывает поведение
test('должен возвращать пустой массив для пустого ввода', () => {});
test('должен выбрасывать ошибку при невалидных данных', () => {});

// ❌ Неправильно — описывает реализацию
test('вызывает fetchData', () => {});
test('проверяет массив', () => {});
\`\`\`

### Изоляция тестов

\`\`\`typescript
// ✅ Каждый тест независим
beforeEach(() => {
  model = new AccessControlModel(); // Новый экземпляр
});

// ❌ Разделяемое состояние между тестами
const model = new AccessControlModel(); // Опасно!
\`\`\`

### Тестирование API (Arrange-Act-Assert)

\`\`\`typescript
test('должен обрабатывать ответ', async () => {
  // Arrange — подготовка
  const expectedData = { id: 1, name: 'Test' };
  mock.onGet('/item').reply(200, expectedData);

  // Act — действие
  const result = await service.getItem();

  // Assert — проверка
  expect(result).toEqual(expectedData);
});
\`\`\`

---

## Интеграция с IDE

### VS Code

Установите расширение [Vitest](https://marketplace.visualstudio.com/items?itemName=vitest.explorer).

\`\`\`json
{
  "vitest.enable": true,
  "vitest.commandLine": "npx vitest"
}
\`\`\`

### WebStorm / IntelliJ IDEA

1. Откройте **Settings → Languages & Frameworks → JavaScript → Testing**
2. Выберите **Vitest** как фреймворк
3. Укажите путь к конфигурации

`;

/**
 * Страница документации: Инструменты.
 *
 * @component
 */
const ToolsPage: FC = () => {
  const { t } = useTranslation('doc-platform');

  return (
    <Container maxWidth={false} sx={{ padding: 0 }}>
      <Typography variant="h4" gutterBottom>
        {t('menu.tools')}
      </Typography>

      <Paper sx={(theme) => ({ width: '100%', p: theme.spacing(6) })}>
        <MarkdownRenderer content={pageMarkdown} />
      </Paper>
    </Container>
  );
};

export default ToolsPage;
