import { type FC, memo, useState, useCallback, type MouseEvent } from 'react';
import { type IMenuItem } from '@platform/core';
import {
  MuiIconButton,
  MenuIcon,
  Typography,
  Box,
  MuiMenu,
  MenuItem,
} from '@platform/ui';

interface IProps {
  menuList: IMenuItem[];
  navigate: (path: string) => void;
  t: (key: string) => string;
}

/**
 * Компонент для построения меню из конфигурации роутера.
 */
const MobileMenuView: FC<IProps> = ({ menuList, navigate, t }) => {
  const [anchorElNav, setAnchorElNav] = useState<null | HTMLElement>(null);

  const handleOpenNavMenu = useCallback((event: MouseEvent<HTMLElement>) => {
    setAnchorElNav(event.currentTarget);
  }, []);

  const handleCloseNavMenu = useCallback(() => {
    setAnchorElNav(null);
  }, []);

  const handleNavigate = useCallback(
    (path: string) => () => {
      handleCloseNavMenu();
      navigate(path);
    },
    [handleCloseNavMenu, navigate],
  );

  return (
    <Box sx={{ flexGrow: 1, display: { xs: 'flex', md: 'none' } }}>
      <MuiIconButton
        size="large"
        aria-label="account of current user"
        aria-controls="menu-appbar"
        aria-haspopup="true"
        onClick={handleOpenNavMenu}
        color="inherit"
      >
        <MenuIcon />
      </MuiIconButton>
      <MuiMenu
        id="menu-appbar"
        anchorEl={anchorElNav}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        keepMounted={false}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        open={Boolean(anchorElNav)}
        onClose={handleCloseNavMenu}
        sx={{
          display: { xs: 'block', md: 'none' },
        }}
      >
        {menuList.map((page) => (
          <MenuItem key={page.id} onClick={handleNavigate(page.path)}>
            <Typography textAlign="center"> {t(page.text)}</Typography>
          </MenuItem>
        ))}
      </MuiMenu>
    </Box>
  );
};

export default memo(MobileMenuView);
