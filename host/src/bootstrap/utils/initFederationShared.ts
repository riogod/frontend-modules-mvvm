/**
 * Инициализация shared scope для Vite Federation
 *
 * ВАЖНО: Этот модуль НЕ должен регистрировать зависимости, которые используются в хосте напрямую.
 * Vite Federation автоматически создаёт shared scope для зависимостей, указанных в конфигурации.
 * Этот модуль нужен только для случаев, когда shared scope не инициализируется автоматически.
 *
 * reflect-metadata уже загружен в bootstrap.app.tsx (первая строка),
 * который вызывается через async boundary из main.tsx.
 * Это гарантирует правильный порядок инициализации.
 */

import { log } from '@platform/core';

// Импортируем критические зависимости, которые должны быть shared
// Используем namespace импорты для получения всего модуля
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import * as ReactDOMClient from 'react-dom/client';
import * as mobx from 'mobx';
import * as mobxReactLite from 'mobx-react-lite';
import * as reactI18next from 'react-i18next';
import * as inversify from 'inversify';

// Внутренние библиотеки платформы - КРИТИЧЕСКИ ВАЖНЫ для shared контекстов
import * as platformUI from '@platform/ui';
import * as platformShare from '@platform/share';
import * as platformCore from '@platform/core';
import * as platformCommon from '@platform/common';

// Типы для Vite Federation shared scope
type SharedModule = {
  get: () => Promise<() => unknown>;
  loaded?: boolean;
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
 * Создаёт wrapper для shared модуля
 * Vite Federation ожидает, что get() возвращает Promise, который резолвится в factory функцию
 * Factory функция при вызове возвращает сам модуль
 */
function createSharedModule(module: unknown): SharedModule {
  return {
    get: () => Promise.resolve(() => module),
    loaded: true,
  };
}

/**
 * Инициализирует shared scope для Vite Federation
 * Должен быть вызван до загрузки любых remote модулей
 */
export function initFederationShared(): void {
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
  // Формат: { packageName: { version: { get, loaded } } }
  scope['react'] = {
    '*': createSharedModule(React),
  };

  scope['react-dom'] = {
    '*': createSharedModule(ReactDOM),
  };

  scope['react-dom/client'] = {
    '*': createSharedModule(ReactDOMClient),
  };

  scope['mobx'] = {
    '*': createSharedModule(mobx),
  };

  scope['mobx-react-lite'] = {
    '*': createSharedModule(mobxReactLite),
  };

  // i18next НЕ регистрируем здесь - Vite Federation плагин автоматически
  // создаёт shared scope для зависимостей из конфигурации.
  // Хост использует реальный экземпляр i18next напрямую.

  scope['react-i18next'] = {
    '*': createSharedModule(reactI18next),
  };

  scope['inversify'] = {
    '*': createSharedModule(inversify),
  };

  // Внутренние библиотеки платформы
  // КРИТИЧЕСКИ ВАЖНО: @platform/ui содержит DIContext и другие React контексты
  scope['@platform/ui'] = {
    '*': createSharedModule(platformUI),
  };

  scope['@platform/share'] = {
    '*': createSharedModule(platformShare),
  };

  scope['@platform/core'] = {
    '*': createSharedModule(platformCore),
  };

  scope['@platform/common'] = {
    '*': createSharedModule(platformCommon),
  };

  if (import.meta.env.MODE === 'production') {
    const globalReflect: typeof Reflect | undefined =
      (globalThis as any).Reflect ?? (window as any).Reflect;

    if (!globalReflect) {
      throw new Error(
        'Reflect is not initialized, import "reflect-metadata" earlier',
      );
    }
    scope['reflect-metadata'] = {
      '*': createSharedModule(globalReflect),
    };
  }

  log.debug(
    'bootstrap.utils.initFederationShared',
    'Shared scope initialized with',
    Object.keys(scope).length,
    'modules',
  );
}

/**
 * Проверяет, инициализирован ли shared scope
 */
export function isFederationSharedInitialized(): boolean {
  return !!(
    globalThis.__federation_shared__ &&
    globalThis.__federation_shared__.default &&
    Object.keys(globalThis.__federation_shared__.default).length > 0
  );
}
