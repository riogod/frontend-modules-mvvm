import { createElement, type FC, Suspense } from 'react';
import { useRoute } from '@riogz/react-router';
import { type IMenuItem } from '@platform/core';
import { ErrorBoundary } from '@platform/ui';
import { findSegment } from './util.ts';
import NotFoundPage from '../NotFoundPage.tsx';
import { observer } from 'mobx-react-lite';
import ModuleErrorFallback from './ModuleErrorFallback.tsx';

const ContentContainer = () => {
  const route = useRoute();

  const segmentsArray = route.route.name.split('.');

  const appRoutes = route.router.getDependencies().menu as IMenuItem[];

  const pageComponent = findSegment(appRoutes, segmentsArray);

  return pageComponent ? (
    <ErrorBoundary
      key={route.route.name}
      logPrefix="host.page"
      fallback={<ModuleErrorFallback />}
    >
      <Suspense>{createElement(pageComponent)}</Suspense>
    </ErrorBoundary>
  ) : (
    <NotFoundPage />
  );
};

export default observer(ContentContainer as FC);
