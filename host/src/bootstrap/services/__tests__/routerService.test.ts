import { BootstrapRouterService } from '../routerService';
import { type Router } from '@riogz/router';
import { type IMenuItem, type IRoutes } from '@platform/core';

const routes = [{ path: 'test_path', name: 'test_name' }];

describe('BootstrapRouterService', () => {
  describe('initRouter', () => {
    test('should create instance of router', () => {
      const classInstance = new BootstrapRouterService();

      classInstance.initRouter(routes, 'my-app');

      expect(classInstance.router).toBeDefined();
      expect(classInstance.routes).toStrictEqual(routes);
    });

    test('should not create instance of router if init method not called', () => {
      const classInstance = new BootstrapRouterService();
      const state = classInstance.router.getState();
      expect(state).toBeNull();
    });

    test('should throw error if routes already initialized', () => {
      const inst = new BootstrapRouterService();
      inst.initRouter(routes, 'my-app');

      expect(() => inst.initRouter(routes, 'my-app')).toThrowError();
    });
  });

  describe('registerRoutes', () => {
    test('should register routes without duplicates', () => {
      const classInstance = new BootstrapRouterService();
      classInstance.initRouter([], 'my-app');

      const newRoutes = [
        { path: '/test1', name: 'test1' },
        { path: '/test2', name: 'test2' },
      ];

      classInstance.registerRoutes(newRoutes);

      expect(classInstance.routes).toHaveLength(2);
      expect(classInstance.routes).toContainEqual(newRoutes[0]);
      expect(classInstance.routes).toContainEqual(newRoutes[1]);
    });

    test('should not register duplicate routes', () => {
      const classInstance = new BootstrapRouterService();
      const initialRoutes = [{ path: '/test1', name: 'test1' }];
      classInstance.initRouter(initialRoutes, 'my-app');

      const duplicateRoutes = [
        { path: '/test1', name: 'test1' },
        { path: '/test2', name: 'test2' },
      ];

      classInstance.registerRoutes(duplicateRoutes);

      expect(classInstance.routes).toHaveLength(2);
      expect(
        classInstance.routes.filter((r) => r.name === 'test1'),
      ).toHaveLength(1);
    });

    test('should do nothing if all routes are duplicates', () => {
      const classInstance = new BootstrapRouterService();
      const initialRoutes = [
        { path: '/test1', name: 'test1' },
        { path: '/test2', name: 'test2' },
      ];
      classInstance.initRouter(initialRoutes, 'my-app');

      classInstance.registerRoutes(initialRoutes);

      expect(classInstance.routes).toHaveLength(2);
    });
  });

  describe('routerPostInit', () => {
    test('should call routerPostInit method', () => {
      const classInstance = new BootstrapRouterService();
      classInstance.initRouter(routes, 'my-app');

      const cbMock = vi.fn();
      const cb = (
        router: Router<Record<string, unknown>>,
      ): Router<Record<string, unknown>> => {
        cbMock();
        return router;
      };

      classInstance.routerPostInit(cb);

      expect(cbMock).toBeCalled();
    });
  });

  describe('buildRoutesMenu', () => {
    test('should build routes menu', () => {
      const routes: IRoutes = [
        {
          path: 'test_path',
          name: 'test_name',
          menu: {
            text: 'test_text',
            sortOrder: 0,
            navigate: { path: 'test_text_2' },
          },
        },
        {
          path: 'test_path_2',
          name: 'test_name_2',
          menu: { text: 'test_text_2', sortOrder: 1, menuAlwaysExpand: true },
        },
        {
          path: 'test_path_3',
          name: 'test_name_3',
          children: [
            {
              path: 'test_path_3_1',
              name: 'test_name_3_1',
              menu: { text: 'test_text_3_1' },
            },
          ],
        },
        {
          path: 'test_path_3.test_path_3_2',
          name: 'test_name_3.test_name_3_2',
          menu: { text: 'test_text_4' },
          children: [
            {
              path: 'test_path_4_1',
              name: 'test_name_4_1',
              menu: { text: 'test_text_4_1' },
            },
          ],
        },
      ];

      const classInstance = new BootstrapRouterService();
      classInstance.initRouter(routes, 'my-app');

      const result = classInstance.buildRoutesMenu(routes);

      expect(result).toStrictEqual([
        {
          children: undefined,
          icon: undefined,
          id: '0',
          menuAlwaysExpand: undefined,
          navigate: {
            path: 'test_text_2',
          },
          pageComponent: undefined,
          path: 'test_name',
          sortOrder: 0,
          text: 'test_text',
        },
        {
          children: undefined,
          icon: undefined,
          id: '1',
          menuAlwaysExpand: true,
          navigate: undefined,
          pageComponent: undefined,
          path: 'test_name_2',
          sortOrder: 1,
          text: 'test_text_2',
        },
        {
          icon: undefined,
          id: '2',
          menuAlwaysExpand: undefined,
          navigate: undefined,
          pageComponent: undefined,
          path: 'test_name_3.test_name_3_2',
          sortOrder: undefined,
          text: 'test_text_4',
        },
      ]);
    });
    test('should children menu to be empty', () => {
      const routesConfig = [
        {
          name: 'route1',
          path: 'route1',
          menu: {
            text: 'Menu1',
            icon: 'icon1',
            sortOrder: 1,
            navigate: {
              id: 'rout-id-1',
              path: 'route1',
            },
          },
        },
      ];
      const path = [0];

      const classInstance = new BootstrapRouterService();
      classInstance.initRouter(routes, 'my-app');

      let current = classInstance.buildRoutesMenu(routesConfig);

      for (const key of path) {
        if (!current[key].children) {
          current[key].children = [];
        }
        current = current[key].children || [];
      }

      expect(current).toEqual([]);
    });
    test('should children menu to be set', () => {
      const routesConfig = [
        {
          name: 'route1',
          path: 'route1',
          children: [
            {
              name: 'route2',
              path: 'route2',
              menu: {
                text: 'Menu2',
                icon: 'icon2',
                sortOrder: 2,
                navigate: {
                  id: 'rout-id-2',
                  path: 'route2',
                },
              },
            },
          ],
          menu: {
            text: 'Menu1',
            icon: 'icon1',
            sortOrder: 1,
            navigate: {
              id: 'rout-id-1',
              path: 'route1',
            },
          },
        },
      ];
      const path = [0];
      const expected = [
        {
          children: undefined,
          icon: 'icon2',
          id: '50',
          menuAlwaysExpand: undefined,
          navigate: {
            id: 'rout-id-2',
            path: 'route2',
          },
          pageComponent: undefined,
          path: 'route2',
          sortOrder: 2,
          text: 'Menu2',
        },
      ];

      const classInstance = new BootstrapRouterService();
      classInstance.initRouter(routes, 'my-app');

      let current = classInstance.buildRoutesMenu(routesConfig);

      for (const key of path) {
        if (!current[key].children) {
          current[key].children = [];
        }
        current = current[key].children || [];
      }

      expect(current).toEqual(expected);
    });
    test('should handle routes without a menu configuration', () => {
      const routesConfig: IRoutes = [
        {
          name: 'home',
          path: 'home',
        },
        {
          name: 'about',
          path: 'about',
        },
      ];

      const expectedMenu: IMenuItem[] = [];

      const classInstance = new BootstrapRouterService();
      classInstance.initRouter(routes, 'my-app');

      const result = classInstance.buildRoutesMenu(routesConfig);

      expect(result).toEqual(expectedMenu);
    });
    test('should handle routes with children', () => {
      const routesConfig = [
        {
          name: 'route1',
          path: 'route1',
          children: [
            {
              name: 'route2',
              path: 'route2',
              menu: {
                text: 'Menu2',
                icon: 'icon2',
                sortOrder: 2,
                navigate: {
                  id: 'rout-id-2',
                  path: 'route2',
                },
              },
            },
          ],
          menu: {
            text: 'Menu1',
            icon: 'icon1',
            sortOrder: 1,
            navigate: {
              id: 'rout-id-1',
              path: 'route1',
            },
          },
        },
      ];

      const expectedMenu: IMenuItem[] = [
        {
          children: [
            {
              id: '50',
              children: undefined,
              icon: 'icon2',
              menuAlwaysExpand: undefined,
              navigate: {
                id: 'rout-id-2',
                path: 'route2',
              },
              pageComponent: undefined,
              path: 'route2',
              sortOrder: 2,
              text: 'Menu2',
            },
          ],
          id: '0',
          icon: 'icon1',
          menuAlwaysExpand: undefined,
          navigate: {
            id: 'rout-id-1',
            path: 'route1',
          },
          pageComponent: undefined,
          path: 'route1',
          sortOrder: 1,
          text: 'Menu1',
        },
      ];

      const classInstance = new BootstrapRouterService();
      classInstance.initRouter(routes, 'my-app');

      const result = classInstance.buildRoutesMenu(routesConfig);

      expect(result).toEqual(expectedMenu);
    });
    test('should build routes menu correctly with routePath.length > 0', () => {
      const routesConfig: IRoutes = [
        // define your routes here
      ];

      const classInstance = new BootstrapRouterService();
      const menuConfig = classInstance.buildRoutesMenu(routesConfig);

      // add assertions to verify that the menuConfig is built correctly
      // based on the given routesConfig when routePath.length > 0

      // example assertion
      expect(menuConfig).toHaveLength(0);
      // add more assertions as needed
    });
  });
});
