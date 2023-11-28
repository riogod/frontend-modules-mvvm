import type {
  IRoute,
  IRoutes,
  IMenuConfig,
  RouterDependencies,
  IMenuItem,
} from "./interfaces";
import { findSegment } from "./middlewares/libs/findSegment";
import { onEnterMiddlewareFactory } from "./middlewares/onEnter";
import type { IOnEnterMiddlewareConfig } from "./middlewares/onEnter";
import { onExitSearch } from "./middlewares/onExitSearch";
import { onPathMiddlewareFactory } from "./middlewares/onPath";
import type { IOnPathMiddlewareConfig } from "./middlewares/onPath";
import { onSyncPathMiddlewareFactory } from "./middlewares/onSyncPath";
import type { IOnSyncPathMiddlewareConfig } from "./middlewares/onSyncPath";
import { titleMiddlewareFactory } from "./middlewares/title";
import type { ITitleMiddlewareConfig } from "./middlewares/title";

export {
  onEnterMiddlewareFactory,
  onPathMiddlewareFactory,
  onSyncPathMiddlewareFactory,
  titleMiddlewareFactory,
  onExitSearch,
  findSegment,
};
export type {
  IRoute,
  IRoutes,
  IMenuConfig,
  IMenuItem,
  IOnEnterMiddlewareConfig,
  IOnPathMiddlewareConfig,
  IOnSyncPathMiddlewareConfig,
  ITitleMiddlewareConfig,
  RouterDependencies,
};
