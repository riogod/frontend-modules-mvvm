import { type FC, useState, useCallback } from 'react';
import { observer } from 'mobx-react-lite';
import { Header } from '../Header';
import AppSettingsDrawer from '../AppSettingsDrawer';
import ContentContainer from '../ContentContainer';
import Sidebar from '../Sidebar';
import { Box } from '@platform/ui';
import Notifier from '../Notifier/Notifier';

const Layout: FC = () => {
  const [open, setOpen] = useState(false);
  const [openAppSettings, setOpenAppSettings] = useState(false);

  const openAppSettingsHandler = useCallback(() => {
    setOpenAppSettings(true);
  }, []);

  const closeAppSettingsHandler = useCallback(() => {
    setOpenAppSettings(false);
  }, []);

  const handleDrawerOpen = useCallback(() => {
    setOpen(true);
  }, []);

  const handleDrawerClose = useCallback(() => {
    setOpen(false);
  }, []);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        background: (theme) => theme.palette.background.appBackground,
      }}
    >
      <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <Sidebar open={open} onClose={handleDrawerClose} />
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            display: 'flex',
            overflow: 'auto',
            position: 'relative',
            flexDirection: 'column',
          }}
        >
          <Header
            open={open}
            handleDrawerOpen={handleDrawerOpen}
            handleAppSettingsOpen={openAppSettingsHandler}
          />
          <Box
            sx={{
              pt: (theme) => ({
                xs: theme.spacing(2),
                md: theme.spacing(2),
              }),
              pb: (theme) => ({
                xs: theme.spacing(2),
                md: theme.spacing(2),
              }),
            }}
          >
            <ContentContainer />
          </Box>
        </Box>
      </Box>
      <AppSettingsDrawer
        drawerWidth={360}
        open={openAppSettings}
        closeHandler={closeAppSettingsHandler}
      />
      <Notifier />
    </Box>
  );
};

export default observer(Layout);
