import { FC } from "react";
import { ICompleteActions } from "./interface.ts";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import IconButton from "@mui/material/IconButton";
import { IconButtonProps } from "@mui/material/IconButton/IconButton";
import { observer } from "mobx-react-lite";

const TodoItemActionComplete: FC<ICompleteActions> = ({
  item,
  setComplete,
}) => {
  const iconButtonProps: IconButtonProps = {
    color: item.completed ? "success" : "error",
    onClick: setComplete,
  };

  const icon = item.completed ? (
    <CheckCircleIcon fontSize="medium" />
  ) : (
    <RadioButtonUncheckedIcon fontSize="medium" />
  );

  return <IconButton {...iconButtonProps}>{icon}</IconButton>;
};

export default observer(TodoItemActionComplete);
