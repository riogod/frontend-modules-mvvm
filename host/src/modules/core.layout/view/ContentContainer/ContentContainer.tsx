import { createElement, type FC, Suspense } from 'react';
import { useRoute } from '@riogz/react-router';
import { IOC_CORE_TOKENS, type IMenuItem } from '@platform/core';
import { ErrorBoundary, useVM } from '@platform/ui';
import { findSegment } from './util';
import NotFoundPage from '../NotFoundPage';
import { observer } from 'mobx-react-lite';
import ModuleErrorFallback from './ModuleErrorFallback';
import type { AppSettingsViewModel } from '@host/modules/core/viewmodels/appSettings.vm';
import LoadingPage from '../LoadingPage';

const ContentContainer = () => {
  const route = useRoute();

  const appViewModel = useVM<AppSettingsViewModel>(
    IOC_CORE_TOKENS.VIEW_MODEL_APP_SETTINGS,
  );

  if (appViewModel.loadingPhase !== 'finalized') {
    return <LoadingPage />;
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
