import { AbstractInitHandler } from './AbstractInitHandler';
import type { Bootstrap } from '..';
import { log } from '@platform/core';

// Импортируем критические зависимости, которые должны быть shared
// Используем namespace импорты для получения всего модуля
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import * as ReactDOMClient from 'react-dom/client';
import * as mobx from 'mobx';
import * as mobxReactLite from 'mobx-react-lite';
import * as reactI18next from 'react-i18next';
import i18next from 'i18next';
import * as inversify from 'inversify';
import * as riogzRouter from '@riogz/router';
import * as riogzReactRouter from '@riogz/react-router';
import * as riogzRouterPluginBrowser from '@riogz/router-plugin-browser';

// Внутренние библиотеки платформы - КРИТИЧЕСКИ ВАЖНЫ для shared контекстов
import * as platformUI from '@platform/ui';
import * as platformShare from '@platform/share';
import * as platformCore from '@platform/core';
import * as platformCommon from '@platform/common';

// Типы для Vite Federation shared scope
type SharedModule = {
  get: () => Promise<() => unknown>;
  loaded?: boolean;
  eager?: boolean;
  from?: string;
};

type SharedScope = {
  [key: string]: {
    [version: string]: SharedModule;
  };
};

declare global {
  // eslint-disable-next-line no-var
  var __federation_shared__: {
    default?: SharedScope;
    [scope: string]: SharedScope | undefined;
  };
}

/**
 * Регистрирует модуль в shared scope
 * versionKey по умолчанию '*' (используется плагином Vite Federation в prod),
 * для dev можно передать '0.0.0', как в старом registerShared.ts
 */
function registerSharedModule(
  scope: SharedScope,
  name: string,
  module: unknown,
  versionKey = '*',
  extra?: Pick<SharedModule, 'eager' | 'from'>,
): void {
  const versions = (scope[name] = scope[name] || {});
  versions[versionKey] = {
    get: () => Promise.resolve(() => module),
    loaded: true,
    ...extra,
  };
}

/**
 * Обработчик инициализации shared scope для Vite Federation
 *
 * - Prod: использует конфигурацию Vite Federation (ключ версии '*')
 * - Dev: воспроизводит старый registerShared.ts (ключ версии '0.0.0')
 *
 * ВАЖНО: Этот хендлер должен быть вызван ДО загрузки любых remote модулей.
 * Shared scope инициализируется в самом начале цепочки хендлеров.
 *
 * ВАЖНО: Этот модуль НЕ должен регистрировать зависимости, которые используются в хосте напрямую.
 * Vite Federation автоматически создаёт shared scope для зависимостей, указанных в конфигурации.
 *
 * reflect-metadata уже загружен в bootstrap.app.tsx (первая строка),
 * который вызывается через async boundary из main.tsx.
 * Это гарантирует правильный порядок инициализации.
 */
export class FederationSharedHandler extends AbstractInitHandler {
  async handle(bootstrap: Bootstrap): Promise<Bootstrap> {
    const mode = import.meta.env.MODE;
    const isProd = mode === 'production';

    if (isProd) {
      log.debug('FederationSharedHandler: starting (production mode)', {
        prefix: 'bootstrap.handlers.FederationSharedHandler',
      });

      this.initFederationSharedProd();

      log.debug('FederationSharedHandler: completed', {
        prefix: 'bootstrap.handlers.FederationSharedHandler',
      });
    } else {
      log.debug('FederationSharedHandler: starting (dev mode)', {
        prefix: 'bootstrap.handlers.FederationSharedHandler',
      });

      this.initFederationSharedDev();

      log.debug('FederationSharedHandler: completed (dev mode)', {
        prefix: 'bootstrap.handlers.FederationSharedHandler',
      });
    }

    return await super.handle(bootstrap);
  }

  /**
   * Prod-инициализация shared scope (ключ версии '*')
   */
  private initFederationSharedProd(): void {
    // Создаём shared scope если не существует
    if (!globalThis.__federation_shared__) {
      globalThis.__federation_shared__ = {};
    }

    // Создаём default scope если не существует
    if (!globalThis.__federation_shared__.default) {
      globalThis.__federation_shared__.default = {};
    }

    const scope = globalThis.__federation_shared__.default;

    // Регистрируем shared модули
    registerSharedModule(scope, 'react', React);
    registerSharedModule(scope, 'react-dom', ReactDOM);
    registerSharedModule(scope, 'react-dom/client', ReactDOMClient);
    registerSharedModule(scope, 'mobx', mobx);
    registerSharedModule(scope, 'mobx-react-lite', mobxReactLite);

    // i18next НЕ регистрируем здесь - Vite Federation плагин автоматически
    // создаёт shared scope для зависимостей из конфигурации.
    // Хост использует реальный экземпляр i18next напрямую.

    registerSharedModule(scope, 'react-i18next', reactI18next);
    registerSharedModule(scope, 'inversify', inversify);

    // Внутренние библиотеки платформы
    // КРИТИЧЕСКИ ВАЖНО: @platform/ui содержит DIContext и другие React контексты
    registerSharedModule(scope, '@platform/ui', platformUI);
    registerSharedModule(scope, '@platform/share', platformShare);
    registerSharedModule(scope, '@platform/core', platformCore);
    registerSharedModule(scope, '@platform/common', platformCommon);

    // reflect-metadata регистрируем только в production
    const globalReflect: typeof Reflect | undefined =
      (globalThis as any).Reflect ?? (window as any).Reflect;

    if (!globalReflect) {
      throw new Error(
        'Reflect is not initialized, import "reflect-metadata" earlier',
      );
    }
    registerSharedModule(scope, 'reflect-metadata', globalReflect);

    log.debug(
      'FederationSharedHandler: Shared scope initialized with',
      {
        prefix: 'bootstrap.handlers.FederationSharedHandler',
      },
      {
        modulesCount: Object.keys(scope).length,
      },
    );
  }

  /**
   * Dev-инициализация shared scope (как в прежнем registerShared.ts)
   * Использует ключ версии '0.0.0' и помечает модули как eager/from=host
   */
  private initFederationSharedDev(): void {
    const sharedRoot =
      (globalThis.__federation_shared__ as { default?: SharedScope }) ||
      (globalThis.__federation_shared__ = {});
    const defaultScope = (sharedRoot.default = sharedRoot.default || {});
    const versionKey = '0.0.0';
    const meta = { eager: true, from: 'host' as const };

    registerSharedModule(defaultScope, 'react', React, versionKey, meta);
    registerSharedModule(defaultScope, 'react-dom', ReactDOM, versionKey, meta);
    registerSharedModule(defaultScope, 'mobx', mobx, versionKey, meta);
    registerSharedModule(
      defaultScope,
      'mobx-react-lite',
      mobxReactLite,
      versionKey,
      meta,
    );
    registerSharedModule(defaultScope, 'i18next', i18next, versionKey, meta);
    registerSharedModule(
      defaultScope,
      'react-i18next',
      reactI18next,
      versionKey,
      meta,
    );
    registerSharedModule(
      defaultScope,
      'inversify',
      inversify,
      versionKey,
      meta,
    );
    registerSharedModule(
      defaultScope,
      'reflect-metadata',
      {},
      versionKey,
      meta,
    );
    registerSharedModule(
      defaultScope,
      '@platform/core',
      platformCore,
      versionKey,
      meta,
    );
    registerSharedModule(
      defaultScope,
      '@platform/ui',
      platformUI,
      versionKey,
      meta,
    );
    registerSharedModule(
      defaultScope,
      '@platform/common',
      platformCommon,
      versionKey,
      meta,
    );
    registerSharedModule(
      defaultScope,
      '@platform/share',
      platformShare,
      versionKey,
      meta,
    );
    registerSharedModule(
      defaultScope,
      '@riogz/router',
      riogzRouter,
      versionKey,
      meta,
    );
    registerSharedModule(
      defaultScope,
      '@riogz/react-router',
      riogzReactRouter,
      versionKey,
      meta,
    );
    registerSharedModule(
      defaultScope,
      '@riogz/router-plugin-browser',
      riogzRouterPluginBrowser,
      versionKey,
      meta,
    );
  }
}

/**
 * Проверяет, инициализирован ли shared scope
 * Экспортируется для использования в других частях приложения
 */
export function isFederationSharedInitialized(): boolean {
  return !!(
    globalThis.__federation_shared__ &&
    globalThis.__federation_shared__.default &&
    Object.keys(globalThis.__federation_shared__.default).length > 0
  );
}
