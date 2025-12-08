/**
 * Загрузчик удаленных модулей через Module Federation.
 *
 * Отвечает за:
 * - Загрузку удаленных модулей через динамический импорт
 * - Кеширование загруженных модулей
 * - Повторные попытки при ошибках
 * - Инициализацию контейнеров Module Federation
 *
 * @module services/RemoteModuleLoader
 */

import { log } from '@platform/core';
import type { ModuleConfig } from '../../../interface';
import type { LoadRemoteModuleOptions, RemoteContainer } from '../types';
import {
  RemoteModuleLoadError,
  RemoteModuleTimeoutError,
  RemoteContainerNotFoundError,
} from '../errors';
import { createScopeName, delay } from '../utils/remoteUtils';

/** Префикс для логирования */
const LOG_PREFIX = 'moduleLoader.remoteLoader';

/**
 * Загрузчик удаленных модулей через Module Federation.
 *
 * Обеспечивает загрузку модулей с удаленных серверов с поддержкой:
 * - Кеширования для избежания повторных загрузок
 * - Повторных попыток при ошибках сети
 * - Таймаутов для предотвращения зависания
 * - Совместимости с Vite и Webpack Module Federation
 */
export class RemoteModuleLoader {
  /** Кеш загруженных модулей */
  private readonly cache = new Map<string, Promise<ModuleConfig>>();

  /** Множество загруженных скриптов */
  private readonly loadedScripts = new Set<string>();

  constructor() {
    log.debug('RemoteModuleLoader: инициализация', { prefix: LOG_PREFIX });
  }

  // ============================================
  // Публичные методы
  // ============================================

  /**
   * Загружает конфигурацию удаленного модуля.
   *
   * @param name - Имя модуля
   * @param remoteEntry - URL к remoteEntry.js
   * @param options - Опции загрузки
   * @returns Конфигурация модуля
   * @throws {RemoteModuleLoadError} При ошибке загрузки
   * @throws {RemoteModuleTimeoutError} При таймауте
   */
  public async loadRemoteModule(
    name: string,
    remoteEntry: string,
    options: LoadRemoteModuleOptions = {},
  ): Promise<ModuleConfig> {
    log.debug(`Загрузка удаленного модуля: ${name} из ${remoteEntry}`, {
      prefix: LOG_PREFIX,
    });

    const retries: number = options.retries ?? 3;
    const timeout: number = options.timeout ?? 10000;
    const retryDelay: number = options.retryDelay ?? 1000;
    const cacheKey = `${name}:${remoteEntry}`;

    log.debug(
      `Опции: retries=${retries}, timeout=${timeout}мс, retryDelay=${retryDelay}мс`,
      { prefix: LOG_PREFIX },
    );

    // Проверяем кеш
    const cached = this.cache.get(cacheKey);
    if (cached) {
      log.debug(`Используем кешированный модуль: ${name}`, {
        prefix: LOG_PREFIX,
      });
      return cached;
    }

    // Создаем Promise для загрузки
    const loadPromise = this.loadWithRetry(
      name,
      remoteEntry,
      retries,
      timeout,
      retryDelay,
    );

    this.cache.set(cacheKey, loadPromise);
    log.debug(`Добавлено в кеш: ${cacheKey}`, { prefix: LOG_PREFIX });

    try {
      const result = await loadPromise;
      log.debug(`Модуль "${name}" успешно загружен`, { prefix: LOG_PREFIX });
      return result;
    } catch (error) {
      // Удаляем из кеша при ошибке
      this.cache.delete(cacheKey);
      log.debug(`Удалено из кеша из-за ошибки: ${cacheKey}`, {
        prefix: LOG_PREFIX,
      });
      throw error;
    }
  }

  /**
   * Очищает весь кеш загруженных модулей.
   */
  public clearCache(): void {
    const cacheSize = this.cache.size;
    this.cache.clear();
    log.debug(`Кеш очищен (удалено ${cacheSize} записей)`, {
      prefix: LOG_PREFIX,
    });
  }

  /**
   * Удаляет конкретный модуль из кеша.
   *
   * @param name - Имя модуля для удаления из кеша
   */
  public invalidateCache(name: string): void {
    log.debug(`Инвалидация кеша для модуля: ${name}`, { prefix: LOG_PREFIX });

    let deletedCount = 0;
    for (const key of this.cache.keys()) {
      if (key.startsWith(`${name}:`)) {
        this.cache.delete(key);
        deletedCount++;
      }
    }

    log.debug(
      `Кеш инвалидирован для: ${name} (удалено ${deletedCount} записей)`,
      {
        prefix: LOG_PREFIX,
      },
    );
  }

  /**
   * Полностью сбрасывает состояние загрузчика.
   *
   * Очищает:
   * - Кеш загруженных модулей
   * - Список загруженных скриптов
   *
   * Полезно для:
   * - HMR (Hot Module Replacement) при разработке
   * - Тестирования (сброс состояния между тестами)
   * - Перезагрузки модулей при изменении конфигурации
   *
   * **Внимание:** После вызова этого метода все загруженные модули
   * будут загружены заново при следующем обращении.
   */
  public reset(): void {
    const cacheSize = this.cache.size;
    const scriptsSize = this.loadedScripts.size;

    this.cache.clear();
    this.loadedScripts.clear();

    log.debug(
      `RemoteModuleLoader сброшен (удалено ${cacheSize} модулей из кеша, ${scriptsSize} скриптов)`,
      {
        prefix: LOG_PREFIX,
      },
    );
  }

  /**
   * Возвращает количество загруженных модулей в кеше.
   *
   * @returns Количество модулей в кеше
   */
  public getCacheSize(): number {
    return this.cache.size;
  }

  /**
   * Возвращает количество загруженных скриптов.
   *
   * @returns Количество загруженных скриптов
   */
  public getLoadedScriptsCount(): number {
    return this.loadedScripts.size;
  }

  // ============================================
  // Приватные методы: Загрузка с повторами
  // ============================================

  /**
   * Загружает модуль с повторными попытками.
   */
  private async loadWithRetry(
    name: string,
    remoteEntry: string,
    retries: number,
    timeout: number,
    retryDelay: number,
  ): Promise<ModuleConfig> {
    log.debug(`Загрузка с повторами: ${name}, попыток=${retries}`, {
      prefix: LOG_PREFIX,
    });

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        log.debug(`Попытка ${attempt}/${retries} для ${name}`, {
          prefix: LOG_PREFIX,
        });

        const config = await this.loadWithTimeout(name, remoteEntry, timeout);
        log.debug(`Модуль ${name} загружен успешно`, { prefix: LOG_PREFIX });
        return config;
      } catch (error) {
        lastError = error as Error;
        log.debug(
          `Ошибка загрузки ${name} (попытка ${attempt}/${retries}): ${lastError.message}`,
          { prefix: LOG_PREFIX },
        );

        if (attempt < retries) {
          log.debug(`Ожидание ${retryDelay}мс перед попыткой ${attempt + 1}`, {
            prefix: LOG_PREFIX,
          });
          await delay(retryDelay);
        }
      }
    }

    const finalError = new RemoteModuleLoadError(
      name,
      remoteEntry,
      lastError || new Error('Неизвестная ошибка'),
      retries,
    );

    log.error(`Не удалось загрузить модуль после всех попыток: ${name}`, {
      prefix: LOG_PREFIX,
      error: finalError.message,
    });

    throw finalError;
  }

  /**
   * Загружает модуль с таймаутом.
   */
  private async loadWithTimeout(
    name: string,
    remoteEntry: string,
    timeout: number,
  ): Promise<ModuleConfig> {
    log.debug(`Загрузка с таймаутом: ${name}, timeout=${timeout}мс`, {
      prefix: LOG_PREFIX,
    });

    return Promise.race([
      this.doLoad(name, remoteEntry),
      this.createTimeoutPromise(timeout, name),
    ]);
  }

  /**
   * Создает Promise, который отклоняется по таймауту.
   */
  private createTimeoutPromise(timeout: number, name: string): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        log.debug(`Таймаут для модуля: ${name}`, { prefix: LOG_PREFIX });
        reject(new RemoteModuleTimeoutError(name, timeout));
      }, timeout);
    });
  }

  // ============================================
  // Приватные методы: Загрузка модуля
  // ============================================

  /**
   * Выполняет загрузку модуля.
   */
  private async doLoad(
    name: string,
    remoteEntry: string,
  ): Promise<ModuleConfig> {
    log.debug(`Начало загрузки модуля: ${name}`, { prefix: LOG_PREFIX });

    const scope = createScopeName(name);
    log.debug(`Создан scope: ${scope} для модуля: ${name}`, {
      prefix: LOG_PREFIX,
    });

    // Получаем контейнер
    const container = await this.getContainer(scope, remoteEntry);

    // Инициализируем контейнер
    log.debug(`Инициализация контейнера: ${scope}`, { prefix: LOG_PREFIX });
    await this.initContainer(container, scope);
    log.debug(`Контейнер инициализирован: ${scope}`, { prefix: LOG_PREFIX });

    // Получаем модуль ./Config
    log.debug(`Получение ./Config из контейнера: ${scope}`, {
      prefix: LOG_PREFIX,
    });
    const factory = await container.get('./Config');
    const moduleExports = factory();

    log.debug(`Конфигурация модуля получена: ${name}`, { prefix: LOG_PREFIX });
    return (
      (moduleExports as { default?: ModuleConfig }).default ||
      (moduleExports as ModuleConfig)
    );
  }

  /**
   * Получает контейнер Module Federation.
   */
  private async getContainer(
    scope: string,
    remoteEntry: string,
  ): Promise<RemoteContainer> {
    // Пробуем динамический импорт (Vite Federation)
    log.debug(`Загрузка через динамический импорт: ${remoteEntry}`, {
      prefix: LOG_PREFIX,
    });

    try {
      const remoteModule = await import(/* @vite-ignore */ remoteEntry);

      if (!remoteModule.get || !remoteModule.init) {
        log.error(`Remote модуль не экспортирует get/init: ${remoteEntry}`, {
          prefix: LOG_PREFIX,
        });
        throw new RemoteContainerNotFoundError(scope);
      }

      const container: RemoteContainer = {
        get: remoteModule.get,
        init: remoteModule.init,
      };

      log.debug(`Контейнер получен через динамический импорт: ${scope}`, {
        prefix: LOG_PREFIX,
      });

      return container;
    } catch (importError) {
      // Fallback: загрузка через script tag (Webpack совместимость)
      log.debug(
        `Динамический импорт не удался, пробуем script tag + window[${scope}]`,
        {
          prefix: LOG_PREFIX,
          error:
            importError instanceof Error
              ? importError.message
              : String(importError),
        },
      );

      await this.loadScript(remoteEntry);

      const windowContainer = window[scope] as unknown as RemoteContainer;
      if (!windowContainer) {
        log.error(`Контейнер не найден: ${scope}`, { prefix: LOG_PREFIX });
        throw new RemoteContainerNotFoundError(scope);
      }

      log.debug(`Контейнер найден в window: ${scope}`, { prefix: LOG_PREFIX });
      return windowContainer;
    }
  }

  /**
   * Загружает скрипт через тег script.
   */
  private async loadScript(url: string): Promise<void> {
    log.debug(`Загрузка скрипта: ${url}`, { prefix: LOG_PREFIX });

    if (this.loadedScripts.has(url)) {
      log.debug(`Скрипт уже загружен: ${url}`, { prefix: LOG_PREFIX });
      return;
    }

    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = url;
      script.type = 'module';
      script.async = true;

      script.onload = () => {
        this.loadedScripts.add(url);
        log.debug(`Скрипт загружен успешно: ${url}`, { prefix: LOG_PREFIX });
        resolve();
      };

      script.onerror = () => {
        const error = new Error(`Не удалось загрузить скрипт: ${url}`);
        log.error(`Ошибка загрузки скрипта: ${url}`, { prefix: LOG_PREFIX });
        reject(error);
      };

      document.head.appendChild(script);
    });
  }

  // ============================================
  // Приватные методы: Инициализация контейнера
  // ============================================

  /**
   * Инициализирует контейнер Module Federation.
   */
  private async initContainer(
    container: RemoteContainer,
    scope: string,
  ): Promise<void> {
    log.debug(`Инициализация контейнера: ${scope}`, { prefix: LOG_PREFIX });

    // Проверяем доступность share scopes
    const hasViteFederationShared =
      typeof globalThis.__federation_shared__ !== 'undefined';

    let webpackShareScopes: { default?: Record<string, unknown> } | undefined;
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      webpackShareScopes = (globalThis as any).__webpack_share_scopes__;
    } catch {
      // Игнорируем
    }

    const hasWebpackShareScopes = !!webpackShareScopes;

    log.debug(
      `Share scopes: webpack=${hasWebpackShareScopes}, vite=${hasViteFederationShared}`,
      { prefix: LOG_PREFIX },
    );

    try {
      // Инициализируем Webpack sharing если нужно
      await this.initWebpackSharing(webpackShareScopes);

      // Определяем shareScope
      const shareScope = this.getShareScope(
        hasWebpackShareScopes,
        webpackShareScopes,
        hasViteFederationShared,
      );

      // Инициализируем контейнер
      log.debug(`Вызов container.init() для: ${scope}`, { prefix: LOG_PREFIX });
      await container.init(shareScope);
      log.debug(`Контейнер успешно инициализирован: ${scope}`, {
        prefix: LOG_PREFIX,
      });
    } catch (error) {
      const errorMessage = (error as Error).message || '';
      if (!errorMessage.includes('already been initialized')) {
        log.error(`Ошибка инициализации контейнера: ${scope}`, {
          prefix: LOG_PREFIX,
          error: errorMessage,
        });
        throw error;
      }
      log.debug(`Контейнер уже инициализирован: ${scope}`, {
        prefix: LOG_PREFIX,
      });
    }
  }

  /**
   * Инициализирует Webpack sharing если доступно.
   */
  private async initWebpackSharing(webpackShareScopes?: {
    default?: Record<string, unknown>;
  }): Promise<void> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const wpInitSharing = (globalThis as any).__webpack_init_sharing__;
      if (
        typeof wpInitSharing !== 'undefined' &&
        !webpackShareScopes?.default
      ) {
        log.debug(`Инициализация webpack sharing для default scope`, {
          prefix: LOG_PREFIX,
        });
        await wpInitSharing('default');
      }
    } catch {
      // Игнорируем ошибку
    }
  }

  /**
   * Определяет shareScope для инициализации контейнера.
   */
  private getShareScope(
    hasWebpackShareScopes: boolean,
    webpackShareScopes?: { default?: Record<string, unknown> },
    hasViteFederationShared?: boolean,
  ): Record<string, unknown> {
    if (hasWebpackShareScopes && webpackShareScopes?.default) {
      log.debug(`Используем Webpack share scope`, { prefix: LOG_PREFIX });
      return webpackShareScopes.default;
    }

    if (hasViteFederationShared && globalThis.__federation_shared__) {
      const fedShared = globalThis.__federation_shared__;
      if (fedShared.default && typeof fedShared.default === 'object') {
        log.debug(`Используем Vite Federation share scope (default)`, {
          prefix: LOG_PREFIX,
        });
        return fedShared.default as Record<string, unknown>;
      }
      log.debug(`Используем Vite Federation share scope (root)`, {
        prefix: LOG_PREFIX,
      });
      return fedShared as unknown as Record<string, unknown>;
    }

    log.debug(`Share scope не доступен, используем пустой объект`, {
      prefix: LOG_PREFIX,
    });
    return {};
  }
}

/**
 * Singleton экземпляр RemoteModuleLoader.
 */
export const remoteModuleLoader = new RemoteModuleLoader();
