# План реализации MFE (Micro-Frontends) Architecture

## Цель
Трансформировать текущий модульный монолит в гибридную MFE архитектуру с "Zero-Config" DX.
Обеспечить бесшовную работу в режиме монорепозитория с возможностью независимого деплоя модулей.

---

## Этап 1: Реструктуризация проекта (Monorepo Setup)

Переход к структуре npm workspaces для явного выделения границ модулей.

1. **Изменение структуры папок**:
   - Создать директорию `packages/` в корне.
   - Перенести **только бизнес-модули** из `app/src/modules/*` в `packages/*`.
     - *Пример*: `app/src/modules/todo` -> `packages/todo`.
   - **Core модули** (`core`, `core.layout`, `core.access`) остаются в `app/src/modules/`. Они являются частью Host-приложения и загружаются статически.
   - `app/` остается как Host Application (Shell).
   - `libs/` остаются как общие библиотеки (Shared Kernel).

2. **Настройка Workspaces**:
   - Обновить корневой `package.json`:
     ```json
     "workspaces": [
       "app",
       "packages/*",
       "libs/*"
     ]
     ```
   - В каждый модуль (например, `packages/todo`) добавить `package.json`:
     ```json
     {
       "name": "@my-app/module-todo",
       "version": "1.0.0",
       "main": "src/index.ts",
       "peerDependencies": {
         "react": "*",
         "@my-app/core": "*"
       }
     }
     ```

3. **Shared Kernel & Types**:
   - Обеспечить единую версию зависимостей через корневой `package-lock.json`.
   - `libs/core` подключается как workspace-зависимость во все модули.
   - Типы TypeScript резолвятся автоматически благодаря структуре монорепозитория.

---

## Этап 2: Создание CLI Orchestrator (The Runner)

Инструмент для интерактивного запуска проекта (`npm start`).

1. **Инструментарий**:
   - Скрипт `scripts/dev-runner.js`.
   - Зависимости: `prompts` (меню), `chalk` (логи), `dotenv` (чтение .env).

2. **Логика работы Runner**:
   - **Discovery**: Сканирует `packages/*` и формирует список доступных модулей.
   - **Configuration**:
     - Читает `.launcher-config.json` (последний выбор юзера).
     - Читает `.env` файл для получения базовых URL удаленных модулей (например, `REMOTE_TODO_URL=https://stage.com/modules/todo`).
   - **Interactive UI**:
     - Вопрос: "Какие модули запустить локально (с HMR)?" (Multiselect).
     - Остальные модули помечаются как Remote.
   - **Mock Server for Discovery**:
     - Поднимает легкий локальный HTTP-сервер (или middleware в Vite) для эмуляции эндпоинта `/app/start` (Manifest).
     - Генерирует JSON-ответ на лету на основе выбора пользователя:
       - *Local Modules*: URL = пустая строка или спец. флаг (Host загрузит их через import/alias).
       - *Remote Modules*: URL берется из `.env` (или дефолтный стейджинг).
   - **Launch Host**:
     - Запускает `vite` в папке `app`.
     - Передает список локальных модулей через ENV переменную `VITE_LOCAL_MODULES` для настройки алиасов.

---

## Этап 3: Настройка Host Application (Vite & Bootstrap)

Адаптация Host приложения для работы с динамическим списком модулей.

1. **Vite Config (Dynamic Aliases)**:
   - В `app/vite.config.ts` читать `process.env.VITE_LOCAL_MODULES`.
   - Генерировать `resolve.alias` для локальных модулей:
     `"@my-app/module-todo": path.resolve(__dirname, "../packages/todo/src")`
   - Это включает нативный HMR, так как Vite видит файлы как часть исходного кода.

2. **Bootstrap Logic (Manifest Loader & Eager Config)**:
   - **Split Modules Handling (Two-Phase Init)**:
     - Ввести **ModulesDiscoveryHandler** вторым в цепочке `initBootstrap` (после `APIClientHandler`).
       - Задача: Используя инициализированный API Client, выполнить запрос к `/app/start`.
       - Загрузка `remoteEntry` и конфигов, наполнение `bootstrap.modules`.
       - Это гарантирует, что запрос за манифестом будет авторизован и обработан корректно.
     - Переименовать текущий `ModulesHandler` в **ModulesInitHandler** (оставить на своем месте, после MockService).
       - Задача: Регистрация роутов, DI, вызов `onModuleInit`.
   - **DI Strategy for Remotes**:
     - Remote модули должны регистрировать свои сервисы в DI по строковым токенам (например, `bind('ITodoService').to(TodoService)`) внутри `onModuleInit`.
   - **Registry**: Использование существующего `ModuleRegistry`.
   - **RemoteModuleLoader**:
     - Реализовать надежный загрузчик с поддержкой `retry` и таймаутов.
     - Экспортировать из модулей **только** файл конфигурации (`./Config`).
     - **Performance Strategy**:
       - Мы отказываемся от экспорта `Entry point` (index.ts) для Remote модулей, чтобы не загружать лишний код.
       - Метаданные модуля (имя, зависимости) берутся строго из манифеста `/app/start`.
       - Конфигурация загружается и применяется только тогда, когда она действительно нужна (при инициализации роутера).
       - Все тяжелые зависимости внутри конфига (компоненты роутов) должны быть ленивыми.

---

## Этап 4: Federation & Production Build

Настройка сборки для независимого развертывания.

1. **Vite Federation Config**:
   - В каждом модуле (`packages/*/vite.config.ts`) настроить плагин Federation:
     - `filename: 'remoteEntry.js'`
     - `exposes: { './Config': './src/config/module_config.ts' }`
     - **Важно**: Экспонируем напрямую файл конфигурации, минуя `index.ts`. Это минимизирует размер начального бандла (удаляет лишние импорты) и ускоряет инициализацию. Метаданные модуля (имя, зависимости) должны приходить из манифеста `/app/start`, а не из JS-кода.
     - `shared`: `react`, `mobx`, `@my-app/core` (singleton, requiredVersion: false).
   - Настроить `base` (publicPath) для корректной загрузки ассетов (CSS, images) с подпапки `/modules/{name}/`.

2. **CI/CD Strategy**:
   - Скрипт сборки (`npm run build:module --name=todo`):
     - Запускает `vite build` в соответствующей папке.
     - Артефакты складываются в `dist/modules/todo`.
   - Host собирается отдельно и деплоится в корень.
   - Структура деплоя:
     ```
     / (Host)
     /modules/todo/ (Remote Entry + Assets)
     /modules/auth/
     ```

---

## Этап 5: Стилизация и Изоляция

Решение проблем конфликтов стилей и тем.

1. **MUI Theming**:
   - Host предоставляет `ThemeProvider`.
   - Модули используют тему из контекста (через `shared` зависимость `@mui/material`).
   - Гарантируется консистентность UI.

2. **CSS Isolation**:
   - Использовать **CSS Modules** или **Styled Components** внутри модулей.
   - Запретить глобальные CSS файлы в модулях (кроме сброса стилей, если нужно, но лучше в Host).
   - Vite при сборке модуля автоматически добавит префиксы к классам.

---

## Чек-лист перед стартом
- [ ] Убедиться, что `libs/core` не имеет циклических зависимостей с модулями.
- [ ] Проверить, что все модули экспортируют единый интерфейс `Module` (через `src/index.ts`).
- [ ] Подготовить базовый `.env` файл с URL-ами для стейджинга.
