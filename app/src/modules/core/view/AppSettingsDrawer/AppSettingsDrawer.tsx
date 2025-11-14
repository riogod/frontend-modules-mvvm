import { FC } from "react";
import { IProps } from "./interfaces.tsx";
import { Typography, MuiIconButton, CloseIcon, Divider, Box, Drawer } from "@todo/ui";
import ThemeModeToggle from "./components/ThemeModeToggle/index.tsx";
import { useTranslation } from "react-i18next";
import LanguageSelect from "./components/LanguageSelect/index.tsx";

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
        <MuiIconButton
          color="primary"
          aria-label={t("actions.CLOSE")}
          onClick={closeHandler}
          edge="start"
        >
          <CloseIcon />
        </MuiIconButton>
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
