import { IMenuItem } from "@todo/core";
import { FunctionComponent } from "react";

export function findSegment(
  obj: Array<IMenuItem>,
  item: Array<string>,
  result: Array<string> = [],
): FunctionComponent | undefined {
  for (const key in obj) {
    const route = obj[key].path.split(".");
    const routeLast = route[route.length - 1];

    if (routeLast === item[0]) {
      if (obj[key].children && obj[key].children?.length && item.length > 1) {
        return findSegment(obj[key].children || [], item.slice(1), result);
      } else {
        return obj[key].pageComponent;
      }
    }
  }
}
