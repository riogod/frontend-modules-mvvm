import type { IRoute, IRoutes, RouterDependencies } from "../interfaces";
import type { ActivationFnFactory, Router } from "router5";
import type { Container } from "inversify";

export interface IOnExitSearchUtilConfig {
  onExit?: (router: Router<Record<string, any>>, container: Container) => void;
}

/**
 *
 * Вызывает метод onExit, в случае его существования в ноде
 *
 * @param route
 * @param router
 * @param currentNodePath
 */
function callOnExit(
  route: IRoute,
  router: Router<Record<string, any>>,
  currentNodePath: string,
): void {
  router.canDeactivate(currentNodePath, ((): any => (): boolean => {
    route.onExit?.(router, router.getDependencies()["di"] as Container);
    return true;
  }) as ActivationFnFactory<RouterDependencies>);
}

/**
 *  Функция проходит по каждой ноде дерева роутов в поисках метода onExit
 *  и вызывает его.
 *
 * @param routes Все роуты
 * @param router Экземпляр роутера
 * @param currentNodePath Текущий путь ноды роутера
 */
export function onExitSearch(
  routes: IRoutes,
  router: Router<Record<string, any>>,
  currentNodePath: string = "",
): void {
  for (let i = 0; i < routes.length; i++) {
    const route = routes[i];

    const nodePath = currentNodePath.concat(
      !currentNodePath && route?.name ? route.name : `.${route?.name}`,
    );

    if (route?.onExit) {
      callOnExit(route, router, nodePath);
    }

    if (route?.children) {
      onExitSearch(route.children as IRoutes, router, nodePath);
    }
  }
}
