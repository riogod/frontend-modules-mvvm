# Vite Configuration Factory

Централизованная фабрика конфигураций Vite для монорепозитория.

## Преимущества

- ✅ **DRY принцип**: Один источник правды для всех конфигов
- ✅ **Расширяемость**: Легко добавить локальные настройки через `vite.config.local.mts`
- ✅ **Типобезопасность**: TypeScript типы для всех конфигов
- ✅ **Консистентность**: Единые настройки для всех проектов

## Использование

### Для host приложений

Создайте `vite.config.mts` в корне приложения:

```typescript
/// <reference types='vitest' />
import { defineConfig } from 'vite';
import { createViteConfig } from '@platform/vite-config';

export default defineConfig(
  createViteConfig({
    type: 'host',
    dirname: __dirname,
    // Опционально: путь к локальному конфигу для расширения
    localConfigPath: './vite.config.local.mts',
  }),
);
```

**Особенности конфига для host:**

- Включает React и SVGR плагины
- Настройки сервера (порт 4200) и preview (порт 4300)
- Сложная конфигурация сборки с manualChunks для оптимизации
- Поддержка режима analyze с визуализацией бандла
- Настройки для Vitest

### Для библиотек (libs)

Создайте `vite.config.mts` в корне библиотеки:

```typescript
/// <reference types='vitest' />
import { defineConfig } from 'vite';
import { createViteConfig } from '@platform/vite-config';

export default defineConfig(
  createViteConfig({
    type: 'lib',
    dirname: __dirname,
    libName: 'core', // или 'ui', 'common'
    external: ['react', 'react-dom', 'react/jsx-runtime'], // для ui добавьте больше
    // Опционально: путь к локальному конфигу для расширения
    localConfigPath: './vite.config.local.mts',
  }),
);
```

**Особенности конфига для lib:**

- Включает React плагин (опционально)
- Library mode с настройками для сборки библиотек
- Автоматическая поддержка dts плагина (отключается в тестах)
- Настройки для Vitest
- Специальные настройки для ui библиотеки (sourcemap, cssCodeSplit)

### Локальное расширение конфига

Вы можете создать `vite.config.local.mts` в любой директории для добавления специфичных настроек:

```typescript
export default {
  plugins: [
    // дополнительные плагины
  ],
  build: {
    // дополнительные настройки сборки
  },
  server: {
    // дополнительные настройки сервера
  },
};
```

Локальный конфиг автоматически объединится с базовым конфигом.

## API

### `createViteConfig(options)`

#### Параметры

- `type: 'base' | 'host' | 'lib'` - Тип конфигурации
  - `'base'` - Базовый конфиг для всех Vite проектов
  - `'host'` - Конфиг для host приложений с React и SVGR
  - `'lib'` - Конфиг для библиотек (library mode)
- `dirname: string` - Директория проекта (обычно `__dirname`)
- `libName?: string` - Имя библиотеки (для `type: 'lib'`)
- `cacheDir?: string` - Путь к директории для кеша
- `outDir?: string` - Путь к директории для сборки
- `coverageDir?: string` - Путь к директории для coverage отчетов
- `vitestSetupFile?: string` - Путь к файлу setup для vitest
- `react?: boolean` - Включить React поддержку (для lib)
- `svgr?: boolean` - Включить SVGR поддержку (для host)
- `dts?: boolean` - Включить dts плагин (для lib)
- `external?: string[]` - Внешние зависимости для библиотек
- `plugins?: UserConfig['plugins']` - Дополнительные плагины
- `resolve?: UserConfig['resolve']` - Дополнительные настройки resolve
- `build?: UserConfig['build']` - Дополнительные настройки build
- `server?: UserConfig['server']` - Дополнительные настройки server
- `preview?: UserConfig['preview']` - Дополнительные настройки preview
- `test?: InlineConfig` - Дополнительные настройки test
- `define?: UserConfig['define']` - Дополнительные define переменные
- `localConfigPath?: string` - Путь к локальному конфигу для расширения

## Структура

```
config/vite-config/
├── index.js              # Основные экспорты
├── index.d.ts            # TypeScript типы
├── base.config.js        # Базовый конфиг
├── host.config.js        # Конфиг для host приложений
├── lib.config.js         # Конфиг для библиотек
├── module.config.js      # Конфиг для модулей
├── createViteConfig.js   # Фабрика конфигураций
├── plugins/
│   ├── types.ts          # TypeScript типы для плагинов
│   ├── moduleAliases.js
│   ├── manifestMiddleware.js
│   └── loadManifest.js
├── build-utils/
│   ├── generateManifest.js
│   └── utils.js
├── package.json
├── tsconfig.json
└── README.md
```

## Миграция со старых конфигов

Старые `vite.config.mts` файлы можно заменить на простые обертки, которые используют фабрику. Все специфичные настройки можно вынести в `vite.config.local.mts`.
