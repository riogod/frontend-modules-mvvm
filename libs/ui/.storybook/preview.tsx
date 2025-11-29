/* eslint-disable @typescript-eslint/no-unused-vars */
import type { Preview } from '@storybook/react';
import React, { type ReactNode } from 'react';
import { ThemeProvider, CssBaseline, Box } from '@mui/material';
import { themeLight } from '../src/theme/themeLight';
import { themeDark } from '../src/theme/themeDark';

// Компонент-обертка для правильного переключения темы
const ThemeWrapper = ({
  children,
  theme,
}: {
  children: ReactNode;
  theme: 'light' | 'dark';
}) => {
  const muiTheme = theme === 'dark' ? themeDark : themeLight;

  return (
    <ThemeProvider theme={muiTheme}>
      <CssBaseline />
      <Box
        sx={{
          minHeight: '100vh',
          backgroundColor: 'background.default',
        }}
      >
        {children}
      </Box>
    </ThemeProvider>
  );
};

const preview: Preview = {
  parameters: {
    docs: {
      // В Storybook 9 тема документации должна автоматически следовать теме менеджера
      // Если это не работает, возможно требуется обновление Storybook или использование CSS
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
  decorators: [
    (Story, context) => {
      // Определяем тему на основе глобальной темы Storybook
      const storybookTheme =
        (context.globals?.theme as 'light' | 'dark') || 'light';

      return (
        <ThemeWrapper key={`theme-${storybookTheme}`} theme={storybookTheme}>
          <Story />
        </ThemeWrapper>
      );
    },
  ],
  globalTypes: {
    theme: {
      description: 'Global theme for components',
      defaultValue: 'light',
      toolbar: {
        title: 'Theme',
        icon: 'circlehollow',
        items: ['light', 'dark'],
        dynamicTitle: true,
      },
    },
  },
};

export default preview;
