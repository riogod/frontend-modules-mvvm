import 'reflect-metadata';
import { createRoot } from 'react-dom/client';
import CssBaseline from '@mui/material/CssBaseline';
import './main.css';
import { Bootstrap, initBootstrap } from './bootstrap';
import { appConfig } from './config/app';
import { app_modules } from './modules/modules';
import { RouterProvider } from '@riogz/react-router';
import { DIProvider } from '@todo/ui';
import { configure } from 'mobx';
import ThemeSchema from './modules/core/view/ThemeSchema';
import { Layout } from './modules/core/view/Layout';
import { I18nextProvider } from 'react-i18next';
import { StrictMode } from 'react';

configure({ enforceActions: 'observed', useProxies: 'ifavailable' });

initBootstrap(new Bootstrap(app_modules), appConfig)
  .then((bootstrap) => {
    bootstrap.routerService.router.start(() => {
      createRoot(document.getElementById('root')!).render(
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
        </RouterProvider>,
      );
    });
  })
  .catch((error: unknown) => {
    console.error(error);
  });
