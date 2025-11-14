import { createTheme, ThemeOptions } from '@mui/material/styles';
import { theme } from './theme';
import merge from '../utils/merge';

const darkThemeSettings: ThemeOptions = {
  palette: {
    mode: 'dark',
    background: {
      default: 'rgba(16, 20, 24, 1)',
      paper: 'rgba(16, 20, 24,1)',
    },
  },
};
export const themeDark: ThemeOptions = createTheme(
  merge(theme, darkThemeSettings) as ThemeOptions,
);
