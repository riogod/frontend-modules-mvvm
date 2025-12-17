import { useEffect } from 'react';
import { useTheme } from '@mui/material/styles';
import { syncCssVariables } from './syncCssVariables';

/**
 * Компонент для синхронизации CSS переменных с темой MUI
 * Должен быть размещен внутри ThemeProvider
 */
export function CssVariablesSync() {
  const theme = useTheme();

  useEffect(() => {
    syncCssVariables(theme);
  }, [theme]);

  return null;
}
