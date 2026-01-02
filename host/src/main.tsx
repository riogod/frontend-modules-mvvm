import { createRoot } from 'react-dom/client';
import { CssBaseline, ErrorBoundary } from '@platform/ui';
import './main.css';
import { Bootstrap, initBootstrap } from './bootstrap';
import { appConfig } from './config/app';
import { app_modules } from './modules/modules';
import { RouterProvider } from '@riogz/react-router';
import { DIProvider } from '@platform/ui';
import { configure } from 'mobx';
import { ThemeSchema } from '@platform/share';
import { Layout } from './modules/core.layout/view/Layout';
import { I18nextProvider } from 'react-i18next';
import { StrictMode } from 'react';
import { log } from '@platform/core';
import { getLogLevelFromEnv } from './utils/getLogLevelFromEnv';
import { ManifestLoader } from './bootstrap/services/manifestLoader';

configure({ enforceActions: 'observed', useProxies: 'always' });
log.setConfig({
  level: getLogLevelFromEnv(),
  // errorMonitoringCallback: (error, errorInfo) => {
  //   // тут можно поставить обработчик для отправки ошибок в мониторинг
  //   console.warn(
  //     'Unhandled error captured (monitoring not configured):',
  //     error,
  //     errorInfo,
  //   );
  // },
});

initBootstrap(new Bootstrap(app_modules), appConfig)
  .then(async (bootstrap) => {
    // setGlobalDIContainer(bootstrap.di);

    // Старт роутера с локальными модулями
    bootstrap.routerService.router.start(() => {
      createRoot(document.getElementById('root')!).render(
        <RouterProvider router={bootstrap.routerService.router}>
          <DIProvider container={bootstrap.di}>
            <I18nextProvider i18n={bootstrap.i18n}>
              <ThemeSchema>
                <CssBaseline />
                <ErrorBoundary logPrefix="host.app">
                  <StrictMode>
                    <Layout />
                  </StrictMode>
                </ErrorBoundary>
              </ThemeSchema>
            </I18nextProvider>
          </DIProvider>
        </RouterProvider>,
      );
    });

    // Загрузка манифеста после рендера (может быть после авторизации)
    const manifestLoader = new ManifestLoader(
      bootstrap.getAPIClient,
      bootstrap.moduleLoader,
      bootstrap,
    );

    // Загружаем манифест
    const manifest = await manifestLoader.loadManifest();

    if (manifest) {
      // Обрабатываем модули из манифеста
      await manifestLoader.processManifestModules(manifest);
    }

    // Загрузка NORMAL модулей (локальные + из манифеста)
    bootstrap.moduleLoader.loadNormalModules().catch((error: unknown) => {
      log.error('Error loading normal modules', { prefix: 'bootstrap' }, error);
    });
  })
  .catch((error: Error) => {
    log.error('Error initializing bootstrap', { prefix: 'bootstrap' }, error);
  });
