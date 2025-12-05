import 'reflect-metadata';
// Инициализация shared scope для Vite Federation ПЕРЕД любыми другими импортами
import { initFederationShared } from './bootstrap/utils/initFederationShared';
initFederationShared();

import { createRoot } from 'react-dom/client';
import { CssBaseline, ErrorBoundary } from '@platform/ui';
import './main.css';
import { Bootstrap, initBootstrap } from './bootstrap';
import { appConfig } from './config/app';
import { app_modules } from './modules/modules';
import { RouterProvider } from '@riogz/react-router';
import { DIProvider, setGlobalDIContainer } from '@platform/ui';
import { configure } from 'mobx';
import { ThemeSchema } from '@platform/share';
import { Layout } from './modules/core.layout/view/Layout';
import { I18nextProvider } from 'react-i18next';
import { StrictMode } from 'react';
import { log, LogLevel } from '@platform/core';
// import { getLogLevelFromEnv } from './utils/getLogLevelFromEnv';

configure({ enforceActions: 'observed', useProxies: 'always' });
log.setConfig({ level: LogLevel.DEBUG });

initBootstrap(new Bootstrap(app_modules), appConfig)
  .then((bootstrap) => {
    // Устанавливаем глобальный DI контейнер для remote модулей
    // Это fallback на случай, если React Context недоступен
    setGlobalDIContainer(bootstrap.di);

    bootstrap.routerService.router.start(() => {
      createRoot(document.getElementById('root')!).render(
        <ErrorBoundary logPrefix="host.app">
          <RouterProvider router={bootstrap.routerService.router}>
            <DIProvider container={bootstrap.di}>
              <I18nextProvider i18n={bootstrap.i18n}>
                <ThemeSchema>
                  <CssBaseline />
                  <StrictMode>
                    <Layout />
                  </StrictMode>
                </ThemeSchema>
              </I18nextProvider>
            </DIProvider>
          </RouterProvider>
        </ErrorBoundary>,
      );

      // Загрузка NORMAL модулей после старта приложения
      bootstrap.moduleLoader.loadNormalModules().catch((error: unknown) => {
        log.error(
          'Error loading normal modules',
          { prefix: 'bootstrap' },
          error,
        );
      });
    });
  })
  .catch((error: Error) => {
    log.error('Error initializing bootstrap', { prefix: 'bootstrap' }, error);
  });
