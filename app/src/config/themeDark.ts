import createTheme from '@mui/material/styles/createTheme';
import { ThemeOptions } from '@mui/material/styles/createTheme';
import { theme } from './theme.ts';
import merge from '../utils/merge.ts';

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
