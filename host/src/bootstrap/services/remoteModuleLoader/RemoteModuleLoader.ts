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

  /**
   * Загружает конфиг Remote модуля
   */
  async loadRemoteModule(
    name: string,
    remoteEntry: string,
    options: LoadRemoteModuleOptions = {},
  ): Promise<ModuleConfig> {
    const { retries = 3, timeout = 10000, retryDelay = 1000 } = options;
    const cacheKey = `${name}:${remoteEntry}`;

    // Проверяем кеш
    if (this.cache.has(cacheKey)) {
      log.debug(`[RemoteModuleLoader] Using cached module: ${name}`, {
        prefix: 'bootstrap.services.remoteModuleLoader',
      });
      return this.cache.get(cacheKey)!;
    }

    // Создаем promise для загрузки
    const loadPromise = this.loadWithRetry(
      name,
      remoteEntry,
      retries,
      timeout,
      retryDelay,
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
    retryDelay: number,
  ): Promise<ModuleConfig> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        log.info(
          `[RemoteModuleLoader] Loading ${name} (attempt ${attempt}/${retries})`,
          {
            prefix: 'bootstrap.services.remoteModuleLoader',
            remoteEntry,
            attempt,
          },
        );

        const config = await this.loadWithTimeout(name, remoteEntry, timeout);

        log.info(`[RemoteModuleLoader] Successfully loaded ${name}`, {
          prefix: 'bootstrap.services.remoteModuleLoader',
        });
        return config;
      } catch (error) {
        lastError = error as Error;
        log.warn(
          `[RemoteModuleLoader] Failed to load ${name} (attempt ${attempt}/${retries}): ${lastError.message}`,
          {
            prefix: 'bootstrap.services.remoteModuleLoader',
            error: lastError.message,
            attempt,
            retries,
          },
        );

        if (attempt < retries) {
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
    return Promise.race([
      this.doLoad(name, remoteEntry),
      this.createTimeoutPromise(timeout, name),
    ]);
  }

  private createTimeoutPromise(
    timeout: number,
    name: string,
  ): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        const error = new RemoteModuleTimeoutError(name, timeout);
        reject(error);
      }, timeout);
    });
  }

  private async doLoad(
    name: string,
    remoteEntry: string,
  ): Promise<ModuleConfig> {
    const scope = createScopeName(name);

    // 1. Загружаем remoteEntry.js
    await this.loadScript(remoteEntry);

    // 2. Получаем контейнер
    const container = window[scope] as RemoteContainer;
    if (!container) {
      throw new RemoteContainerNotFoundError(scope);
    }

    // 3. Инициализируем контейнер с shared scope
    await this.initContainer(container, scope);

    // 4. Получаем модуль ./Config
    const factory = await container.get('./Config');
    const moduleExports = factory();

    return moduleExports.default || moduleExports;
  }

  private async loadScript(url: string): Promise<void> {
    // Проверяем, загружен ли уже скрипт
    if (this.loadedScripts.has(url)) {
      log.debug(`[RemoteModuleLoader] Script already loaded: ${url}`, {
        prefix: 'bootstrap.services.remoteModuleLoader',
      });
      return;
    }

    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = url;
      script.type = 'module';
      script.async = true;

      script.onload = () => {
        this.loadedScripts.add(url);
        log.debug(`[RemoteModuleLoader] Script loaded: ${url}`, {
          prefix: 'bootstrap.services.remoteModuleLoader',
        });
        resolve();
      };

      script.onerror = () => {
        const error = new Error(`Failed to load script: ${url}`);
        log.error(`[RemoteModuleLoader] Script load error: ${url}`, {
          prefix: 'bootstrap.services.remoteModuleLoader',
          error: error.message,
        });
        reject(error);
      };

      document.head.appendChild(script);
    });
  }

  private async initContainer(
    container: RemoteContainer,
    scope: string,
  ): Promise<void> {
    // Получаем shared scope от webpack/vite
    // Типы определены в federation.d.ts
    const shareScope = typeof __webpack_share_scopes__ !== 'undefined' 
      ? __webpack_share_scopes__ 
      : {};

    try {
      // Инициализируем default scope если не инициализирован
      if (typeof __webpack_init_sharing__ !== 'undefined' && !shareScope.default) {
        await __webpack_init_sharing__('default');
      }

      // Инициализируем контейнер
      await container.init(shareScope.default || {});
    } catch (error) {
      // Контейнер может быть уже инициализирован
      const errorMessage = (error as Error).message || '';
      if (!errorMessage.includes('already been initialized')) {
        throw error;
      }
      log.debug(
        `[RemoteModuleLoader] Container already initialized: ${scope}`,
        {
          prefix: 'bootstrap.services.remoteModuleLoader',
        },
      );
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Очищает кеш загруженных модулей
   */
  clearCache(): void {
    this.cache.clear();
    log.debug('[RemoteModuleLoader] Cache cleared', {
      prefix: 'bootstrap.services.remoteModuleLoader',
    });
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
    log.debug(`[RemoteModuleLoader] Cache invalidated for: ${name}`, {
      prefix: 'bootstrap.services.remoteModuleLoader',
    });
  }
}

// Singleton instance
export const remoteModuleLoader = new RemoteModuleLoader();

