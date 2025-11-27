import { styled, AppBar } from '@platform/ui';
import { type AppBarProps } from '../interfaces.tsx';

export const AppBarStyled = styled(
  AppBar,
  {},
)<AppBarProps>(() => ({
  boxShadow: 'none',
  backdropFilter: 'blur(8px)',
}));
