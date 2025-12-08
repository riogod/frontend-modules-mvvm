/* Подготавливает share scope для Vite Module Federation в dev.
 * Заполняем globalThis.__federation_shared__ базовыми singleton-зависимостями,
 * чтобы remote-модули использовали тот же инстанс React/ReactDOM и пр.
 */
import React from 'react';
import * as ReactDOM from 'react-dom';
import * as Mobx from 'mobx';
import * as MobxReactLite from 'mobx-react-lite';
import i18next from 'i18next';
import * as ReactI18next from 'react-i18next';
import * as Inversify from 'inversify';
import 'reflect-metadata';
import * as PlatformCore from '@platform/core';
import * as PlatformUI from '@platform/ui';
import * as PlatformCommon from '@platform/common';
import * as PlatformShare from '@platform/share';
import * as RiogzRouter from '@riogz/router';
import * as RiogzReactRouter from '@riogz/react-router';
import * as RiogzRouterPluginBrowser from '@riogz/router-plugin-browser';

type SharedVersionValue = {
  get: () => Promise<() => unknown>;
  loaded: boolean;
  from: string;
  eager?: boolean;
  // version?: string; // не обязателен для текущего рантайма
};

type SharedScope = Record<string, Record<string, SharedVersionValue>>;

function registerSharedModule(
  scope: SharedScope,
  name: string,
  mod: unknown,
): void {
  const versions = (scope[name] = scope[name] || {});
  // Используем "0.0.0" как универсальный ключ версии — плагину достаточно структуры.
  versions['0.0.0'] = {
    get: () => Promise.resolve(() => mod),
    loaded: true,
    from: 'host',
    eager: true,
  };
}

(() => {
  // В продакшене Vite сам подготавливает share scope, здесь ничего не делаем
  if (import.meta.env?.PROD) {
    return;
  }

  // Подготавливаем общий scope default
  const sharedRoot =
    (globalThis.__federation_shared__ as { default?: SharedScope }) ||
    (globalThis.__federation_shared__ = {});
  const defaultScope = (sharedRoot.default = sharedRoot.default || {});

  registerSharedModule(defaultScope, 'react', React);
  registerSharedModule(defaultScope, 'react-dom', ReactDOM);
  registerSharedModule(defaultScope, 'mobx', Mobx);
  registerSharedModule(defaultScope, 'mobx-react-lite', MobxReactLite);
  registerSharedModule(defaultScope, 'i18next', i18next);
  registerSharedModule(defaultScope, 'react-i18next', ReactI18next);
  registerSharedModule(defaultScope, 'inversify', Inversify);
  registerSharedModule(defaultScope, 'reflect-metadata', {});
  registerSharedModule(defaultScope, '@platform/core', PlatformCore);
  registerSharedModule(defaultScope, '@platform/ui', PlatformUI);
  registerSharedModule(defaultScope, '@platform/common', PlatformCommon);
  registerSharedModule(defaultScope, '@platform/share', PlatformShare);
  registerSharedModule(defaultScope, '@riogz/router', RiogzRouter);
  registerSharedModule(defaultScope, '@riogz/react-router', RiogzReactRouter);
  registerSharedModule(
    defaultScope,
    '@riogz/router-plugin-browser',
    RiogzRouterPluginBrowser,
  );
})();
