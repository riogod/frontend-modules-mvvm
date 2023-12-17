import { theme } from './theme.ts';
import merge from '../utils/merge.ts';
import { createTheme, ThemeOptions } from '@mui/material';

const lightThemeSettings: ThemeOptions = {
  palette: {
    mode: 'light',
  },
};
export const themeLight: ThemeOptions = createTheme(
  // @ts-ignore
  merge(theme, lightThemeSettings),
);
