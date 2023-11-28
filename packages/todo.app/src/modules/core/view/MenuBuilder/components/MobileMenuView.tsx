import { FC, memo, useState } from "react";
import { IMenuItem } from "@todo/core";
import IconButton from "@mui/material/IconButton";
import MenuIcon from "@mui/icons-material/Menu";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";

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

  const handleOpenNavMenu = (event: any) => {
    setAnchorElNav(event.currentTarget);
  };

  const handleCloseNavMenu = () => {
    setAnchorElNav(null);
  };

  const onNavigate = (path: string) => () => {
    handleCloseNavMenu();
    navigate(path);
  };

  return (
    <Box sx={{ flexGrow: 1, display: { xs: "flex", md: "none" } }}>
      <IconButton
        size="large"
        aria-label="account of current user"
        aria-controls="menu-appbar"
        aria-haspopup="true"
        onClick={handleOpenNavMenu}
        color="inherit"
      >
        <MenuIcon />
      </IconButton>
      <Menu
        id="menu-appbar"
        anchorEl={anchorElNav}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "left",
        }}
        keepMounted
        transformOrigin={{
          vertical: "top",
          horizontal: "left",
        }}
        open={Boolean(anchorElNav)}
        onClose={handleCloseNavMenu}
        sx={{
          display: { xs: "block", md: "none" },
        }}
      >
        {menuList.map((page) => (
          <MenuItem key={page.id} onClick={onNavigate(page.path)}>
            <Typography textAlign="center"> {t(page.text)}</Typography>
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );
};

export default memo(MobileMenuView);
