import type {
  Middleware,
  MiddlewareFactory,
  Route,
} from 'router5/dist/types/router';
import { findSegment } from './libs/findSegment';
import type { RouterDependencies } from '../interfaces';

export interface ITitleMiddlewareConfig {
  /**
   * Заголовок вкадки браузера
   */
  title?: string;
}

export const titleMiddlewareFactory =
  (
    routes: Route<RouterDependencies>[],
  ): MiddlewareFactory<RouterDependencies> =>
  (): Middleware =>
  (toState, _fromState, done): void => {
    const segment = findSegment(toState.name, routes);

    if (segment && (segment as any).title) {
      document.title = (segment as any).title;
    }

    done();
  };
