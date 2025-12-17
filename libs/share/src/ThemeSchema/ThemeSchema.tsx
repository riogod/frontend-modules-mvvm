import { type FC, type ReactNode } from 'react';
import { Observer } from 'mobx-react-lite';
import {
  themeDark,
  themeLight,
  ThemeProvider,
  useVM,
  CssVariablesSync,
} from '@platform/ui';
import { IOC_CORE_TOKENS } from '@platform/core';
import type { UiSettingsViewModel } from '@host/modules/core/viewmodels/uiSettings.vm';

interface IProps {
  children?: ReactNode;
}

/**
 * Компонент для подключения темы приложения.
 * Синхронизирует CSS переменные с темой MUI для использования в CSS Modules.
 */
const ThemeSchema: FC<IProps> = ({ children }) => {
  const ui = useVM<UiSettingsViewModel>(IOC_CORE_TOKENS.VIEW_MODEL_UI_SETTINGS);
  return (
    <Observer>
      {() => (
        <ThemeProvider theme={ui.themeMode === 'dark' ? themeDark : themeLight}>
          <CssVariablesSync />
          {children}
        </ThemeProvider>
      )}
    </Observer>
  );
};

export default ThemeSchema;
