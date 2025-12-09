# План реализации: Разделение Dev/Prod логики ModuleLoader

## Цель

Вынести "тяжелую" клиентскую логику (проверка циклических зависимостей, построение уровней, валидация прав) в отдельные файлы, которые будут использоваться **только в Development** режиме и **не попадут в Production-сборку**.

## Принцип работы

```
┌─────────────────────────────────────────────────────────────────────┐
│                         ModuleLoader                                 │
└─────────────────────────────────────────────────────────────────────┘
                                │
            ┌───────────────────┴───────────────────┐
            │                                       │
    ┌───────▼───────┐                       ┌───────▼───────┐
    │   PRODUCTION  │                       │  DEVELOPMENT  │
    │               │                       │               │
    │  • Сервер     │                       │  • Клиент     │
    │    прислал    │                       │    строит     │
    │    готовые    │                       │    граф       │
    │    уровни     │                       │    сам        │
    │               │                       │               │
    │  • Простой    │                       │  • Полная     │
    │    цикл       │                       │    валидация  │
    │    загрузки   │                       │               │
    └───────────────┘                       └───────────────┘
```

---

## Фаза 1: Подготовка новой структуры файлов

### 1.1 Новая структура директории `moduleLoader`

```
moduleLoader/
├── core/
│   ├── ModuleLoader.ts              # [МОДИФИЦИРОВАТЬ] Добавить развилку Dev/Prod
│   ├── ModuleRegistry.ts            # [БЕЗ ИЗМЕНЕНИЙ] Нужен в обоих режимах
│   └── ModuleStatusTracker.ts       # [БЕЗ ИЗМЕНЕНИЙ] Нужен в обоих режимах
│
├── strategies/
│   ├── LoadStrategy.ts              # [БЕЗ ИЗМЕНЕНИЙ] Интерфейс
│   ├── InitLoadStrategy.ts          # [МОДИФИЦИРОВАТЬ] Добавить развилку
│   ├── InitLoadStrategy.dev.ts      # [СОЗДАТЬ] Dev-логика для INIT
│   ├── NormalLoadStrategy.ts        # [МОДИФИЦИРОВАТЬ] Добавить развилку
│   └── NormalLoadStrategy.dev.ts    # [СОЗДАТЬ] Dev-логика для NORMAL
│
├── services/
│   ├── ConditionValidator.ts        # [ПЕРЕМЕСТИТЬ → dev/] Dev-only
│   ├── DependencyResolver.ts        # [ПЕРЕМЕСТИТЬ → dev/] Dev-only
│   ├── LifecycleManager.ts          # [БЕЗ ИЗМЕНЕНИЙ] Нужен в обоих режимах
│   └── RemoteModuleLoader.ts        # [БЕЗ ИЗМЕНЕНИЙ] Нужен в обоих режимах
│
├── utils/
│   ├── DependencyLevelBuilder.ts    # [ПЕРЕМЕСТИТЬ → dev/] Dev-only
│   ├── moduleUtils.ts               # [ЧАСТИЧНО] Некоторые функции нужны в Prod
│   └── index.ts                     # [МОДИФИЦИРОВАТЬ]
│
├── dev/                              # [СОЗДАТЬ] Dev-only модули
│   ├── index.ts                     # Экспорт всех dev-утилит
│   ├── ConditionValidator.ts        # Полная версия
│   ├── DependencyResolver.ts        # Полная версия
│   ├── DependencyLevelBuilder.ts    # Полная версия
│   └── devLoader.ts                 # Точка входа для dev-логики
│
├── prod/                             # [СОЗДАТЬ] Prod-only модули (заглушки)
│   ├── index.ts
│   └── ProdModuleExecutor.ts        # Простой исполнитель готовых уровней
│
├── types/
│   └── manifest.types.ts            # [СОЗДАТЬ] Типы для расширенного манифеста
│
└── index.ts                          # [МОДИФИЦИРОВАТЬ]
```

### 1.2 Создание директорий

```bash
mkdir -p host/src/bootstrap/services/moduleLoader/dev
mkdir -p host/src/bootstrap/services/moduleLoader/prod
```

---

## Фаза 2: Единый контракт манифеста

### Принцип: Один формат для Dev и Prod

Контракт манифеста **остается единым**. Разница только в том, что делает сервер:

| Аспект | Dev | Prod |
|--------|-----|------|
| **Фильтрация по правам** | Клиент проверяет | Сервер фильтрует |
| **Сортировка по уровням** | Клиент строит | Сервер сортирует |
| **Структура `loadCondition`** | ✅ Полная | ✅ Полная (унификация) |

### 2.1 Существующие типы (без изменений)

Текущий интерфейс `Module` уже содержит все необходимое:

```typescript
// Уже существует в modules/interface.ts
interface Module {
  name: string;
  loadType: ModuleLoadType;  // INIT | NORMAL
  remoteEntry: string;
  loadPriority?: number;
  config: ModuleConfig | Promise<ModuleConfig>;
  loadCondition?: {
    dependencies?: string[];
    featureFlags?: string[];
    accessPermissions?: string[];
  };
}
```

**Вывод:** Новые типы манифеста НЕ нужны. Используем существующий `Module`.

### 2.2 Что меняется на сервере (вне скоупа фронта)

Сервер при генерации манифеста для Prod:
1. Фильтрует модули по `featureFlags` и `accessPermissions` текущего пользователя
2. Сортирует модули по уровням зависимостей (топологическая сортировка)
3. Возвращает **тот же формат**, но с уже отфильтрованными и отсортированными данными

---

## Фаза 3: Реализация Dev-модулей

### 3.1 Создать файл `dev/devLoader.ts`

Это точка входа для всей dev-логики. Она инкапсулирует все "тяжелые" операции.

```typescript
/**
 * DEV-ONLY: Этот файл НЕ включается в production-сборку.
 * Содержит логику построения графа зависимостей и валидации.
 *
 * @module dev/devLoader
 */

import { log } from '@platform/core';
import type { Module } from '../../../../modules/interface';
import type { Bootstrap } from '../../../index';
import type { ModuleRegistry } from '../core/ModuleRegistry';
import type { ModuleStatusTracker } from '../core/ModuleStatusTracker';
import type { LifecycleManager } from '../services/LifecycleManager';

import { ConditionValidator } from './ConditionValidator';
import { DependencyResolver } from './DependencyResolver';
import { DependencyLevelBuilder } from './DependencyLevelBuilder';

const LOG_PREFIX = 'moduleLoader.dev';

/**
 * Контекст для dev-загрузки модулей.
 */
export interface DevLoaderContext {
  registry: ModuleRegistry;
  statusTracker: ModuleStatusTracker;
  lifecycleManager: LifecycleManager;
  bootstrap: Bootstrap;
  autoLoadHandler?: (routeName: string) => Promise<void>;
}

/**
 * Загружает INIT модули в Dev-режиме.
 * Выполняет полную валидацию и построение порядка загрузки.
 */
export async function loadInitModulesDev(
  modules: Module[],
  context: DevLoaderContext,
): Promise<void> {
  log.debug('[DEV] Загрузка INIT модулей с полной валидацией', {
    prefix: LOG_PREFIX,
  });

  const { registry, statusTracker, lifecycleManager, bootstrap } = context;

  // Сортируем по приоритету
  const sortedModules = registry.sortModulesByPriority(modules);

  // Последовательная загрузка
  for (const module of sortedModules) {
    if (statusTracker.isLoaded(module.name)) {
      continue;
    }

    statusTracker.markAsLoading(module);

    try {
      await lifecycleManager.initializeModule(module, bootstrap, false);
      await lifecycleManager.registerModuleResources(
        module,
        bootstrap,
        (name: string) => statusTracker.isLoaded(name),
      );
      statusTracker.markAsLoaded(module);
    } catch (error) {
      statusTracker.markAsFailed(module, error);
      throw error;
    }
  }

  registry.setInitModulesLoaded(true);
  log.debug('[DEV] INIT модули загружены', { prefix: LOG_PREFIX });
}

/**
 * Загружает NORMAL модули в Dev-режиме.
 * Строит граф зависимостей, проверяет циклы, валидирует условия.
 */
export async function loadNormalModulesDev(
  modules: Module[],
  context: DevLoaderContext,
): Promise<void> {
  log.debug('[DEV] Загрузка NORMAL модулей с полной валидацией', {
    prefix: LOG_PREFIX,
  });

  const {
    registry,
    statusTracker,
    lifecycleManager,
    bootstrap,
    autoLoadHandler,
  } = context;

  // Инициализируем dev-сервисы
  const conditionValidator = new ConditionValidator();
  const dependencyResolver = new DependencyResolver(registry);

  // Проверяем циклические зависимости
  const modulesWithCircularDeps: string[] = [];
  for (const module of modules) {
    const hasDeps =
      module.loadCondition?.dependencies &&
      module.loadCondition.dependencies.length > 0;
    if (hasDeps && dependencyResolver.hasCircularDependencies(module)) {
      modulesWithCircularDeps.push(module.name);
    }
  }

  if (modulesWithCircularDeps.length > 0) {
    throw new Error(
      `[DEV] Циклические зависимости: ${modulesWithCircularDeps.join(', ')}`,
    );
  }

  // Строим уровни зависимостей
  const levelBuilder = new DependencyLevelBuilder(
    registry,
    (name: string) => statusTracker.isLoaded(name),
    (name: string) => statusTracker.isPreloaded(name),
  );

  const { levels, skippedModules } = levelBuilder.buildDependencyLevels(modules);

  if (skippedModules.length > 0) {
    log.warn(`[DEV] Пропущено модулей: ${skippedModules.length}`, {
      prefix: LOG_PREFIX,
    });
  }

  // Загружаем уровни
  for (let i = 0; i < levels.length; i++) {
    const levelModules = levels[i];
    log.debug(`[DEV] Уровень ${i + 1}/${levels.length}`, { prefix: LOG_PREFIX });

    await Promise.all(
      levelModules.map(async (module: Module) => {
        if (statusTracker.isLoadedOrLoading(module.name)) {
          return;
        }

        if (statusTracker.isPreloaded(module.name)) {
          statusTracker.markAsLoaded(module);
          return;
        }

        // Проверяем условия загрузки
        const canLoad = await conditionValidator.validateLoadConditions(
          module,
          bootstrap,
          (name: string) => statusTracker.isLoaded(name),
        );

        if (!canLoad) {
          statusTracker.markAsFailed(
            module,
            new Error(`Условия не выполнены: ${module.name}`),
          );
          return;
        }

        // Загружаем зависимости
        await dependencyResolver.loadDependencies(
          module,
          bootstrap,
          async (m: Module, b: Bootstrap) => {
            await loadSingleModuleDev(m, b, context);
          },
          (name: string) => statusTracker.isLoaded(name),
        );

        // Загружаем сам модуль
        await loadSingleModuleDev(module, bootstrap, context);
      }),
    );
  }

  log.debug('[DEV] NORMAL модули загружены', { prefix: LOG_PREFIX });
}

/**
 * Загружает один модуль в Dev-режиме.
 */
async function loadSingleModuleDev(
  module: Module,
  bootstrap: Bootstrap,
  context: DevLoaderContext,
): Promise<void> {
  const { statusTracker, lifecycleManager, autoLoadHandler } = context;

  if (statusTracker.isLoadedOrLoading(module.name)) {
    return;
  }

  statusTracker.markAsLoading(module);

  try {
    await lifecycleManager.initializeModule(module, bootstrap, false);
    await lifecycleManager.registerModuleResources(
      module,
      bootstrap,
      (name: string) => statusTracker.isLoaded(name),
      autoLoadHandler,
    );
    statusTracker.markAsLoaded(module);
  } catch (error) {
    statusTracker.markAsFailed(module, error);
    throw error;
  }
}
```

### 3.2 Переместить файлы в `dev/`

Скопировать (не удалять оригиналы пока):

```bash
cp services/ConditionValidator.ts dev/ConditionValidator.ts
cp services/DependencyResolver.ts dev/DependencyResolver.ts
cp utils/DependencyLevelBuilder.ts dev/DependencyLevelBuilder.ts
```

### 3.3 Создать `dev/index.ts`

```typescript
/**
 * DEV-ONLY: Экспорты для dev-режима.
 * Этот файл и все его зависимости не попадут в prod-сборку.
 */
export { loadInitModulesDev, loadNormalModulesDev } from './devLoader';
export type { DevLoaderContext } from './devLoader';
```

---

## Фаза 4: Реализация Prod-модулей

### 4.1 Создать `prod/ProdModuleExecutor.ts`

Простой исполнитель для предвычисленных уровней.

```typescript
/**
 * PROD-ONLY: Простой исполнитель для загрузки модулей.
 * Выполняет базовую проверку статусов зависимостей (защита от ошибок).
 *
 * @module prod/ProdModuleExecutor
 */

import { log } from '@platform/core';
import type { Module } from '../../../../modules/interface';
import type { Bootstrap } from '../../../index';
import type { ModuleRegistry } from '../core/ModuleRegistry';
import type { ModuleStatusTracker } from '../core/ModuleStatusTracker';
import type { LifecycleManager } from '../services/LifecycleManager';
import { ModuleLoadStatus } from '../types';

const LOG_PREFIX = 'moduleLoader.prod';

export interface ProdExecutorContext {
  registry: ModuleRegistry;
  statusTracker: ModuleStatusTracker;
  lifecycleManager: LifecycleManager;
  bootstrap: Bootstrap;
  autoLoadHandler?: (routeName: string) => Promise<void>;
}

// ============================================
// БАЗОВАЯ ЗАЩИТА: Проверка статусов зависимостей
// ============================================

/**
 * Результат проверки зависимостей.
 */
interface DependencyCheckResult {
  canLoad: boolean;
  failedDeps: string[];
  notLoadedDeps: string[];
}

/**
 * Проверяет, можно ли загружать модуль.
 * Это ЛЕГКОВЕСНАЯ проверка — только статусы, без построения графа.
 *
 * @param module - Модуль для проверки
 * @param statusTracker - Трекер статусов
 * @returns Результат проверки
 */
function checkDependencyStatuses(
  module: Module,
  statusTracker: ModuleStatusTracker,
): DependencyCheckResult {
  const deps = module.loadCondition?.dependencies ?? [];

  if (deps.length === 0) {
    return { canLoad: true, failedDeps: [], notLoadedDeps: [] };
  }

  const failedDeps = deps.filter(
    (name) => statusTracker.getStatus(name) === ModuleLoadStatus.FAILED
  );

  const notLoadedDeps = deps.filter(
    (name) => !statusTracker.isLoaded(name) && !failedDeps.includes(name)
  );

  // Если есть зависимости в FAILED статусе — не загружаем
  if (failedDeps.length > 0) {
    return { canLoad: false, failedDeps, notLoadedDeps };
  }

  // Если есть незагруженные зависимости — предупреждаем, но пробуем загрузить
  // (сервер должен был отсортировать правильно, но на всякий случай)
  return { canLoad: true, failedDeps: [], notLoadedDeps };
}

// ============================================
// Загрузка модулей
// ============================================

/**
 * Загружает INIT модули в Prod-режиме.
 * Простая последовательная загрузка с базовой защитой.
 */
export async function loadInitModulesProd(
  modules: Module[],
  context: ProdExecutorContext,
): Promise<void> {
  log.debug('[PROD] Загрузка INIT модулей', { prefix: LOG_PREFIX });

  const { registry, statusTracker, lifecycleManager, bootstrap } = context;

  for (const module of modules) {
    if (statusTracker.isLoaded(module.name)) {
      continue;
    }

    // Базовая защита: проверяем статусы зависимостей
    const { canLoad, failedDeps } = checkDependencyStatuses(module, statusTracker);
    if (!canLoad) {
      log.error(`[PROD] Модуль "${module.name}" пропущен: зависимости в FAILED статусе: ${failedDeps.join(', ')}`, {
        prefix: LOG_PREFIX,
      });
      statusTracker.markAsFailed(module, new Error(`Зависимости не загружены: ${failedDeps.join(', ')}`));
      continue;
    }

    statusTracker.markAsLoading(module);

    try {
      await lifecycleManager.initializeModule(module, bootstrap, false);
      await lifecycleManager.registerModuleResources(
        module,
        bootstrap,
        (name: string) => statusTracker.isLoaded(name),
      );
      statusTracker.markAsLoaded(module);
    } catch (error) {
      statusTracker.markAsFailed(module, error);
      log.error(`[PROD] Ошибка загрузки модуля ${module.name}`, {
        prefix: LOG_PREFIX,
        error: error instanceof Error ? error.message : String(error),
      });
      // В prod не бросаем ошибку, продолжаем загрузку остальных
    }
  }

  registry.setInitModulesLoaded(true);
}

/**
 * Загружает NORMAL модули в Prod-режиме.
 * Сервер уже разбил их на уровни — просто выполняем с базовой защитой.
 */
export async function loadNormalModulesProd(
  levels: Module[][],
  context: ProdExecutorContext,
): Promise<void> {
  log.debug(`[PROD] Загрузка NORMAL модулей: ${levels.length} уровней`, {
    prefix: LOG_PREFIX,
  });

  const { statusTracker, lifecycleManager, bootstrap, autoLoadHandler } = context;

  for (let i = 0; i < levels.length; i++) {
    const levelModules = levels[i];

    await Promise.all(
      levelModules.map(async (module: Module) => {
        if (statusTracker.isLoadedOrLoading(module.name)) {
          return;
        }

        if (statusTracker.isPreloaded(module.name)) {
          statusTracker.markAsLoaded(module);
          return;
        }

        // Базовая защита: проверяем статусы зависимостей
        const { canLoad, failedDeps, notLoadedDeps } = checkDependencyStatuses(module, statusTracker);

        if (!canLoad) {
          log.error(`[PROD] Модуль "${module.name}" пропущен: зависимости в FAILED статусе: ${failedDeps.join(', ')}`, {
            prefix: LOG_PREFIX,
          });
          statusTracker.markAsFailed(module, new Error(`Зависимости не загружены: ${failedDeps.join(', ')}`));
          return;
        }

        if (notLoadedDeps.length > 0) {
          log.warn(`[PROD] Модуль "${module.name}": не все зависимости загружены: ${notLoadedDeps.join(', ')}. Пробуем загрузить.`, {
            prefix: LOG_PREFIX,
          });
        }

        statusTracker.markAsLoading(module);

        try {
          await lifecycleManager.initializeModule(module, bootstrap, false);
          await lifecycleManager.registerModuleResources(
            module,
            bootstrap,
            (name: string) => statusTracker.isLoaded(name),
            autoLoadHandler,
          );
          statusTracker.markAsLoaded(module);
        } catch (error) {
          statusTracker.markAsFailed(module, error);
          log.error(`[PROD] Ошибка загрузки модуля ${module.name}`, {
            prefix: LOG_PREFIX,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }),
    );
  }
}
```

### 4.2 Создать `prod/index.ts`

```typescript
export { loadInitModulesProd, loadNormalModulesProd } from './ProdModuleExecutor';
export type { ProdExecutorContext } from './ProdModuleExecutor';
```

---

## Фаза 5: Модификация стратегий

### 5.1 Изменить `InitLoadStrategy.ts`

```typescript
/**
 * Стратегия загрузки INIT модулей.
 * В Dev-режиме использует полную валидацию.
 * В Prod-режиме использует простой исполнитель.
 */

import { log } from '@platform/core';
import { type Module, ModuleLoadType } from '../../../../modules/interface';
import type { Bootstrap } from '../../../index';
import type { ILoadStrategy } from './LoadStrategy';
import type { ModuleRegistry } from '../core/ModuleRegistry';
import type { ModuleStatusTracker } from '../core/ModuleStatusTracker';
import type { LifecycleManager } from '../services/LifecycleManager';
import { loadInitModulesProd } from '../prod';

const LOG_PREFIX = 'moduleLoader.initStrategy';

export class InitLoadStrategy implements ILoadStrategy {
  public readonly name = 'InitLoadStrategy';

  constructor(
    private readonly registry: ModuleRegistry,
    private readonly statusTracker: ModuleStatusTracker,
    private readonly lifecycleManager: LifecycleManager,
  ) {}

  public isApplicable(module: Module): boolean {
    return module.loadType === ModuleLoadType.INIT;
  }

  public async loadModules(
    modules: Module[],
    bootstrap: Bootstrap,
  ): Promise<void> {
    if (this.registry.isInitModulesLoaded) {
      throw new Error('INIT модули уже загружены');
    }

    const initModules = modules.filter((m) => this.isApplicable(m));
    const sortedModules = this.registry.sortModulesByPriority(initModules);

    // === РАЗВИЛКА Dev/Prod ===
    if (import.meta.env.DEV) {
      log.debug('[DEV] Используем dev-загрузчик для INIT модулей', {
        prefix: LOG_PREFIX,
      });

      // Динамический импорт dev-логики (не попадет в prod-бандл)
      const { loadInitModulesDev } = await import('../dev');
      await loadInitModulesDev(sortedModules, {
        registry: this.registry,
        statusTracker: this.statusTracker,
        lifecycleManager: this.lifecycleManager,
        bootstrap,
      });
    } else {
      log.debug('[PROD] Используем prod-загрузчик для INIT модулей', {
        prefix: LOG_PREFIX,
      });

      await loadInitModulesProd(sortedModules, {
        registry: this.registry,
        statusTracker: this.statusTracker,
        lifecycleManager: this.lifecycleManager,
        bootstrap,
      });
    }
  }
}
```

### 5.2 Изменить `NormalLoadStrategy.ts`

```typescript
/**
 * Стратегия загрузки NORMAL модулей.
 * В Dev-режиме строит граф и проверяет зависимости.
 * В Prod-режиме использует готовые уровни от сервера.
 */

import { log } from '@platform/core';
import { type Module, ModuleLoadType } from '../../../../modules/interface';
import type { Bootstrap } from '../../../index';
import type { ILoadStrategy } from './LoadStrategy';
import type { ModuleRegistry } from '../core/ModuleRegistry';
import type { ModuleStatusTracker } from '../core/ModuleStatusTracker';
import type { LifecycleManager } from '../services/LifecycleManager';
import type { AutoLoadByRouteFunction } from '../types';
import { loadNormalModulesProd } from '../prod';

const LOG_PREFIX = 'moduleLoader.normalStrategy';

export class NormalLoadStrategy implements ILoadStrategy {
  public readonly name = 'NormalLoadStrategy';

  constructor(
    private readonly registry: ModuleRegistry,
    private readonly statusTracker: ModuleStatusTracker,
    private readonly lifecycleManager: LifecycleManager,
    private readonly autoLoadHandler: AutoLoadByRouteFunction,
  ) {}

  public isApplicable(module: Module): boolean {
    const loadType = module.loadType ?? ModuleLoadType.NORMAL;
    return loadType === ModuleLoadType.NORMAL;
  }

  public async loadModules(
    modules: Module[],
    bootstrap: Bootstrap,
  ): Promise<void> {
    if (!this.registry.isInitModulesLoaded) {
      throw new Error('INIT модули должны быть загружены первыми');
    }

    const normalModules = modules.filter((m) => this.isApplicable(m));
    const sortedModules = this.registry.sortModulesByPriority(normalModules);

    // === РАЗВИЛКА Dev/Prod ===
    if (import.meta.env.DEV) {
      log.debug('[DEV] Используем dev-загрузчик для NORMAL модулей', {
        prefix: LOG_PREFIX,
      });

      // Динамический импорт dev-логики
      const { loadNormalModulesDev } = await import('../dev');
      await loadNormalModulesDev(sortedModules, {
        registry: this.registry,
        statusTracker: this.statusTracker,
        lifecycleManager: this.lifecycleManager,
        bootstrap,
        autoLoadHandler: this.autoLoadHandler,
      });
    } else {
      log.debug('[PROD] Используем prod-загрузчик для NORMAL модулей', {
        prefix: LOG_PREFIX,
      });

      // В prod-режиме считаем, что модули уже отсортированы сервером
      // TODO: Когда сервер будет возвращать уровни, использовать их
      // Пока используем плоский список как один уровень
      await loadNormalModulesProd([sortedModules], {
        registry: this.registry,
        statusTracker: this.statusTracker,
        lifecycleManager: this.lifecycleManager,
        bootstrap,
        autoLoadHandler: this.autoLoadHandler,
      });
    }
  }
}
```

---

## Фаза 6: Очистка и оптимизация

### 6.1 Удаление неиспользуемых импортов из стратегий

После внесения изменений, проверить что в Prod-версии стратегий нет импортов:

- `ConditionValidator`
- `DependencyResolver`
- `DependencyLevelBuilder`

### 6.2 Обновить `ModuleLoader.ts`

Убрать инициализацию dev-сервисов из конструктора:

```typescript
// БЫЛО:
private readonly conditionValidator: ConditionValidator;
private readonly dependencyResolver: DependencyResolver;

constructor() {
  this.conditionValidator = new ConditionValidator();
  this.dependencyResolver = new DependencyResolver(this.registry);
}

// СТАЛО:
// Эти поля больше не нужны в ModuleLoader
// Они создаются внутри dev/devLoader.ts только в Dev-режиме
```

### 6.3 Удалить оригинальные файлы (после тестирования!)

```bash
# Только после полного тестирования!
rm services/ConditionValidator.ts
rm services/DependencyResolver.ts
rm utils/DependencyLevelBuilder.ts
```

---

## Фаза 7: Тестирование

### 7.1 Проверка Dev-режима

```bash
npm run dev
```

- [ ] Модули загружаются корректно
- [ ] Циклические зависимости детектируются
- [ ] Условия загрузки проверяются
- [ ] В консоли видны логи `[DEV]`

### 7.2 Проверка Prod-режима

```bash
npm run build
npm run preview
```

- [ ] Сборка успешна
- [ ] В бандле отсутствуют `ConditionValidator`, `DependencyResolver`, `DependencyLevelBuilder`
- [ ] Модули загружаются корректно
- [ ] В консоли видны логи `[PROD]`

### 7.3 Проверка размера бандла

```bash
npm run build -- --report
```

Сравнить размер `moduleLoader` чанка до и после изменений.

---

## Фаза 8: Документация

### 8.1 Обновить README.md

Добавить секцию про Dev/Prod режимы.

### 8.2 Обновить component-diagram.puml

Добавить `dev/` и `prod/` пакеты.

---

## Чек-лист реализации

- [ ] Фаза 1: Создать структуру директорий (`dev/`, `prod/`)
- [ ] Фаза 2: ~~Создать типы манифеста~~ — НЕ НУЖНО, используем существующий `Module`
- [ ] Фаза 3: Реализовать dev-модули (`devLoader.ts`, переместить файлы)
- [ ] Фаза 4: Реализовать prod-модули (`ProdModuleExecutor.ts` с базовой защитой)
- [ ] Фаза 5: Модифицировать стратегии (добавить `if (import.meta.env.DEV)`)
- [ ] Фаза 6: Очистить неиспользуемый код из `ModuleLoader.ts`
- [ ] Фаза 7: Протестировать оба режима
- [ ] Фаза 8: Обновить документацию

---

## Ожидаемый результат

### До оптимизации

```
moduleLoader chunk: ~45 KB
├── ModuleLoader.ts
├── ModuleRegistry.ts
├── ModuleStatusTracker.ts
├── ConditionValidator.ts      ← 12 KB
├── DependencyResolver.ts      ← 12 KB
├── DependencyLevelBuilder.ts  ← 11 KB
└── ...
```

### После оптимизации (Prod)

```
moduleLoader chunk: ~20 KB  (экономия ~55%)
├── ModuleLoader.ts
├── ModuleRegistry.ts
├── ModuleStatusTracker.ts
├── ProdModuleExecutor.ts      ← 3 KB
└── ...
```

Dev-логика не включается в production-сборку благодаря динамическому `import()` и dead code elimination.
