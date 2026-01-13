import './interfaces';
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
 * Базовая конфигурация темы
 * Содержит общие настройки, которые применяются к обеим темам (light и dark)
 */
export const theme: ThemeOptions = {
  spacing: 8, // Базовый unit для spacing системы (8px grid)

  typography: {
    fontFamily: [
      'Inter',
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),

    fontSize: 16,

    fontWeightLight: 300,
    fontWeightRegular: 400,
    fontWeightMedium: 500,
    fontWeightBold: 700,

    // Display text (largest)
    h1: {
      fontSize: '3rem',
      fontWeight: 700,
      lineHeight: 1.2,
      letterSpacing: '-0.02em',
    },

    h2: {
      fontSize: '2.25rem',
      fontWeight: 700,
      lineHeight: 1.3,
      letterSpacing: '-0.01em',
    },

    h3: {
      fontSize: '1.875rem',
      fontWeight: 600,
      lineHeight: 1.4,
      letterSpacing: '-0.005em',
    },

    h4: {
      fontSize: '1.5rem',
      fontWeight: 600,
      lineHeight: 1.5,
      letterSpacing: '0em',
    },

    h5: {
      fontSize: '1.25rem',
      fontWeight: 600,
      lineHeight: 1.5,
      letterSpacing: '0em',
    },

    h6: {
      fontSize: '1.125rem',
      fontWeight: 600,
      lineHeight: 1.5,
      letterSpacing: '0em',
    },

    // Body text
    body1: {
      fontSize: '1rem',
      fontWeight: 400,
      lineHeight: 1.6,
      letterSpacing: '0em',
    },

    body2: {
      fontSize: '0.875rem',
      fontWeight: 400,
      lineHeight: 1.6,
      letterSpacing: '0em',
    },

    // UI text
    button: {
      fontSize: '0.875rem',
      fontWeight: 500,
      lineHeight: 1.75,
      letterSpacing: '0.02em',
      textTransform: 'none',
    },

    caption: {
      fontSize: '0.75rem',
      fontWeight: 400,
      lineHeight: 1.5,
      letterSpacing: '0.03em',
    },

    overline: {
      fontSize: '0.75rem',
      fontWeight: 600,
      lineHeight: 2,
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
    },

    subtitle1: {
      fontSize: '1rem',
      fontWeight: 500,
      lineHeight: 1.75,
      letterSpacing: '0.00938em',
    },

    subtitle2: {
      fontSize: '0.875rem',
      fontWeight: 500,
      lineHeight: 1.57,
      letterSpacing: '0.00714em',
    },
  },

  palette: {
    // Primary: Indigo
    primary: {
      ...primaryColors,
      main: primaryColors[500],
      light: primaryColors[400],
      dark: primaryColors[700],
      contrastText: '#ffffff',
    },
    // Secondary: Teal
    secondary: {
      ...secondaryColors,
      main: secondaryColors[500],
      light: secondaryColors[400],
      dark: secondaryColors[700],
      contrastText: '#ffffff',
    },
    // Semantic colors
    success: {
      ...successColors,
      main: successColors[500],
      light: successColors[400],
      dark: successColors[700],
      contrastText: '#ffffff',
    },
    error: {
      ...errorColors,
      main: errorColors[500],
      light: errorColors[400],
      dark: errorColors[700],
      contrastText: '#ffffff',
    },
    warning: {
      ...warningColors,
      main: warningColors[500],
      light: warningColors[400],
      dark: warningColors[700],
      contrastText: '#000000', // Черный для лучшего контраста на желтом/оранжевом
    },
    info: {
      ...infoColors,
      main: infoColors[500],
      light: infoColors[400],
      dark: infoColors[700],
      contrastText: '#ffffff',
    },
  },
  shape: {
    borderRadius: 8, // Обновлено до 8px для соответствия spacing системе
    borderElementRadius: '8px',
    radius: {
      sm: 0,
      md: 18,
      lg: 18,
      xl: 3,
      xxl: 4,
      full: 4,
    },
  },
  shadows: [
    'none',
    '0px 1px 2px rgba(0, 0, 0, 0.05)',
    '0px 1px 4px rgba(0, 0, 0, 0.08)',
    '0px 1px 5px rgba(0, 0, 0, 0.09)',
    '0px 2px 8px rgba(0, 0, 0, 0.10)',
    '0px 2px 10px rgba(0, 0, 0, 0.11)',
    '0px 3px 12px rgba(0, 0, 0, 0.12)',
    '0px 3px 14px rgba(0, 0, 0, 0.13)',
    '0px 4px 16px rgba(0, 0, 0, 0.14)',
    '0px 4px 18px rgba(0, 0, 0, 0.15)',
    '0px 5px 20px rgba(0, 0, 0, 0.155)',
    '0px 5px 22px rgba(0, 0, 0, 0.16)',
    '0px 6px 24px rgba(0, 0, 0, 0.16)',
    '0px 6px 26px rgba(0, 0, 0, 0.165)',
    '0px 7px 28px rgba(0, 0, 0, 0.17)',
    '0px 7px 30px rgba(0, 0, 0, 0.175)',
    '0px 8px 32px rgba(0, 0, 0, 0.18)',
    '0px 8px 34px rgba(0, 0, 0, 0.185)',
    '0px 9px 36px rgba(0, 0, 0, 0.19)',
    '0px 9px 38px rgba(0, 0, 0, 0.195)',
    '0px 10px 40px rgba(0, 0, 0, 0.19)',
    '0px 10px 42px rgba(0, 0, 0, 0.195)',
    '0px 11px 44px rgba(0, 0, 0, 0.195)',
    '0px 11px 46px rgba(0, 0, 0, 0.195)',
    '0px 12px 48px rgba(0, 0, 0, 0.20)',
  ],
  transitions: {
    duration: {
      shortest: 150,
      shorter: 200,
      short: 250,
      standard: 300,
      complex: 375,
      enteringScreen: 225,
      leavingScreen: 195,
    },
    easing: {
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
      easeOut: 'cubic-bezier(0.0, 0, 0.2, 1)',
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
      sharp: 'cubic-bezier(0.4, 0, 0.6, 1)',
    },
  },
  components: {
    MuiUseMediaQuery: {
      defaultProps: {
        noSsr: true,
      },
    },
    // Button компонент
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8, // radius.md
          textTransform: 'none', // Не используем uppercase
          fontWeight: 500,
          padding: '8px 16px',
          transition: 'box-shadow 150ms ease, transform 150ms ease',
          '&:hover': {
            transform: 'translateY(-1px)',
          },
          '&:active': {
            transform: 'translateY(0)',
          },
        },
        sizeSmall: {
          borderRadius: 6,
          padding: '6px 12px',
        },
        sizeLarge: {
          borderRadius: 10,
          padding: '10px 20px',
        },
      },
    },
    // IconButton компонент
    MuiIconButton: {
      styleOverrides: {
        root: {
          borderRadius: '50%', // Круглые
          transition: 'background-color 150ms ease, transform 150ms ease',
          '&:hover': {
            transform: 'scale(1.05)',
          },
        },
      },
    },
    // Card компонент
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12, // radius.lg
          boxShadow: '0px 1px 4px rgba(0, 0, 0, 0.08)', // elevation 2
          transition: 'box-shadow 200ms ease',
          '&:hover': {
            boxShadow: '0px 3px 12px rgba(0, 0, 0, 0.12)', // elevation 6 для интерактивных карточек
          },
        },
      },
    },
    // Input компоненты
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 8, // radius.md
          transition: 'border-color 200ms ease, box-shadow 200ms ease',
        },
        input: {
          '&:-webkit-autofill': {
            backgroundClip: 'text',
          },
        },
      },
    },
    MuiInputBase: {
      styleOverrides: {
        root: {
          borderRadius: 8, // radius.md
        },
        input: {
          '&:-webkit-autofill': {
            transitionDelay: '9999s',
            transitionProperty: 'background-color, color',
          },
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        variant: 'outlined',
      },
    },
    // Modal/Dialog компоненты
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 16, // radius.xl
          boxShadow: '0px 6px 24px rgba(0, 0, 0, 0.16)', // elevation 12
        },
      },
    },
    MuiModal: {
      styleOverrides: {
        root: {
          '& .MuiBackdrop-root': {
            transition: 'opacity 300ms ease-out',
          },
        },
      },
    },
    // Badge компонент
    MuiBadge: {
      styleOverrides: {
        badge: {
          borderRadius: 16, // radius.xl (soft pill)
        },
      },
    },
    // Chip компонент
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8, // radius.md (или 16 для pill style)
          fontWeight: 500,
        },
        deletable: {
          '&:hover': {
            backgroundColor: 'action.hover',
          },
        },
      },
    },
    // Table компоненты
    MuiTableContainer: {
      styleOverrides: {
        root: {
          borderRadius: 12, // radius.lg
          boxShadow: '0px 1px 4px rgba(0, 0, 0, 0.08)', // elevation 2
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:hover': {
            backgroundColor: 'action.hover',
          },
          '&.Mui-selected': {
            backgroundColor: 'action.selected',
            '&:hover': {
              backgroundColor: 'action.selected',
            },
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: '1px solid',
          borderColor: 'divider',
          padding: '16px',
        },
        head: {
          fontWeight: 600,
        },
      },
    },
    // Tooltip компонент
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          borderRadius: 6, // radius.sm
          boxShadow: '0px 4px 16px rgba(0, 0, 0, 0.14)', // elevation 8
          fontSize: '0.75rem',
          padding: '6px 12px',
        },
        arrow: {
          color: 'rgba(0, 0, 0, 0.87)',
        },
      },
    },
    // Popover компонент
    MuiPopover: {
      styleOverrides: {
        paper: {
          borderRadius: 8, // radius.md
          boxShadow: '0px 4px 16px rgba(0, 0, 0, 0.14)', // elevation 8
        },
      },
    },
    // Menu компонент
    MuiMenu: {
      styleOverrides: {
        paper: {
          borderRadius: 8, // radius.md
          boxShadow: '0px 4px 16px rgba(0, 0, 0, 0.14)', // elevation 8
        },
      },
    },
    // Paper компонент (базовый)
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 8, // radius.md по умолчанию
        },
        elevation1: {
          boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.05)', // elevation 1
        },
        elevation2: {
          boxShadow: '0px 1px 4px rgba(0, 0, 0, 0.08)', // elevation 2
        },
        elevation4: {
          boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.10)', // elevation 4
        },
        elevation6: {
          boxShadow: '0px 3px 12px rgba(0, 0, 0, 0.12)', // elevation 6
        },
        elevation8: {
          boxShadow: '0px 4px 16px rgba(0, 0, 0, 0.14)', // elevation 8
        },
        elevation12: {
          boxShadow: '0px 6px 24px rgba(0, 0, 0, 0.16)', // elevation 12
        },
        elevation16: {
          boxShadow: '0px 8px 32px rgba(0, 0, 0, 0.18)', // elevation 16
        },
        elevation24: {
          boxShadow: '0px 12px 48px rgba(0, 0, 0, 0.20)', // elevation 24
        },
      },
    },
    // Alert компонент
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 8, // radius.md
          boxShadow: '0px 1px 4px rgba(0, 0, 0, 0.08)', // elevation 2
        },
      },
    },
    // Snackbar компонент
    MuiSnackbar: {
      styleOverrides: {
        root: {
          '& .MuiSnackbarContent-root': {
            borderRadius: 8, // radius.md
            boxShadow: '0px 3px 12px rgba(0, 0, 0, 0.12)', // elevation 6
          },
        },
      },
    },
    // AppBar компонент
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: '0px 1px 4px rgba(0, 0, 0, 0.08)', // elevation 2
        },
      },
    },
    // Drawer компонент
    MuiDrawer: {
      styleOverrides: {
        paper: {
          transition: 'transform 225ms ease-out',
        },
      },
    },
  },
};
