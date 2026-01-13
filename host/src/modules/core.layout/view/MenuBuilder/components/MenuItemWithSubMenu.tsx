import { type FC, memo, type ReactElement } from 'react';
import { useTheme } from '@mui/material';
import { type IMenuItem } from '@platform/core';
import {
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
} from '@platform/ui';
import { ExpandLess, ExpandMore } from '@platform/ui';

interface IProps {
  menuItem: IMenuItem;
  isActive: boolean;
  isExpanded: boolean;
  paddingLeft: number;
  level: number;
  t: (key: string) => string;
  onToggleExpand: (itemId: string) => void;
  renderMenuItem: (menuItem: IMenuItem, level: number) => ReactElement;
}

/**
 * Компонент для отображения элемента меню с вложенными элементами (подменю)
 */
const MenuItemWithSubMenu: FC<IProps> = ({
  menuItem,
  isActive,
  isExpanded,
  paddingLeft,
  level,
  t,
  onToggleExpand,
  renderMenuItem,
}) => {
  const theme = useTheme();

  const handleClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    onToggleExpand(menuItem.id);
  };

  return (
    <>
      <ListItem disablePadding>
        <ListItemButton
          onClick={handleClick}
          selected={false}
          sx={{
            pl: theme.spacing(paddingLeft),
            py: theme.spacing(0.5),
            minHeight: 36,
            borderRadius: theme.shape.borderElementRadius,
            ml: '12px',
            mb: theme.spacing(0.125),
            // '&.Mui-selected': {
            //   backgroundColor: 'action.selected',
            //   '&:hover': {
            //     backgroundColor: 'action.selected',
            //   },
            // },
            // '&:hover': {
            //   backgroundColor: 'action.hover',
            // },
          }}
        >
          {menuItem.icon && (
            <ListItemIcon
              sx={{
                minWidth: 28,
                // color: isActive ? 'primary.main' : 'text.secondary',
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
                  //   color: isActive ? 'primary.main' : 'text.primary',
                  fontWeight: isActive
                    ? theme.typography.fontWeightMedium
                    : theme.typography.fontWeightRegular,
                  fontSize: theme.typography.body2.fontSize,
                  lineHeight: 1.5,
                },
              },
            }}
          />
          {isExpanded ? (
            <ExpandLess
              sx={{
                color: 'text.secondary',
                fontSize: theme.typography.body2.fontSize,
              }}
            />
          ) : (
            <ExpandMore
              sx={{
                color: 'text.secondary',
                fontSize: theme.typography.body2.fontSize,
              }}
            />
          )}
        </ListItemButton>
      </ListItem>
      <Collapse in={isExpanded} timeout="auto" unmountOnExit>
        <List component="div" disablePadding>
          {menuItem.children?.map((child) => renderMenuItem(child, level + 1))}
        </List>
      </Collapse>
    </>
  );
};

export default memo(MenuItemWithSubMenu);
