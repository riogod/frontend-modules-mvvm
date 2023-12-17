import { FC } from "react";
import { observer } from "mobx-react-lite";
import Toolbar from "@mui/material/Toolbar";
import SettingsIcon from "@mui/icons-material/Settings";
import { IProps } from "./interfaces.tsx";
import { AppBarStyled } from "./components/AppBarStyled.tsx";
import { useTranslation } from "react-i18next";
import IconButton from "../../../../ui/components/IconButton";
import MenuBuilder from "../MenuBuilder";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";

const Header: FC<IProps> = ({ open, handleAppSettingsOpen }) => {
  const { t } = useTranslation("common");

  return (
    <AppBarStyled open={open} color="transparent">
      <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
        <Box
          sx={{ display: "flex", flexDirection: "row", alignItems: "center" }}
        >
          <MenuBuilder />
        </Box>
        <Box>
          <IconButton
            icon={<SettingsIcon fontSize="small" />}
            color="primary"
            size="small"
            variant="outlined"
            aria-label={t("settings.OPEN")}
            title={t("settings.OPEN")}
            onClick={handleAppSettingsOpen}
          />
        </Box>
      </Toolbar>
      <Divider />
    </AppBarStyled>
  );
};

export default observer(Header);
