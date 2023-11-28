import type { MiddlewareFactory, Route } from 'router5/dist/types/router';
import type { RouterDependencies } from '../interfaces';
import { findSegment } from './libs/findSegment';
import type { Params } from 'router5/dist/types/base';
import type { Router } from 'router5';

export interface IOnSyncPathMiddlewareConfig {
  onSyncPath?: (
    router: Router,
    toStateParams: Params,
    fromStateParams?: Params,
  ) => Promise<void>;
}

export const onSyncPathMiddlewareFactory =
  (
    routes: Route<RouterDependencies>[],
  ): MiddlewareFactory<RouterDependencies> =>
  (router) =>
  (toState, fromState): boolean => {
    const segmentsArray = toState.name.split('.');

    segmentsArray
      .map(
        (
          (acc) =>
          (val: string): string =>
            (acc += '.' + val).substring(1)
        )(''),
      )
      .reduce((result, pathName) => {
        const segment = findSegment(pathName, routes);

        if (segment && (segment as any).onSyncPath) {
          result = result.then(() =>
            (segment as any).onSyncPath(
              router,
              toState.params,
              fromState?.params,
            ),
          );
        }
        return result;
      }, Promise.resolve());

    return true;
  };
