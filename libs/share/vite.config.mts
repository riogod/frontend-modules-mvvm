/// <reference types='vitest' />
import { defineConfig } from 'vite';
import { createViteConfig } from '@platform/vite-config';

export default defineConfig(
  createViteConfig({
    type: 'lib',
    dirname: __dirname,
    libName: 'common',
    // Опционально: путь к локальному конфигу для расширения
    localConfigPath: './vite.config.local.mts',
  }),
);
