import { FC } from "react";
import { IProps } from "./interface.ts";
import { Typography } from "@todo/ui";
import { observer } from "mobx-react-lite";
import { useTranslation } from "react-i18next";

const TodoItemDate: FC<IProps> = ({ item }) => {
  const { t } = useTranslation("todo");

  const formattedUpdatedAt = item.updated_at.toLocaleString();
  const formattedCreatedAt = item.created_at.toLocaleString();

  const dateText =
    item.updated_at > item.created_at
      ? `${t("item.update")}: ${formattedUpdatedAt}`
      : `${t("item.add")}: ${formattedCreatedAt}`;

  return (
    <Typography variant="body2" color="text.secondary">
      {dateText}
    </Typography>
  );
};

export default observer(TodoItemDate);
