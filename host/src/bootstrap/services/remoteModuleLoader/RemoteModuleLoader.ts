import type { ModuleConfig } from '../../interface';
import type {
  LoadRemoteModuleOptions,
  RemoteContainer,
} from './types';
import { log } from '@platform/core';
import {
  RemoteModuleLoadError,
  RemoteModuleTimeoutError,
  RemoteContainerNotFoundError,
} from './errors';
import { createScopeName } from './utils';

/**
 * Сервис для загрузки Remote модулей через Module Federation
 */
export class RemoteModuleLoader {
  private cache = new Map<string, Promise<ModuleConfig>>();
  private loadedScripts = new Set<string>();

  constructor() {
    log.debug('RemoteModuleLoader: constructor', {
      prefix: 'bootstrap.services.remoteModuleLoader',
    });
  }

  /**
   * Загружает конфиг Remote модуля
   */
  async loadRemoteModule(
    name: string,
    remoteEntry: string,
    options: LoadRemoteModuleOptions = {},
  ): Promise<ModuleConfig> {
    log.debug(`Loading remote module: ${name} from ${remoteEntry}`, {
      prefix: 'bootstrap.services.remoteModuleLoader.loadRemoteModule',
    });
    const { retries = 3, timeout = 10000, retryDelay = 1000 } = options;
    const cacheKey = `${name}:${remoteEntry}`;

    log.debug(
      `Remote module options: retries=${retries}, timeout=${timeout}ms, retryDelay=${retryDelay}ms`,
      {
        prefix: 'bootstrap.services.remoteModuleLoader.loadRemoteModule',
      },
    );

    // Проверяем кеш
    if (this.cache.has(cacheKey)) {
      log.debug(`Using cached module: ${name}`, {
        prefix: 'bootstrap.services.remoteModuleLoader.loadRemoteModule',
      });
      return this.cache.get(cacheKey)!;
    }

    log.debug(`Module not in cache, loading: ${name}`, {
      prefix: 'bootstrap.services.remoteModuleLoader.loadRemoteModule',
    });

    // Создаем promise для загрузки
    const loadPromise = this.loadWithRetry(
      name,
      remoteEntry,
      retries,
      timeout,
      retryDelay,
    );

    this.cache.set(cacheKey, loadPromise);
    log.debug(`Added to cache: ${cacheKey}`, {
      prefix: 'bootstrap.services.remoteModuleLoader.loadRemoteModule',
    });

    try {
      const result = await loadPromise;
      log.debug(`Remote module loaded successfully: ${name}`, {
        prefix: 'bootstrap.services.remoteModuleLoader.loadRemoteModule',
      });
      return result;
    } catch (error) {
      // Удаляем из кеша при ошибке для возможности повторной попытки
      this.cache.delete(cacheKey);
      log.debug(`Removed from cache due to error: ${cacheKey}`, {
        prefix: 'bootstrap.services.remoteModuleLoader.loadRemoteModule',
      });
      throw error;
    }
  }

  private async loadWithRetry(
    name: string,
    remoteEntry: string,
    retries: number,
    timeout: number,
    retryDelay: number,
  ): Promise<ModuleConfig> {
    log.debug(
      `Starting load with retry: ${name}, retries=${retries}, timeout=${timeout}ms`,
      {
        prefix: 'bootstrap.services.remoteModuleLoader.loadWithRetry',
      },
    );
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        log.debug(
          `Loading ${name} (attempt ${attempt}/${retries})`,
          {
            prefix: 'bootstrap.services.remoteModuleLoader.loadWithRetry',
          },
          {
            remoteEntry,
            attempt,
          },
        );

        const config = await this.loadWithTimeout(name, remoteEntry, timeout);

        log.debug(`Successfully loaded ${name}`, {
          prefix: 'bootstrap.services.remoteModuleLoader.loadWithRetry',
        });
        return config;
      } catch (error) {
        lastError = error as Error;
        log.debug(
          `Failed to load ${name} (attempt ${attempt}/${retries}): ${lastError.message}`,
          {
            prefix: 'bootstrap.services.remoteModuleLoader.loadWithRetry',
          },
          {
            error: lastError.message,
            attempt,
            retries,
          },
        );

        if (attempt < retries) {
          log.debug(
            `Waiting ${retryDelay}ms before retry ${attempt + 1}/${retries}`,
            {
              prefix: 'bootstrap.services.remoteModuleLoader.loadWithRetry',
            },
          );
          await this.delay(retryDelay);
        }
      }
    }

    const finalError = new RemoteModuleLoadError(
      name,
      remoteEntry,
      lastError || new Error('Unknown error'),
      retries,
    );

    log.error(
      `[RemoteModuleLoader] Failed to load module after all retries: ${name}`,
      {
        prefix: 'bootstrap.services.remoteModuleLoader',
        error: finalError.message,
      },
    );

    throw finalError;
  }

  private async loadWithTimeout(
    name: string,
    remoteEntry: string,
    timeout: number,
  ): Promise<ModuleConfig> {
    log.debug(`Loading with timeout: ${name}, timeout=${timeout}ms`, {
      prefix: 'bootstrap.services.remoteModuleLoader.loadWithTimeout',
    });
    return Promise.race([
      this.doLoad(name, remoteEntry),
      this.createTimeoutPromise(timeout, name),
    ]);
  }

  private createTimeoutPromise(
    timeout: number,
    name: string,
  ): Promise<never> {
    log.debug(`Creating timeout promise: ${name}, timeout=${timeout}ms`, {
      prefix: 'bootstrap.services.remoteModuleLoader.createTimeoutPromise',
    });
    return new Promise((_, reject) => {
      setTimeout(() => {
        log.debug(`Timeout reached for module: ${name}`, {
          prefix: 'bootstrap.services.remoteModuleLoader.createTimeoutPromise',
        });
        const error = new RemoteModuleTimeoutError(name, timeout);
        reject(error);
      }, timeout);
    });
  }

  private async doLoad(
    name: string,
    remoteEntry: string,
  ): Promise<ModuleConfig> {
    log.debug(`Starting doLoad for module: ${name}`, {
      prefix: 'bootstrap.services.remoteModuleLoader.doLoad',
    });
    const scope = createScopeName(name);
    log.debug(`Created scope name: ${scope} for module: ${name}`, {
      prefix: 'bootstrap.services.remoteModuleLoader.doLoad',
    });

    // Vite Federation экспортирует функции get, init напрямую из remoteEntry.js
    // Используем динамический импорт для получения контейнера
    log.debug(`Loading remote module via dynamic import: ${remoteEntry}`, {
      prefix: 'bootstrap.services.remoteModuleLoader.doLoad',
    });
    
    let container: RemoteContainer;
    try {
      // Динамический импорт remoteEntry.js возвращает модуль с методами get, init
      const remoteModule = await import(/* @vite-ignore */ remoteEntry);
      
      if (!remoteModule.get || !remoteModule.init) {
        log.error(`Remote module does not export get/init: ${remoteEntry}`, {
          prefix: 'bootstrap.services.remoteModuleLoader.doLoad',
        });
        throw new RemoteContainerNotFoundError(scope);
      }
      
      container = {
        get: remoteModule.get,
        init: remoteModule.init,
      } as RemoteContainer;
      log.debug(`Container obtained via dynamic import: ${scope}`, {
        prefix: 'bootstrap.services.remoteModuleLoader.doLoad',
      });
    } catch (importError) {
      // Fallback: попробуем загрузить через script tag и найти в window (для совместимости с Webpack)
      log.debug(`Dynamic import failed, trying script tag + window[${scope}]`, {
        prefix: 'bootstrap.services.remoteModuleLoader.doLoad',
        error: importError instanceof Error ? importError.message : String(importError),
      });
      
      await this.loadScript(remoteEntry);
      const windowContainer = window[scope] as RemoteContainer;
      if (!windowContainer) {
        log.error(`Container not found: ${scope}`, {
          prefix: 'bootstrap.services.remoteModuleLoader.doLoad',
        });
        throw new RemoteContainerNotFoundError(scope);
      }
      container = windowContainer;
      log.debug(`Container found in window: ${scope}`, {
        prefix: 'bootstrap.services.remoteModuleLoader.doLoad',
      });
    }

    // 3. Инициализируем контейнер с shared scope
    log.debug(`Initializing container: ${scope}`, {
      prefix: 'bootstrap.services.remoteModuleLoader.doLoad',
    });
    await this.initContainer(container, scope);
    log.debug(`Container initialized: ${scope}`, {
      prefix: 'bootstrap.services.remoteModuleLoader.doLoad',
    });

    // 4. Получаем модуль ./Config
    log.debug(`Getting module ./Config from container: ${scope}`, {
      prefix: 'bootstrap.services.remoteModuleLoader.doLoad',
    });
    const factory = await container.get('./Config');
    log.debug(`Factory obtained, calling factory()`, {
      prefix: 'bootstrap.services.remoteModuleLoader.doLoad',
    });
    const moduleExports = factory();
    log.debug(`Module config obtained for: ${name}`, {
      prefix: 'bootstrap.services.remoteModuleLoader.doLoad',
    });

    return moduleExports.default || moduleExports;
  }

  private async loadScript(url: string): Promise<void> {
    log.debug(`Loading script: ${url}`, {
      prefix: 'bootstrap.services.remoteModuleLoader.loadScript',
    });
    // Проверяем, загружен ли уже скрипт
    if (this.loadedScripts.has(url)) {
      log.debug(`Script already loaded: ${url}`, {
        prefix: 'bootstrap.services.remoteModuleLoader.loadScript',
      });
      return;
    }

    log.debug(`Creating script element for: ${url}`, {
      prefix: 'bootstrap.services.remoteModuleLoader.loadScript',
    });
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = url;
      script.type = 'module';
      script.async = true;

      script.onload = () => {
        this.loadedScripts.add(url);
        log.debug(`Script loaded successfully: ${url}`, {
          prefix: 'bootstrap.services.remoteModuleLoader.loadScript',
        });
        resolve();
      };

      script.onerror = () => {
        const error = new Error(`Failed to load script: ${url}`);
        log.error(`Script load error: ${url}`, {
          prefix: 'bootstrap.services.remoteModuleLoader.loadScript',
          error: error.message,
        });
        reject(error);
      };

      log.debug(`Appending script to document.head: ${url}`, {
        prefix: 'bootstrap.services.remoteModuleLoader.loadScript',
      });
      document.head.appendChild(script);
    });
  }

  private async initContainer(
    container: RemoteContainer,
    scope: string,
  ): Promise<void> {
    log.debug(`Initializing container: ${scope}`, {
      prefix: 'bootstrap.services.remoteModuleLoader.initContainer',
    });

    // Vite Federation использует globalThis.__federation_shared__ для shared модулей
    // Webpack Federation использует __webpack_share_scopes__
    const hasViteFederationShared =
      typeof globalThis.__federation_shared__ !== 'undefined';
    
    // Безопасная проверка Webpack share scopes
    let hasWebpackShareScopes = false;
    let webpackShareScopes: { default?: Record<string, unknown> } | undefined;
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const wpScopes = (globalThis as any).__webpack_share_scopes__;
      hasWebpackShareScopes = typeof wpScopes !== 'undefined';
      webpackShareScopes = wpScopes;
    } catch {
      // Игнорируем ошибку, если __webpack_share_scopes__ не определён
    }

    log.debug(
      `Share scope available: ${hasWebpackShareScopes}, has default: ${!!(webpackShareScopes?.default)}`,
      {
        prefix: 'bootstrap.services.remoteModuleLoader.initContainer',
      },
    );
    log.debug(
      `Vite Federation shared available: ${hasViteFederationShared}`,
      {
        prefix: 'bootstrap.services.remoteModuleLoader.initContainer',
      },
    );

    try {
      // Для Webpack: инициализируем default scope если не инициализирован
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const wpInitSharing = (globalThis as any).__webpack_init_sharing__;
        if (
          typeof wpInitSharing !== 'undefined' &&
          !webpackShareScopes?.default
        ) {
          log.debug(`Initializing webpack sharing for default scope`, {
            prefix: 'bootstrap.services.remoteModuleLoader.initContainer',
          });
          await wpInitSharing('default');
          log.debug(`Webpack sharing initialized for default scope`, {
            prefix: 'bootstrap.services.remoteModuleLoader.initContainer',
          });
        }
      } catch {
        // Игнорируем ошибку, если Webpack sharing не доступен
      }

      // Определяем shareScope для инициализации контейнера
      // Vite Federation ожидает объект с shared модулями в формате:
      // { moduleName: { version: { get: () => Promise<module>, loaded: boolean } } }
      let shareScope: Record<string, unknown> | undefined = undefined;

      if (hasWebpackShareScopes && webpackShareScopes?.default) {
        shareScope = webpackShareScopes.default;
        log.debug(`Using Webpack share scope`, {
          prefix: 'bootstrap.services.remoteModuleLoader.initContainer',
        });
      } else if (hasViteFederationShared && globalThis.__federation_shared__) {
        // Vite Federation может хранить shared модули в разных структурах:
        // 1. { default: { react: {...}, ... } } - со scope 'default'
        // 2. { react: {...}, ... } - напрямую без scope
        const fedShared = globalThis.__federation_shared__;
        if (fedShared.default && typeof fedShared.default === 'object') {
          shareScope = fedShared.default as Record<string, unknown>;
          log.debug(`Using Vite Federation share scope (default)`, {
            prefix: 'bootstrap.services.remoteModuleLoader.initContainer',
          });
        } else {
          // Используем весь объект как share scope
          shareScope = fedShared as unknown as Record<string, unknown>;
          log.debug(`Using Vite Federation share scope (root)`, {
            prefix: 'bootstrap.services.remoteModuleLoader.initContainer',
          });
        }
      } else {
        // Если нет share scope, передаём пустой объект для Vite Federation
        // Vite Federation может работать без share scope в dev режиме
        shareScope = {};
        log.debug(`No share scope available, using empty object`, {
          prefix: 'bootstrap.services.remoteModuleLoader.initContainer',
        });
      }

      // Инициализируем контейнер
      log.debug(`Calling container.init() for: ${scope}`, {
        prefix: 'bootstrap.services.remoteModuleLoader.initContainer',
      });
      await container.init(shareScope);
      log.debug(`Container initialized successfully: ${scope}`, {
        prefix: 'bootstrap.services.remoteModuleLoader.initContainer',
      });
    } catch (error) {
      // Контейнер может быть уже инициализирован
      const errorMessage = (error as Error).message || '';
      if (!errorMessage.includes('already been initialized')) {
        log.error(`Failed to initialize container: ${scope}`, {
          prefix: 'bootstrap.services.remoteModuleLoader.initContainer',
          error: errorMessage,
        });
        throw error;
      }
      log.debug(`Container already initialized: ${scope}`, {
        prefix: 'bootstrap.services.remoteModuleLoader.initContainer',
      });
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Очищает кеш загруженных модулей
   */
  clearCache(): void {
    const cacheSize = this.cache.size;
    this.cache.clear();
    log.debug(`Cache cleared (removed ${cacheSize} entries)`, {
      prefix: 'bootstrap.services.remoteModuleLoader.clearCache',
    });
  }

  /**
   * Удаляет конкретный модуль из кеша
   */
  invalidateCache(name: string): void {
    log.debug(`Invalidating cache for module: ${name}`, {
      prefix: 'bootstrap.services.remoteModuleLoader.invalidateCache',
    });
    let deletedCount = 0;
    for (const key of this.cache.keys()) {
      if (key.startsWith(`${name}:`)) {
        this.cache.delete(key);
        deletedCount++;
      }
    }
    log.debug(
      `Cache invalidated for: ${name} (removed ${deletedCount} entries)`,
      {
        prefix: 'bootstrap.services.remoteModuleLoader.invalidateCache',
      },
    );
  }
}

// Singleton instance
export const remoteModuleLoader = new RemoteModuleLoader();

