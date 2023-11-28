import { ReactNode } from "react";
import { ButtonProps } from "@mui/material/Button";

export interface IProps extends ButtonProps {
  icon: ReactNode;
}
