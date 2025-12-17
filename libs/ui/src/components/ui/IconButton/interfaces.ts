import { type ReactNode } from "react";
import { type ButtonProps } from "@mui/material/Button";

export interface IProps extends ButtonProps {
  icon: ReactNode;
}
