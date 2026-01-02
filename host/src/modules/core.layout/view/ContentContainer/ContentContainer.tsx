import { createElement, type FC, Suspense, useEffect } from 'react';
import { useRoute } from '@riogz/react-router';
import { IOC_CORE_TOKENS, log, type IMenuItem } from '@platform/core';
import { ErrorBoundary, useVM } from '@platform/ui';
import { findSegment } from './util';
import NotFoundPage from '../NotFoundPage';
import { observer } from 'mobx-react-lite';
import ModuleErrorFallback from './ModuleErrorFallback';
import HomePage from '../HomePage';
import type { AppSettingsViewModel } from '@host/modules/core/viewmodels/appSettings.vm';

const ContentContainer = () => {
  const route = useRoute();
  const appSettingsViewModel = useVM<AppSettingsViewModel>(
    IOC_CORE_TOKENS.VIEW_MODEL_APP_SETTINGS,
  );

  // Логируем изменение маршрута только при реальном изменении, а не при каждом рендере
  useEffect(() => {
    log.debug('Route path', { prefix: 'core.layout' }, route.route);
  }, [route.route]);

  if (!appSettingsViewModel.isAppStarted) {
    return <HomePage />;
  }
  const segmentsArray = route.route.name.split('.');

  const appRoutes = route.router.getDependencies().menu as IMenuItem[];

  const pageComponent = findSegment(appRoutes, segmentsArray);

  return pageComponent ? (
    <ErrorBoundary
      key={route.route.name}
      logPrefix="host.page"
      fallback={(error) => <ModuleErrorFallback error={error} />}
    >
      <Suspense>{createElement(pageComponent)}</Suspense>
    </ErrorBoundary>
  ) : (
    <NotFoundPage />
  );
};

export default observer(ContentContainer as FC);
