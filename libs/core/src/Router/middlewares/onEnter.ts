import type { MiddlewareFactory, Route } from 'router5/dist/types/router';
import { findSegment } from './libs/findSegment';
import type { RouterDependencies } from '../interfaces';
import type { Router } from 'router5';
import type { Params } from 'router5/dist/types/base';

export interface IOnEnterMiddlewareConfig {
  onEnter?: (
    router: Router<RouterDependencies>,
    toStateParams: Params,
    fromStateParams: Params,
  ) => void;
}

export const onEnterMiddlewareFactory =
  (
    routes: Route<RouterDependencies>[],
  ): MiddlewareFactory<RouterDependencies> =>
  (router) =>
  (toState, fromState): boolean => {
    const segment = findSegment(toState.name, routes);

    if (segment && (segment as any).onEnter) {
      (segment as any).onEnter(router, toState.params, fromState?.params);
    }

    return true;
  };
