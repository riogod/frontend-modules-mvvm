import type { MiddlewareFactory, Route } from '@riogz/router/dist/types/router';
import { findSegment } from './libs/findSegment';
import type { RouterDependencies } from '../interfaces';
import type { Router } from '@riogz/router';
import type { Params } from '@riogz/router/dist/types/base';

export interface IOnEnterMiddlewareConfig {
  onEnter?: (
    router: Router<RouterDependencies>,
    toStateParams: Params,
    fromStateParams: Params,
  ) => Promise<void>;
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
