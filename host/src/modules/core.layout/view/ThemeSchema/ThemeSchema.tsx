import { type FC, type ReactNode } from 'react';
import { Observer } from 'mobx-react-lite';
import { themeDark, themeLight, ThemeProvider, useVM } from '@platform/ui';
import type { UiSettingsViewModel } from '../../../core/viewmodels/uiSettings.vm';
import { IOC_CORE_TOKENS } from '@platform/core';

interface IProps {
  children?: ReactNode;
}

/**
 * Компонент для подключения темы приложения.
 */
const ThemeSchema: FC<IProps> = ({ children }) => {
  const ui = useVM<UiSettingsViewModel>(IOC_CORE_TOKENS.VIEW_MODEL_UI_SETTINGS);
  return (
    <Observer>
      {() => (
        <ThemeProvider theme={ui.themeMode === 'dark' ? themeDark : themeLight}>
          {children}
        </ThemeProvider>
      )}
    </Observer>
  );
};

export default ThemeSchema;
