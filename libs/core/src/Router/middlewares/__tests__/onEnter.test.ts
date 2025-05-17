import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createRouter } from '@riogz/router';
import { IRoutes, RouterDependencies } from '../../interfaces';
import { onEnterMiddlewareFactory } from '../onEnter';
import { Middleware, MiddlewareFactory } from '@riogz/router/dist/types/router';

const router = createRouter([], {
  allowNotFound: false,
  autoCleanUp: false,
  defaultRoute: '404',
});

describe('onEnterMiddlewareFactory', () => {
  let routes: IRoutes;
  let middlewareFactory: MiddlewareFactory<RouterDependencies>;
  let middleware: Middleware;

  beforeEach(() => {
    routes = [
      { name: 'segment1', path: '/segment1', onEnter: vi.fn() },
      { name: 'segment2', path: '/segment2', onEnter: vi.fn() },
    ];

    middlewareFactory = onEnterMiddlewareFactory(routes);
    middleware = middlewareFactory(router, []);
  });

  it('should call onEnter function if segment is found', () => {
    const toState = {
      name: 'segment2',
      path: '/segment2',
      params: {},
    };
    const fromState = {
      name: 'segment1',
      path: '/segment1',
      params: {},
    };

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    const result = middleware(toState, fromState, () => {});

    expect(routes[1].onEnter).toHaveBeenCalled();
    expect(result).toBe(true);
  });

  it('should return true if segment is not found ', () => {
    const toState = {
      name: 'segment3',
      path: '/segment3',
      params: {},
    };
    const fromState = {
      name: 'segment1',
      path: '/segment1',
      params: {},
    };

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    const result = middleware(toState, fromState, () => {});

    expect(result).toBe(true);
  });
  it('should return true if segment is found but onEnter function is not defined', () => {
    routes = [
      { name: 'segment1', path: '/segment1' },
      { name: 'segment2', path: '/segment2', onEnter: vi.fn() },
    ];

    middlewareFactory = onEnterMiddlewareFactory(routes);
    middleware = middlewareFactory(router, []);

    const toState = {
      name: 'segment1',
      path: '/segment1',
      params: {},
    };
    const fromState = {
      name: 'segment1',
      path: '/segment1',
      params: {},
    };

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    const result = middleware(toState, fromState, () => {});

    expect(result).toBe(true);
  });
});
