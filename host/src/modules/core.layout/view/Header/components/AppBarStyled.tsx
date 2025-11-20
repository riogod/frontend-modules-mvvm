import { styled, AppBar } from '@todo/ui';
import { type AppBarProps } from '../interfaces.tsx';

export const AppBarStyled = styled(
  AppBar,
  {},
)<AppBarProps>(() => ({
  boxShadow: 'none',
  backdropFilter: 'blur(8px)',
}));
