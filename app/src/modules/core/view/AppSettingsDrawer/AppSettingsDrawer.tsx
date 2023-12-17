import { FC } from "react";
import { IProps } from "./interfaces.tsx";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import ThemeModeToggle from "./components/ThemeModeToggle";
import { useTranslation } from "react-i18next";
import LanguageSelect from "./components/LanguageSelect";
import Drawer from "@mui/material/Drawer";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";

const AppSettingsDrawer: FC<IProps> = ({ drawerWidth, open, closeHandler }) => {
  const { t } = useTranslation("common");
  return (
    <Drawer
      anchor="right"
      open={open}
      elevation={0}
      onClose={closeHandler}
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: {
          width: drawerWidth,
          boxSizing: "border-box",
          backgroundColor: (theme) => theme.palette.background.paper,
        },
      }}
    >
      <Box
        sx={{
          p: 2,
          pl: 3,
          width: 1,
          height: 64,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Typography variant="h6">{t("settings.NAME")}</Typography>
        <IconButton
          color="primary"
          aria-label={t("actions.CLOSE")}
          onClick={closeHandler}
          edge="start"
        >
          <CloseIcon />
        </IconButton>
      </Box>
      <Divider />
      <Box
        sx={{
          width: 1,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Box sx={{ p: 2, pl: 3, pr: 3 }}>
          <ThemeModeToggle />
        </Box>
        <Box sx={{ p: 2, pl: 3, pr: 3 }}>
          <LanguageSelect />
        </Box>
      </Box>
    </Drawer>
  );
};

export default AppSettingsDrawer;
