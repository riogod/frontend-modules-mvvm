import { FC, ReactNode } from 'react';
import { Observer } from 'mobx-react-lite';
import { ThemeProvider } from '@mui/material/styles';
import { themeDark } from '../../../../config/themeDark.ts';
import { themeLight } from '../../../../config/themeLight.ts';
import { useVM } from '@todo/ui';
import { UiSettingsViewModel } from '../../viewmodels/uiSettings.vm.ts';

interface IProps {
  children?: ReactNode;
}

/**
 * Компонент для подключения темы приложения.
 */
const ThemeSchema: FC<IProps> = ({ children }) => {
  const ui = useVM<UiSettingsViewModel>(UiSettingsViewModel);
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
