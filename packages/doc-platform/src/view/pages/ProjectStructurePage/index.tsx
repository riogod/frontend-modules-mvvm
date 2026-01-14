import { type FC } from 'react';
import { Container, Typography, Paper } from '@platform/ui';
import { useTranslation } from 'react-i18next';
import { MarkdownRenderer } from '../../common';

const pageMarkdown = `# Структура проекта

Проект организован как монорепозиторий с использованием npm workspaces. Структура разделена на логические области: хост-приложение, библиотеки, модули, конфигурации и скрипты.

## Корневая структура

\`\`\`
frontend-modules-mvvm/
├── host/                   # Хост-приложение
├── libs/                   # Библиотеки платформы
├── packages/               # Бизнес-модули
├── config/                 # Конфигурации инструментов
├── scripts/                # Скрипты сборки и разработки
├── docs/                   # Документация
├── dist/                   # Артефакты сборки
├── package.json            # Корневой package.json
└── tsconfig.base.json      # Базовая конфигурация TypeScript
\`\`\`

## host/ — Хост-приложение

Хост-приложение — точка входа и координатор всей системы. Содержит механизмы инициализации, загрузки модулей и базовые компоненты платформы.

\`\`\`
host/
├── src/
│   ├── bootstrap/          # Система инициализации
│   │   ├── handlers/       # Обработчики инициализации
│   │   ├── services/       # Сервисы платформы
│   │   │   ├── appStart/   # Загрузка стартовых данных (манифеста приложения)
│   │   │   ├── moduleLoader/  # Загрузчик модулей
│   │   │   └── router/     # Сервис роутинга
│   │   ├── index.ts        # Точка входа bootstrap
│   │   └── interface.ts    # Интерфейсы
│   ├── config/             # Конфигурация приложения
│   ├── modules/            # Локальные модули (INIT)
│   │   ├── core/           # Базовый модуль
│   │   ├── core.layout/    # Модуль макета
│   │   └── local-normal/   # Пример локального NORMAL-модуля
│   ├── mocks/              # Моки для разработки
│   ├── main.tsx            # Точка входа React
│   └── main.css            # Глобальные стили
├── public/                 # Статические файлы
├── index.html              # HTML-шаблон
├── vite.config.mts         # Конфигурация Vite
└── tsconfig.json           # Конфигурация TypeScript
\`\`\`

### bootstrap/handlers/

Обработчики выполняются последовательно при старте приложения:

| Обработчик         | Назначение                                   |
| ------------------ | -------------------------------------------- |
| \`APIClient\`        | Инициализация HTTP-клиента                   |
| \`FederationShared\` | Настройка shared scope для Module Federation |
| \`ModulesDiscovery\` | Получение списка модулей с сервера           |
| \`Router\`           | Инициализация роутера                        |
| \`DI\`               | Настройка DI-контейнера                      |
| \`InitI18n\`         | Инициализация интернационализации            |
| \`OnAppStart\`       | Загрузка начальных данных приложения         |
| \`Modules\`          | Загрузка INIT-модулей                        |
| \`RouterPost\`       | Финализация роутинга                         |
| \`HTTPError\`        | Настройка обработки HTTP-ошибок              |

### bootstrap/services/moduleLoader/

Система загрузки модулей:

\`\`\`
moduleLoader/
├── core/               # Ядро загрузчика
│   ├── ModuleLoader.ts        # Основной загрузчик
│   ├── ModuleRegistry.ts      # Реестр модулей
│   └── ModuleStatusTracker.ts # Отслеживание статусов
├── dev/                # Режим разработки
├── prod/               # Продакшен-режим
├── services/           # Вспомогательные сервисы
├── strategies/         # Стратегии загрузки (INIT/NORMAL)
├── types/              # TypeScript типы
└── errors/             # Обработка ошибок
\`\`\`

## libs/ — Библиотеки платформы

Библиотеки предоставляют инфраструктурный код, переиспользуемый хостом и модулями.

\`\`\`
libs/
├── core/       # Базовая инфраструктура
├── common/     # Общие модели и usecases
├── ui/         # UI-компоненты и хуки
└── share/      # Библиотека для шаринга сущностей и компонент между модулями
\`\`\`

### libs/core/

Базовая инфраструктура платформы:

\`\`\`
core/src/
├── APIClient/          # HTTP-клиент на базе axios
│   ├── APIClient.ts    # Основной класс
│   ├── AbortControllerStorage.ts  # Управление отменой запросов
│   └── UrlNormalizer.ts  # Нормализация URL
├── Logger/             # Система логирования
├── ModuleInterfaces/   # Интерфейсы модулей
├── Router/             # Типы роутинга
└── index.ts            # Экспорт + IOC_CORE_TOKENS
\`\`\`

**Экспортирует:**

- \`APIClient\` — HTTP-клиент с поддержкой отмены запросов
- \`log\` — логгер с уровнями и префиксами
- \`IOC_CORE_TOKENS\` — Системные токены для DI-контейнера
- Типы для роутинга и модулей

### libs/common/

Общие бизнес-сущности:

\`\`\`
common/src/
├── models/
│   └── access_control/     # Модель контроля доступа
│       ├── accessControl.model.ts
│       └── accessControl.interface.ts
└── usecases/
    ├── featureFlag/        # Работа с feature flags
    └── permission/         # Работа с разрешениями
\`\`\`

**Экспортирует:**

- \`AccessControlModel\` — управление feature flags и permissions
- Use cases для работы с флагами и разрешениями

### libs/ui/

UI-компоненты и React-утилиты:

\`\`\`
ui/src/
├── components/         # UI-компоненты
│   ├── ui/            # Базовые компоненты (IconButton)
│   └── utils/         # Утилитарные компоненты (ErrorBoundary)
├── hooks/
│   ├── useVM.ts       # Получение ViewModel из DI
│   └── useSharedComponent/  # Хук для получения shared компонента из DI
├── providers/
│   └── DIProvider.tsx # React-провайдер для DI
├── theme/             # Темы MUI
│   ├── themeLight.ts
│   ├── themeDark.ts
│   └── variables.css
├── mui_proxy/         # Проксированные MUI-компоненты
├── contexts.ts        # React-контексты
└── index.ts           # Публичный API
\`\`\`

**Экспортирует:**

- \`useVM\` — хук для получения ViewModel
- \`DIProvider\` — провайдер DI-контейнера
- \`ErrorBoundary\` — обработка ошибок React
- Темы и MUI-компоненты

### libs/share/

Разделяемые компоненты:

\`\`\`
share/src/
├── ThemeSchema/        # Обертка для темы
│   └── ThemeSchema.tsx
└── index.ts
\`\`\`

## packages/ — Бизнес-модули

Модули содержат бизнес-логику приложения. Каждый модуль — независимая единица со своей структурой MVVM.

\`\`\`
packages/
├── todo/           # Пример модуля Todo
├── api_example/    # Пример работы с API
└── app-test/       # Тестовый модуль
\`\`\`

### Структура модуля

Каждый модуль следует единой структуре:

\`\`\`
module-name/
├── src/
│   ├── config/             # Конфигурации модуля
│   │   ├── module_config.ts    # Главная конфигурация
│   │   ├── routes.ts           # Маршруты
│   │   ├── di.config.ts        # Настройка DI
│   │   ├── di.tokens.ts        # Токены DI для уровня модуля
│   │   ├── endpoints.ts        # API-эндпоинты
│   │   ├── i18n/               # Переводы
│   │   │   ├── en_module.json
│   │   │   └── ru_module.json
│   │   └── mocks/              # Моки для разработки модуля
│   ├── data/               # Слой Адаптеров с использованием патерна Repository
│   ├── models/             # Слой Model (данные и состояние)
│   ├── usecases/           # Слой Use Cases (бизнес-логика)
│   ├── viewmodels/         # Слой ViewModel (логика представления)
│   └── view/               # Слой View (React-компоненты)
│       ├── pages/          # Страницы
│       └── components/     # Компоненты страниц
├── index.html              # HTML для локальной разработки
├── package.json
├── tsconfig.json
├── vite.config.mts         # Конфигурация сборки
└── vite.config.local.mts   # Локальные настройки
\`\`\`

## config/ — Конфигурации инструментов

\`\`\`
config/
├── dev-server/         # Dev-сервер для API-проксирования
├── eslint-config/      # Конфигурации ESLint
│   ├── base.config.ts      # Базовые правила
│   ├── host.config.ts      # Для хоста
│   ├── lib.config.ts       # Для библиотек
│   └── module.config.ts    # Для модулей
└── vite-config/        # Конфигурации Vite
    ├── host.config.js      # Для хоста
    ├── lib.config.js       # Для библиотек
    ├── module.config.js    # Для модулей
    ├── plugins/            # Vite-плагины
    └── build-utils/        # Утилиты сборки
\`\`\`

## scripts/ — Скрипты

\`\`\`
scripts/
├── dev-runner.mjs          # CLI-лаунчер разработки
├── build-module.mjs        # Сборка модулей
├── lint-lib.mjs            # Линтинг библиотек
├── lint-module.mjs         # Линтинг модулей
├── test-lib.mjs            # Тесты библиотек
├── test-module.mjs         # Тесты модулей
├── sync-tsconfig-paths.mjs # Синхронизация путей
├── launcher/               # CLI-лаунчер
│   ├── cli/               # Команды CLI
│   ├── modules/           # Работа с модулями
│   └── runners/           # Запуск процессов
└── templates/              # Шаблоны для генерации
    └── module/            # Шаблон нового модуля MFE в пространстве /packages
\`\`\`

## dist/ — Артефакты сборки

\`\`\`
dist/
├── assets/             # Скомпилированные ассеты хоста
├── modules/            # Скомпилированные модули
│   └── module-name/
│       ├── latest/     # Последняя версия
│       └── 1.0.0/      # Версионированные сборки
├── index.html
└── reflect.min.js      # Полифилл для reflect-metadata
\`\`\`

## Соглашения об именовании

| Тип файла       | Формат           | Пример                   |
| --------------- | ---------------- | ------------------------ |
| Компонент React | PascalCase       | \`TodoPage.tsx\`           |
| Модель          | snake_case       | \`todo_list.model.ts\`     |
| ViewModel       | snake_case       | \`todo_list.vm.ts\`        |
| Use Case        | camelCase        | \`getTaskList.usecase.ts\` |
| Конфигурация    | snake_case       | \`module_config.ts\`       |
| Интерфейс       | snake_case       | \`todo_list.interface.ts\` |
| Тесты           | *.test.ts       | \`TodoModel.test.ts\`      |
| Переводы        | lang_module.json | \`en_todo.json\`           |

## npm Workspaces

Проект использует npm workspaces для управления зависимостями:

\`\`\`json
{
  "workspaces": ["host", "packages/*", "config/*", "libs/*"]
}
\`\`\`

Это обеспечивает:

- Единое дерево \`node_modules\` в корне
- Симлинки для локальных пакетов
- Консистентные версии зависимостей

## Алиасы путей

Проект использует алиасы для импортов:

| Алиас              | Путь              |
| ------------------ | ----------------- |
| \`@platform/core\`   | \`libs/core/src\`   |
| \`@platform/common\` | \`libs/common/src\` |
| \`@platform/ui\`     | \`libs/ui/src\`     |
| \`@platform/share\`  | \`libs/share/src\`  |

Алиасы настраиваются в \`tsconfig.base.json\` и синхронизируются скриптом \`sync-tsconfig-paths.mjs\`.

`;

/**
 * Страница документации по структуре проекта.
 * Содержит информацию о монорепозитории, структуре директорий,
 * соглашениях об именовании и алиасах путей.
 *
 * @component
 */
const ProjectStructurePage: FC = () => {
  const { t } = useTranslation('doc-platform');

  return (
    <Container maxWidth={false} sx={{ padding: 0 }}>
      <Typography variant="h4" gutterBottom>
        {t('menu.project-structure')}
      </Typography>

      <Paper sx={(theme) => ({ width: '100%', p: theme.spacing(6) })}>
        <MarkdownRenderer content={pageMarkdown} />
      </Paper>
    </Container>
  );
};

export default ProjectStructurePage;
