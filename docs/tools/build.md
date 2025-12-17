# Сборка проекта

Руководство по сборке host-приложения и MFE модулей.

---

## Быстрый старт

```bash
# Собрать всё (модули + host)
npm run build:all

# Собрать только host
npm run build:host

# Собрать только модули
npm run build:modules

# Собрать конкретный модуль
npm run build:module -- --name=todo
```

---

## Команды сборки

| Команда                                | Описание                       |
| -------------------------------------- | ------------------------------ |
| `npm run build`                        | Сборка host                    |
| `npm run build:host`                   | Сборка host                    |
| `npm run build:module -- --name=<m>`   | Сборка конкретного модуля      |
| `npm run build:modules`                | Сборка всех модулей            |
| `npm run build:all`                    | Сборка модулей + host          |
| `npm run build:host:analyze`           | Анализ бандла host             |
| `npm run analyze:module -- --name=<m>` | Анализ бандла модуля           |
| `npm run preview`                      | Предпросмотр production сборки |

---

## Структура dist/

После выполнения `npm run build:all`:

```
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
```

> **Важно**: Папка `modules/` сохраняется при пересборке host. Это позволяет собирать модули и host независимо.

---

## Сборка Host

### Команда

```bash
npm run build:host
```

### Конфигурация

Host использует `config/vite-config/host.config.js`:

```javascript
{
  target: 'esnext',
  minify: 'esbuild',
  sourcemap: true,
  cssCodeSplit: false,
  modulePreload: false,
  emptyOutDir: false,  // Сохраняет modules/
}
```

---

## Сборка модулей

### Скрипт build-module.mjs

```bash
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
```

### Параметры

| Параметр     | Описание                     |
| ------------ | ---------------------------- |
| `--name=<m>` | Имя модуля для сборки        |
| `--all`      | Собрать все модули           |
| `--parallel` | Параллельная сборка          |
| `--analyze`  | Анализ размера бандла        |
| `--verbose`  | Подробный вывод              |
| `--modules=` | Список модулей через запятую |

### Версионирование

Каждый модуль собирается в две директории:

- `latest/` — всегда актуальная версия
- `{version}/` — копия для версионирования (из `package.json`)

```bash
# Обновить версию модуля
node scripts/version-module.mjs todo patch   # 1.0.0 → 1.0.1
node scripts/version-module.mjs todo minor   # 1.0.0 → 1.1.0
node scripts/version-module.mjs todo major   # 1.0.0 → 2.0.0

# Интерактивный режим
node scripts/version-module.mjs
```

---

## Переменные окружения

### При сборке

```bash
# Установить уровень логирования
LOG_LEVEL=ERROR npm run build:host

# Установить префикс приложения
VITE_APP_PREFIX=/app/ npm run build:host

# Установить Апи урл
VITE_API_URL=https://api.example.com/backend npm run build:host
```

## Связанные разделы

- [Подготовка к продакшену](../deployment/production.md) — оптимизация сборки
- [CI/CD](../deployment/cicd.md) — автоматизация сборки
- [Лаунчер](./launcher.md) — локальная разработка
- [Типы модулей](../modules/module-types.md) — INIT и NORMAL модули
