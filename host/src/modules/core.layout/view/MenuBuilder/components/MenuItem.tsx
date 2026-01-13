import { type FC, memo } from 'react';
import { useTheme } from '@mui/material';
import { type IMenuItem } from '@platform/core';
import {
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from '@platform/ui';

interface IProps {
  menuItem: IMenuItem;
  isActive: boolean;
  paddingLeft: number;
  navigate: (path: string) => void;
  t: (key: string) => string;
}

/**
 * Компонент для отображения элемента меню без вложенных элементов
 */
const MenuItem: FC<IProps> = ({
  menuItem,
  isActive,
  paddingLeft,
  navigate,
  t,
}) => {
  const theme = useTheme();

  const handleClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (menuItem.path) {
      navigate(menuItem.path);
    }
  };

  return (
    <ListItem disablePadding>
      <ListItemButton
        onClick={handleClick}
        selected={isActive}
        sx={{
          pl: theme.spacing(paddingLeft),
          py: theme.spacing(0.5),
          minHeight: 36,
          borderRadius: theme.shape.borderElementRadius,
          ml: '12px',
          mb: theme.spacing(0.125),
          '&.Mui-selected': {
            backgroundColor: 'action.selected',
            '&:hover': {
              backgroundColor: 'action.selected',
            },
          },
          '&:hover': {
            backgroundColor: 'action.hover',
          },
        }}
      >
        {menuItem.icon && (
          <ListItemIcon
            sx={{
              minWidth: 28,
              color: isActive ? 'primary.main' : 'text.secondary',
              '& svg': {
                fontSize: theme.typography.body2.fontSize,
              },
            }}
          >
            {menuItem.icon}
          </ListItemIcon>
        )}
        <ListItemText
          primary={t(menuItem.text)}
          slotProps={{
            primary: {
              sx: {
                color: isActive ? 'primary.main' : 'text.primary',
                fontWeight: isActive
                  ? theme.typography.fontWeightMedium
                  : theme.typography.fontWeightRegular,
                fontSize: theme.typography.body2.fontSize,
                lineHeight: 1.5,
              },
            },
          }}
        />
      </ListItemButton>
    </ListItem>
  );
};

export default memo(MenuItem);
