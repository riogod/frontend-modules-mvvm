import { styled, AppBar } from '@platform/ui';
import { type AppBarProps } from '../interfaces';

export const AppBarStyled = styled(
  AppBar,
  {},
)<AppBarProps>(() => ({
  backgroundColor: 'transparent',
  boxShadow: 'none',
  // backdropFilter: 'blur(8px)',
}));
