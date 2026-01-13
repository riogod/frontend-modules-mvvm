import { createTheme } from '@mui/material/styles';
import { theme } from './theme';
import merge from '../utils/merge';
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
 * Настройки темной темы
 * Переопределяет базовую тему для dark mode
 * Использует более светлые оттенки для лучшей видимости на темном фоне
 */
const darkThemeSettings: ThemeOptions = {
  palette: {
    mode: 'dark',
    // Brand colors (более светлые оттенки для dark theme)
    primary: {
      ...primaryColors,
      main: primaryColors[400], // #818cf8 (более светлый для видимости)
      light: primaryColors[300], // #a5b4fc (еще светлее)
      dark: primaryColors[600], // #4f46e5 (оригинальный main как dark)
      contrastText: '#0a0a0a', // Темный текст на светлом фоне
    },
    secondary: {
      ...secondaryColors,
      main: secondaryColors[400], // #2dd4bf (более светлый)
      light: secondaryColors[300], // #5eead4 (еще светлее)
      dark: secondaryColors[600], // #0d9488 (оригинальный main как dark)
      contrastText: '#0a0a0a',
    },
    // Semantic colors (более светлые оттенки для dark theme)
    success: {
      ...successColors,
      main: successColors[400], // #4ade80 (более светлый)
      light: successColors[300], // #86efac (еще светлее)
      dark: successColors[600], // #16a34a (оригинальный main как dark)
      contrastText: '#0a0a0a',
    },
    error: {
      ...errorColors,
      main: errorColors[400], // #f87171 (более светлый)
      light: errorColors[300], // #fca5a5 (еще светлее)
      dark: errorColors[600], // #dc2626 (оригинальный main как dark)
      contrastText: '#0a0a0a',
    },
    warning: {
      ...warningColors,
      main: warningColors[400], // #fbbf24 (более светлый)
      light: warningColors[300], // #fcd34d (еще светлее)
      dark: warningColors[600], // #d97706 (оригинальный main как dark)
      contrastText: '#0a0a0a',
    },
    info: {
      ...infoColors,
      main: infoColors[400], // #60a5fa (более светлый)
      light: infoColors[300], // #93c5fd (еще светлее)
      dark: infoColors[600], // #2563eb (оригинальный main как dark)
      contrastText: '#0a0a0a',
    },
    // Backgrounds
    background: {
      default: '#0f1419', // Глубокий уголь (не чистый черный)
      paper: '#1a1f27', // Более светлый уголь для поверхностей
      appBackground: `
        radial-gradient(ellipse 100% 80% at 50% 0%, rgba(99, 102, 241, 0.06), transparent 70%),
        radial-gradient(ellipse 80% 60% at 0% 100%, rgba(20, 184, 166, 0.05), transparent 60%),
        radial-gradient(ellipse 80% 60% at 100% 50%, rgba(34, 197, 94, 0.03), transparent 60%),
        linear-gradient(180deg, #141920 0%, #0f1419 50%, #0a0e13 100%)
      `,
    },
    // Text colors (более высокая непрозрачность для dark theme)
    text: {
      primary: 'rgba(255, 255, 255, 0.95)', // 95% белый
      secondary: 'rgba(255, 255, 255, 0.70)', // 70% белый
      disabled: 'rgba(255, 255, 255, 0.38)', // 38% белый
    },
    // Dividers
    divider: 'rgba(255, 255, 255, 0.12)', // 12% белый
    // Action colors (UI элементы)
    action: {
      active: 'rgba(255, 255, 255, 0.56)',
      hover: 'rgba(255, 255, 255, 0.08)',
      hoverOpacity: 0.08,
      selected: 'rgba(255, 255, 255, 0.16)',
      selectedOpacity: 0.16,
      disabled: 'rgba(255, 255, 255, 0.30)',
      disabledBackground: 'rgba(255, 255, 255, 0.12)',
      disabledOpacity: 0.38,
      focus: 'rgba(255, 255, 255, 0.12)',
      focusOpacity: 0.12,
      activatedOpacity: 0.24,
    },
  },
};

export const themeDark = createTheme({
  ...merge(theme, darkThemeSettings),
  // Переопределяем shadows для dark theme (более высокая непрозрачность)
  shadows: [
    'none',
    '0px 1px 2px rgba(0, 0, 0, 0.3)',
    '0px 1px 4px rgba(0, 0, 0, 0.4)',
    '0px 1px 5px rgba(0, 0, 0, 0.45)',
    '0px 2px 8px rgba(0, 0, 0, 0.5)',
    '0px 2px 10px rgba(0, 0, 0, 0.55)',
    '0px 3px 12px rgba(0, 0, 0, 0.6)',
    '0px 3px 14px rgba(0, 0, 0, 0.65)',
    '0px 4px 16px rgba(0, 0, 0, 0.7)',
    '0px 4px 18px rgba(0, 0, 0, 0.75)',
    '0px 5px 20px rgba(0, 0, 0, 0.78)',
    '0px 5px 22px rgba(0, 0, 0, 0.8)',
    '0px 6px 24px rgba(0, 0, 0, 0.8)',
    '0px 6px 26px rgba(0, 0, 0, 0.83)',
    '0px 7px 28px rgba(0, 0, 0, 0.85)',
    '0px 7px 30px rgba(0, 0, 0, 0.88)',
    '0px 8px 32px rgba(0, 0, 0, 0.9)',
    '0px 8px 34px rgba(0, 0, 0, 0.93)',
    '0px 9px 36px rgba(0, 0, 0, 0.95)',
    '0px 9px 38px rgba(0, 0, 0, 0.98)',
    '0px 10px 40px rgba(0, 0, 0, 0.95)',
    '0px 10px 42px rgba(0, 0, 0, 0.98)',
    '0px 11px 44px rgba(0, 0, 0, 0.98)',
    '0px 11px 46px rgba(0, 0, 0, 0.98)',
    '0px 12px 48px rgba(0, 0, 0, 0.95)',
  ],
  // Обновляем компоненты для dark theme
  components: {
    ...merge(theme, darkThemeSettings).components,
    // Обновляем Paper для dark theme
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
        elevation1: {
          boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.3)',
        },
        elevation2: {
          boxShadow: '0px 1px 4px rgba(0, 0, 0, 0.4)',
        },
        elevation4: {
          boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.5)',
        },
        elevation6: {
          boxShadow: '0px 3px 12px rgba(0, 0, 0, 0.6)',
        },
        elevation8: {
          boxShadow: '0px 4px 16px rgba(0, 0, 0, 0.7)',
        },
        elevation12: {
          boxShadow: '0px 6px 24px rgba(0, 0, 0, 0.8)',
        },
        elevation16: {
          boxShadow: '0px 8px 32px rgba(0, 0, 0, 0.9)',
        },
        elevation24: {
          boxShadow: '0px 12px 48px rgba(0, 0, 0, 0.95)',
        },
      },
    },
    // Обновляем Tooltip для dark theme
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          borderRadius: 6,
          boxShadow: '0px 4px 16px rgba(0, 0, 0, 0.7)',
          fontSize: '0.75rem',
          padding: '6px 12px',
        },
        arrow: {
          color: 'rgba(255, 255, 255, 0.95)',
        },
      },
    },
  },
} as unknown as ThemeOptions);
