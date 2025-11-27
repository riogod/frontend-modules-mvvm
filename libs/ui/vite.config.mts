/// <reference types='vitest' />
import { defineConfig } from 'vite';
import { createViteConfig } from '@platform/vite-config';

export default defineConfig(
  createViteConfig({
    type: 'lib',
    dirname: __dirname,
    libName: 'ui',
    external: [
      'react',
      'react-dom',
      'react/jsx-runtime',
      '@emotion/react',
      '@emotion/styled',
      '@mui/material',
      '@mui/icons-material',
      'inversify',
    ],
    // Опционально: путь к локальному конфигу для расширения
    localConfigPath: './vite.config.local.mts',
  }),
);
