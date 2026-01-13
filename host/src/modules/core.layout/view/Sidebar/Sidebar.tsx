import { type FC, memo } from 'react';
import { Drawer, Box } from '@platform/ui';
import { useMediaQuery, useTheme } from '@mui/material';
import MenuBuilder from '../MenuBuilder/MenuBuilder';

export const DRAWER_WIDTH = 280;

interface IProps {
  open?: boolean;
  onClose?: () => void;
}

/**
 * Компонент бокового меню навигации
 */
const Sidebar: FC<IProps> = ({ open = true, onClose }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <Drawer
      variant={isMobile ? 'temporary' : 'permanent'}
      open={open}
      onClose={onClose}
      ModalProps={{
        keepMounted: true, // Улучшает производительность на мобильных
      }}
      sx={{
        width: DRAWER_WIDTH,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: DRAWER_WIDTH,
          boxSizing: 'border-box',
          borderRight: '1px solid',
          borderColor: 'transparent',

          position: 'fixed',
          top: 0,
          left: 0,
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'transparent',
          pt: theme.spacing(4),
        },
      }}
    >
      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
        }}
      >
        <MenuBuilder />
      </Box>
    </Drawer>
  );
};

export default memo(Sidebar);
