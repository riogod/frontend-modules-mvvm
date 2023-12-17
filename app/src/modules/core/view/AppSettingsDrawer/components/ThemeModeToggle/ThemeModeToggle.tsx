import React, { FC } from "react";
import { Observer } from "mobx-react-lite";
import { useTranslation } from "react-i18next";
import { useVM } from "../../../../../../ui/hooks/useVM.ts";
import { ThemeMode } from "../../../../models/app.interface.ts";
import { UiSettingsViewModel } from "../../../../viewmodels/uiSettings.vm.ts";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import ToggleButton from "@mui/material/ToggleButton";
import Tooltip from "@mui/material/Tooltip";
import LightModeOutlinedIcon from "@mui/icons-material/LightModeOutlined";
import SettingsBrightnessOutlinedIcon from "@mui/icons-material/SettingsBrightnessOutlined";
import DarkModeOutlinedIcon from "@mui/icons-material/DarkModeOutlined";

const ThemeModeToggle: FC = () => {
  const { t } = useTranslation();
  const ui = useVM<UiSettingsViewModel>(UiSettingsViewModel);
  const handleAlignment = (
    _event: React.MouseEvent<HTMLElement>,
    value: ThemeMode,
  ) => {
    ui.setThemeMode(value);
  };

  const ButtonsData = [
    {
      value: "light",
      ariaLabel: t("common:settings.aria.theme-light"),
      title: t("common:settings.MODE.LIGHT"),
      icon: <LightModeOutlinedIcon />,
    },
    {
      value: "system",
      ariaLabel: t("common:settings.aria.theme-system"),
      title: t("common:settings.MODE.SYSTEM"),
      icon: <SettingsBrightnessOutlinedIcon />,
    },
    {
      value: "dark",
      ariaLabel: t("common:settings.aria.theme-dark"),
      title: t("common:settings.MODE.DARK"),
      icon: <DarkModeOutlinedIcon />,
    },
  ];

  return (
    <Observer>
      {() => (
        <>
          <Typography variant="subtitle2" color="text.secondary">
            {t("common:settings.MODE.NAME")}
          </Typography>
          <Box>
            <ToggleButtonGroup
              value={ui.colorModeSettings}
              color="primary"
              exclusive
              size="small"
              onChange={handleAlignment}
              aria-label={t("common:settings.aria.theme-mode")}
              sx={{
                display: "flex",
                justifyContent: "center",
                mt: 1,
              }}
            >
              {ButtonsData.map((theme) => (
                <ToggleButton
                  key={theme.value}
                  value={theme.value}
                  aria-label={theme.ariaLabel}
                >
                  <Tooltip title={theme.title}>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        pl: 2,
                        pr: 2,
                      }}
                    >
                      {theme.icon}
                    </Box>
                  </Tooltip>
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          </Box>
        </>
      )}
    </Observer>
  );
};

export default ThemeModeToggle;
