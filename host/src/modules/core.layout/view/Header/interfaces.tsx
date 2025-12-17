import { type MuiAppBarProps } from '@platform/ui';

export interface IProps extends AppBarProps {
  handleDrawerOpen: () => void;
  handleAppSettingsOpen: () => void;
}

export interface AppBarProps extends MuiAppBarProps {
  open?: boolean;
}
