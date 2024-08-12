import { theme } from './theme.ts';
import merge from '../utils/merge.ts';
import createTheme from '@mui/material/styles/createTheme';
import { ThemeOptions } from '@mui/material/styles/createTheme';

const lightThemeSettings: ThemeOptions = {
  palette: {
    mode: 'light',
  },
};
export const themeLight: ThemeOptions = createTheme(
  merge(theme, lightThemeSettings) as ThemeOptions,
);
