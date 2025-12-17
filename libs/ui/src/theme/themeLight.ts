import { theme } from './theme';
import merge from '../utils/merge';
import { createTheme, type ThemeOptions } from '@mui/material/styles';

const lightThemeSettings: ThemeOptions = {
  palette: {
    mode: 'light',
  },
};
export const themeLight: ThemeOptions = createTheme(
  merge(theme, lightThemeSettings) as ThemeOptions,
);
