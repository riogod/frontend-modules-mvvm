import { FC, useState } from "react";
import { observer } from "mobx-react-lite";
import { Header } from "../Header";
import AppSettingsDrawer from "../AppSettingsDrawer";
import ContentContainer from "../ContentContainer";
import Container from "@mui/material/Container";
import Toolbar from "@mui/material/Toolbar";
import { Notifier } from "../Notifier";

const Layout: FC = () => {
  const [open, setOpen] = useState(false);
  const [openAppSettings, setOpenAppSettings] = useState(false);

  const openAppSettingsHandler = () => {
    setOpenAppSettings(true);
  };

  const closeAppSettingsHandler = () => {
    setOpenAppSettings(false);
  };

  const handleDrawerOpen = () => {
    setOpen(true);
  };

  return (
    <>
      <Header
        open={open}
        handleDrawerOpen={handleDrawerOpen}
        handleAppSettingsOpen={openAppSettingsHandler}
      />
      <Container maxWidth="xl" sx={{ height: "calc(100% - 64px)" }}>
        <Toolbar disableGutters />
        <ContentContainer />
      </Container>
      <AppSettingsDrawer
        drawerWidth={360}
        open={openAppSettings}
        closeHandler={closeAppSettingsHandler}
      />
      <Notifier />
    </>
  );
};

export default observer(Layout);
