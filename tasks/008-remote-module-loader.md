# Задача 008: RemoteModuleLoader сервис

## Статус: ⚪ Не начата

## Описание

Создание сервиса `RemoteModuleLoader` для загрузки REMOTE модулей через Module Federation. Сервис обеспечивает загрузку `remoteEntry.js`, импорт конфига модуля (`./Config`), обработку ошибок и retry логику.

## Зависимости

- **Задача 007**: ModulesDiscoveryHandler (использует RemoteModuleLoader)

## Подзадачи

### 1. Создание типов для Remote Module Loading
- [ ] Создать `host/src/bootstrap/services/remoteModuleLoader/types.ts`:
  ```typescript
  export interface RemoteModuleConfig {
    name: string;
    entry: string;
    scope: string;
  }
  
  export interface LoadRemoteModuleOptions {
    /**
     * Количество попыток загрузки
     * @default 3
     */
    retries?: number;
    
    /**
     * Таймаут загрузки в миллисекундах
     * @default 10000
     */
    timeout?: number;
    
    /**
     * Задержка между попытками в миллисекундах
     * @default 1000
     */
    retryDelay?: number;
  }
  
  export interface RemoteContainer {
    init: (shareScope: Record<string, any>) => Promise<void>;
    get: (module: string) => Promise<() => any>;
  }
  
  declare global {
    interface Window {
      [key: string]: RemoteContainer | undefined;
    }
  }
  ```

### 2. Создание RemoteModuleLoader сервиса
- [ ] Создать `host/src/bootstrap/services/remoteModuleLoader/RemoteModuleLoader.ts`:
  ```typescript
  import type { ModuleConfig } from '../../interface';
  import type { 
    RemoteModuleConfig, 
    LoadRemoteModuleOptions, 
    RemoteContainer 
  } from './types';
  
  /**
   * Сервис для загрузки Remote модулей через Module Federation
   */
  export class RemoteModuleLoader {
    private cache = new Map<string, Promise<ModuleConfig>>();
    private loadedScripts = new Set<string>();
    
    /**
     * Загружает конфиг Remote модуля
     */
    async loadRemoteModule(
      name: string, 
      remoteEntry: string,
      options: LoadRemoteModuleOptions = {}
    ): Promise<ModuleConfig> {
      const { retries = 3, timeout = 10000, retryDelay = 1000 } = options;
      const cacheKey = `${name}:${remoteEntry}`;
      
      // Проверяем кеш
      if (this.cache.has(cacheKey)) {
        return this.cache.get(cacheKey)!;
      }
      
      // Создаем promise для загрузки
      const loadPromise = this.loadWithRetry(
        name, 
        remoteEntry, 
        retries, 
        timeout, 
        retryDelay
      );
      
      this.cache.set(cacheKey, loadPromise);
      
      try {
        return await loadPromise;
      } catch (error) {
        // Удаляем из кеша при ошибке для возможности повторной попытки
        this.cache.delete(cacheKey);
        throw error;
      }
    }
    
    private async loadWithRetry(
      name: string,
      remoteEntry: string,
      retries: number,
      timeout: number,
      retryDelay: number
    ): Promise<ModuleConfig> {
      let lastError: Error | null = null;
      
      for (let attempt = 1; attempt <= retries; attempt++) {
        try {
          console.log(`[RemoteModuleLoader] Loading ${name} (attempt ${attempt}/${retries})`);
          
          const config = await this.loadWithTimeout(name, remoteEntry, timeout);
          
          console.log(`[RemoteModuleLoader] Successfully loaded ${name}`);
          return config;
          
        } catch (error) {
          lastError = error as Error;
          console.warn(
            `[RemoteModuleLoader] Failed to load ${name} (attempt ${attempt}/${retries}):`,
            error
          );
          
          if (attempt < retries) {
            await this.delay(retryDelay);
          }
        }
      }
      
      throw new Error(
        `Failed to load remote module "${name}" after ${retries} attempts: ${lastError?.message}`
      );
    }
    
    private async loadWithTimeout(
      name: string,
      remoteEntry: string,
      timeout: number
    ): Promise<ModuleConfig> {
      return Promise.race([
        this.doLoad(name, remoteEntry),
        this.createTimeoutPromise(timeout, name),
      ]);
    }
    
    private createTimeoutPromise(timeout: number, name: string): Promise<never> {
      return new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error(`Timeout loading remote module "${name}" after ${timeout}ms`));
        }, timeout);
      });
    }
    
    private async doLoad(name: string, remoteEntry: string): Promise<ModuleConfig> {
      const scope = `module_${name.replace(/-/g, '_')}`;
      
      // 1. Загружаем remoteEntry.js
      await this.loadScript(remoteEntry, scope);
      
      // 2. Получаем контейнер
      const container = window[scope] as RemoteContainer;
      if (!container) {
        throw new Error(`Remote container "${scope}" not found after loading script`);
      }
      
      // 3. Инициализируем контейнер с shared scope
      await this.initContainer(container, scope);
      
      // 4. Получаем модуль ./Config
      const factory = await container.get('./Config');
      const moduleExports = factory();
      
      return moduleExports.default || moduleExports;
    }
    
    private async loadScript(url: string, scope: string): Promise<void> {
      // Проверяем, загружен ли уже скрипт
      if (this.loadedScripts.has(url)) {
        return;
      }
      
      return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = url;
        script.type = 'module';
        script.async = true;
        
        script.onload = () => {
          this.loadedScripts.add(url);
          resolve();
        };
        
        script.onerror = () => {
          reject(new Error(`Failed to load script: ${url}`));
        };
        
        document.head.appendChild(script);
      });
    }
    
    private async initContainer(container: RemoteContainer, scope: string): Promise<void> {
      // Получаем shared scope от webpack/vite
      // @ts-ignore - Module Federation runtime API
      const shareScope = __webpack_share_scopes__ || {};
      
      try {
        // Инициализируем default scope если не инициализирован
        // @ts-ignore
        if (!shareScope.default) {
          // @ts-ignore
          await __webpack_init_sharing__('default');
        }
        
        // Инициализируем контейнер
        await container.init(shareScope.default || {});
      } catch (error) {
        // Контейнер может быть уже инициализирован
        if (!(error as Error).message?.includes('already been initialized')) {
          throw error;
        }
      }
    }
    
    private delay(ms: number): Promise<void> {
      return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    /**
     * Очищает кеш загруженных модулей
     */
    clearCache(): void {
      this.cache.clear();
    }
    
    /**
     * Удаляет конкретный модуль из кеша
     */
    invalidateCache(name: string): void {
      for (const key of this.cache.keys()) {
        if (key.startsWith(`${name}:`)) {
          this.cache.delete(key);
        }
      }
    }
  }
  
  // Singleton instance
  export const remoteModuleLoader = new RemoteModuleLoader();
  ```

### 3. Создание вспомогательных функций
- [ ] Создать `host/src/bootstrap/services/remoteModuleLoader/utils.ts`:
  ```typescript
  /**
   * Проверяет доступность URL
   */
  export async function checkRemoteAvailability(url: string): Promise<boolean> {
    try {
      const response = await fetch(url, { method: 'HEAD', mode: 'cors' });
      return response.ok;
    } catch {
      return false;
    }
  }
  
  /**
   * Парсит URL remoteEntry и извлекает базовый путь
   */
  export function getRemoteBasePath(remoteEntry: string): string {
    const url = new URL(remoteEntry);
    return url.origin + url.pathname.substring(0, url.pathname.lastIndexOf('/') + 1);
  }
  
  /**
   * Создает scope имя из имени модуля
   */
  export function createScopeName(moduleName: string): string {
    return `module_${moduleName.replace(/-/g, '_')}`;
  }
  ```

### 4. Создание index.ts для экспорта
- [ ] Создать `host/src/bootstrap/services/remoteModuleLoader/index.ts`:
  ```typescript
  export { RemoteModuleLoader, remoteModuleLoader } from './RemoteModuleLoader';
  export { loadRemoteModule } from './loadRemoteModule';
  export * from './types';
  export * from './utils';
  ```

### 5. Создание упрощенной функции загрузки
- [ ] Создать `host/src/bootstrap/services/remoteModuleLoader/loadRemoteModule.ts`:
  ```typescript
  import { remoteModuleLoader } from './RemoteModuleLoader';
  import type { ModuleConfig } from '../../interface';
  import type { LoadRemoteModuleOptions } from './types';
  
  /**
   * Упрощенная функция для загрузки remote модуля
   * Использует singleton RemoteModuleLoader
   */
  export async function loadRemoteModule(
    name: string,
    remoteEntry: string,
    options?: LoadRemoteModuleOptions
  ): Promise<ModuleConfig> {
    return remoteModuleLoader.loadRemoteModule(name, remoteEntry, options);
  }
  ```

### 6. Интеграция с Vite Federation
- [ ] Создать `host/src/bootstrap/services/remoteModuleLoader/federation.d.ts`:
  ```typescript
  /**
   * Типы для Module Federation runtime API
   */
  declare const __webpack_share_scopes__: Record<string, Record<string, any>>;
  declare const __webpack_init_sharing__: (scope: string) => Promise<void>;
  
  declare module 'virtual:federation' {
    export function loadRemote<T = any>(id: string): Promise<T>;
  }
  ```

### 7. Создание Error типов
- [ ] Создать `host/src/bootstrap/services/remoteModuleLoader/errors.ts`:
  ```typescript
  export class RemoteModuleLoadError extends Error {
    constructor(
      public readonly moduleName: string,
      public readonly remoteEntry: string,
      public readonly originalError: Error,
      public readonly attempts: number
    ) {
      super(`Failed to load remote module "${moduleName}" from ${remoteEntry}: ${originalError.message}`);
      this.name = 'RemoteModuleLoadError';
    }
  }
  
  export class RemoteModuleTimeoutError extends Error {
    constructor(
      public readonly moduleName: string,
      public readonly timeout: number
    ) {
      super(`Timeout loading remote module "${moduleName}" after ${timeout}ms`);
      this.name = 'RemoteModuleTimeoutError';
    }
  }
  
  export class RemoteContainerNotFoundError extends Error {
    constructor(
      public readonly scope: string
    ) {
      super(`Remote container "${scope}" not found. Make sure remoteEntry.js was loaded correctly.`);
      this.name = 'RemoteContainerNotFoundError';
    }
  }
  ```

### 8. Создание тестов
- [ ] Создать `host/src/bootstrap/services/remoteModuleLoader/__tests__/RemoteModuleLoader.test.ts`:
  ```typescript
  import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
  import { RemoteModuleLoader } from '../RemoteModuleLoader';
  
  describe('RemoteModuleLoader', () => {
    let loader: RemoteModuleLoader;
    
    beforeEach(() => {
      loader = new RemoteModuleLoader();
      vi.useFakeTimers();
    });
    
    afterEach(() => {
      vi.useRealTimers();
      vi.restoreAllMocks();
    });
    
    describe('loadRemoteModule', () => {
      it('should cache loaded modules', async () => {
        // Mock implementation
        const mockConfig = { ROUTES: [] };
        vi.spyOn(loader as any, 'doLoad').mockResolvedValue(mockConfig);
        
        const result1 = await loader.loadRemoteModule('test', 'http://example.com/remoteEntry.js');
        const result2 = await loader.loadRemoteModule('test', 'http://example.com/remoteEntry.js');
        
        expect(result1).toBe(result2);
        expect((loader as any).doLoad).toHaveBeenCalledTimes(1);
      });
      
      it('should retry on failure', async () => {
        const mockError = new Error('Network error');
        const mockConfig = { ROUTES: [] };
        
        vi.spyOn(loader as any, 'doLoad')
          .mockRejectedValueOnce(mockError)
          .mockRejectedValueOnce(mockError)
          .mockResolvedValueOnce(mockConfig);
        
        vi.spyOn(loader as any, 'delay').mockResolvedValue(undefined);
        
        const result = await loader.loadRemoteModule('test', 'http://example.com/remoteEntry.js');
        
        expect(result).toBe(mockConfig);
        expect((loader as any).doLoad).toHaveBeenCalledTimes(3);
      });
      
      it('should throw after max retries', async () => {
        const mockError = new Error('Network error');
        
        vi.spyOn(loader as any, 'doLoad').mockRejectedValue(mockError);
        vi.spyOn(loader as any, 'delay').mockResolvedValue(undefined);
        
        await expect(
          loader.loadRemoteModule('test', 'http://example.com/remoteEntry.js', { retries: 2 })
        ).rejects.toThrow('Failed to load remote module');
      });
    });
    
    describe('clearCache', () => {
      it('should clear all cached modules', async () => {
        const mockConfig = { ROUTES: [] };
        vi.spyOn(loader as any, 'doLoad').mockResolvedValue(mockConfig);
        
        await loader.loadRemoteModule('test', 'http://example.com/remoteEntry.js');
        loader.clearCache();
        
        await loader.loadRemoteModule('test', 'http://example.com/remoteEntry.js');
        
        expect((loader as any).doLoad).toHaveBeenCalledTimes(2);
      });
    });
  });
  ```

### 9. Интеграция с ModulesDiscoveryHandler
- [ ] Обновить импорт в `ModulesDiscoveryHandler.ts`:
  ```typescript
  import { loadRemoteModule } from '../services/remoteModuleLoader';
  
  private createRemoteConfigLoader(moduleName: string, remoteEntry: string): Promise<ModuleConfig> {
    return loadRemoteModule(moduleName, remoteEntry, {
      retries: 3,
      timeout: 15000,
      retryDelay: 2000,
    });
  }
  ```

### 10. Логирование и мониторинг
- [ ] Добавить детальное логирование:
  ```typescript
  import { Logger } from '@platform/core';
  
  private logger = new Logger('RemoteModuleLoader');
  
  // В методах загрузки:
  this.logger.info(`Loading remote module: ${name}`, { remoteEntry, attempt });
  this.logger.warn(`Failed attempt ${attempt}/${retries}`, { error: error.message });
  this.logger.error(`Failed to load module after all retries`, { name, error });
  ```

## Definition of Done (DoD)

1. ✅ `RemoteModuleLoader` класс создан и реализует загрузку remote модулей
2. ✅ Retry логика работает с настраиваемым количеством попыток
3. ✅ Timeout protection реализован
4. ✅ Кеширование загруженных модулей работает
5. ✅ Типы для Module Federation runtime созданы
6. ✅ Error классы созданы для разных типов ошибок
7. ✅ Unit тесты написаны и проходят
8. ✅ Интеграция с `ModulesDiscoveryHandler` выполнена
9. ✅ Логирование добавлено
10. ✅ Документация JSDoc добавлена

## Архитектура

```
RemoteModuleLoader
├── loadRemoteModule(name, entry, options)
│   ├── Check cache
│   ├── loadWithRetry()
│   │   ├── attempt 1
│   │   │   └── loadWithTimeout()
│   │   │       ├── loadScript(remoteEntry.js)
│   │   │       ├── initContainer(shareScope)
│   │   │       └── container.get('./Config')
│   │   ├── delay(retryDelay)
│   │   ├── attempt 2...
│   │   └── attempt N
│   └── Update cache
├── clearCache()
└── invalidateCache(name)
```

## Процесс загрузки Remote модуля

```
1. Загрузка remoteEntry.js
   ↓
2. Получение контейнера из window[scope]
   ↓
3. Инициализация контейнера с shared scope
   container.init(__webpack_share_scopes__.default)
   ↓
4. Получение фабрики модуля
   const factory = await container.get('./Config')
   ↓
5. Выполнение фабрики
   const config = factory()
   ↓
6. Возврат конфига модуля
```

## Риски и митигация

| Риск | Вероятность | Влияние | Митигация |
|------|-------------|---------|-----------|
| CORS ошибки при загрузке | Высокая | Высокое | Настройка CORS на сервере модулей |
| Несовместимость shared deps | Средняя | Высокое | Тестирование версий, strictVersion |
| Медленная сеть | Средняя | Среднее | Увеличение таймаутов, индикаторы загрузки |
| Scope collision | Низкая | Высокое | Уникальные имена scope для каждого модуля |

## Время выполнения

Ожидаемое время: **6-8 часов**

## Примечания

- Module Federation runtime API может отличаться между Vite и Webpack
- `@originjs/vite-plugin-federation` создает совместимый runtime
- Shared dependencies должны быть идентичны в Host и Remote модулях
- CORS должен быть настроен на сервере, откуда загружаются remote модули

