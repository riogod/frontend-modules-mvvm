import { styled } from "@mui/material/styles";
import MuiAppBar from "@mui/material/AppBar";
import { AppBarProps } from "../interfaces.tsx";

export const AppBarStyled = styled(
  MuiAppBar,
  {},
)<AppBarProps>(({}) => ({
  boxShadow: "none",
  backdropFilter: "blur(8px)",
}));
