import { FC } from "react";
import { IProps } from "./interface.ts";
import { Typography } from "@todo/ui";
import { observer } from "mobx-react-lite";

const TodoItemDescription: FC<IProps> = ({ item }) => {
  return (
    <Typography
      variant="body1"
      color="text.primary"
      sx={
        item.completed
          ? { fontStyle: "italic", textDecoration: "line-through" }
          : {}
      }
      style={{ whiteSpace: "pre-line" }}
    >
      {item.description}
    </Typography>
  );
};

export default observer(TodoItemDescription);
