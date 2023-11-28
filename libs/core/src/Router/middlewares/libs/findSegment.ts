import { Route } from 'router5';

export const findSegment = (
  toStateName: string,
  routes: Route[],
): Route | null => {
  const flatSearch = routes.find((route) => route.name === toStateName) || null;

  if (flatSearch) {
    return flatSearch;
  }

  const deepSearch = toStateName
    .split('.')
    .reduce<Route | null>((curSegment, curRouteName: string) => {
      if (curSegment && curSegment.children) {
        return (
          curSegment.children.find((seg: Route) => seg.name === curRouteName) ||
          null
        );
      }
      return routes.find((seg: any) => seg.name === curRouteName) || null;
    }, null);

  return deepSearch;
};
