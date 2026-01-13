import { theme } from './theme';
import merge from '../utils/merge';
import { createTheme } from '@mui/material/styles';
import { type ThemeOptions } from './interfaces';
import {
  primaryColors,
  secondaryColors,
  successColors,
  errorColors,
  warningColors,
  infoColors,
} from './colors';

/**
 * Настройки светлой темы
 * Переопределяет базовую тему для light mode
 */
const lightThemeSettings: ThemeOptions = {
  palette: {
    mode: 'light',
    // Brand colors (используем базовые значения из theme.ts)
    primary: {
      ...primaryColors,
      main: primaryColors[500], // #6366f1
      light: primaryColors[400], // #818cf8
      dark: primaryColors[700], // #4338ca
      contrastText: '#ffffff',
    },
    secondary: {
      ...secondaryColors,
      main: secondaryColors[500], // #14b8a6
      light: secondaryColors[400], // #2dd4bf
      dark: secondaryColors[700], // #0f766e
      contrastText: '#ffffff',
    },
    // Semantic colors
    success: {
      ...successColors,
      main: successColors[500], // #22c55e
      light: successColors[400], // #4ade80
      dark: successColors[700], // #15803d
      contrastText: '#ffffff',
    },
    error: {
      ...errorColors,
      main: errorColors[500], // #ef4444
      light: errorColors[400], // #f87171
      dark: errorColors[700], // #b91c1c
      contrastText: '#ffffff',
    },
    warning: {
      ...warningColors,
      main: warningColors[500], // #f59e0b
      light: warningColors[400], // #fbbf24
      dark: warningColors[700], // #b45309
      contrastText: '#000000',
    },
    info: {
      ...infoColors,
      main: infoColors[500], // #3b82f6
      light: infoColors[400], // #60a5fa
      dark: infoColors[700], // #1d4ed8
      contrastText: '#ffffff',
    },
    // Backgrounds
    background: {
      default: '#f9fafb', // Мягкий серый вместо чистого белого
      paper: '#ffffff', // Чистый белый для поверхностей
      appBackground: `
        radial-gradient(circle at 30% 70%, rgba(99, 102, 241, 0.03), transparent 60%),
        radial-gradient(circle at 70% 30%, rgba(20, 184, 166, 0.04), transparent 60%),
        #f9fafb
      `,
    },
    // Text colors
    text: {
      primary: 'rgba(0, 0, 0, 0.87)', // 87% черный (MUI standard)
      secondary: 'rgba(0, 0, 0, 0.60)', // 60% черный
      disabled: 'rgba(0, 0, 0, 0.38)', // 38% черный
    },
    // Dividers
    divider: 'rgba(0, 0, 0, 0.12)', // 12% черный
    // Action colors (UI элементы)
    action: {
      active: 'rgba(0, 0, 0, 0.54)',
      hover: 'rgba(0, 0, 0, 0.04)',
      hoverOpacity: 0.04,
      selected: 'rgba(0, 0, 0, 0.08)',
      selectedOpacity: 0.08,
      disabled: 'rgba(0, 0, 0, 0.26)',
      disabledBackground: 'rgba(0, 0, 0, 0.12)',
      disabledOpacity: 0.38,
      focus: 'rgba(0, 0, 0, 0.12)',
      focusOpacity: 0.12,
      activatedOpacity: 0.12,
    },
  },
};

export const themeLight = createTheme(
  merge(theme, lightThemeSettings) as unknown as ThemeOptions,
);
