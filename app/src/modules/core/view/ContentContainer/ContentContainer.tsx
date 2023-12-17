import { createElement, FC, Suspense } from "react";
import { useRoute } from "react-router5";
import { IMenuItem } from "@todo/core";
import { findSegment } from "./util.ts";
import NotFoundPage from "../NotFoundPage.tsx";
import { observer } from "mobx-react-lite";

const ContentContainer: FC = () => {
  const route = useRoute();

  const segmentsArray = route.route.name.split(".");

  const appRoutes = route.router.getDependencies().menu as IMenuItem[];

  const pageComponent = findSegment(appRoutes, segmentsArray);

  return pageComponent ? (
    <Suspense>{createElement(pageComponent)}</Suspense>
  ) : (
    <NotFoundPage />
  );
};

export default observer(ContentContainer);
