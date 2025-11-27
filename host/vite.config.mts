/// <reference types='vitest' />
import { defineConfig } from 'vite';
import { createViteConfig } from '@platform/vite-config';

export default defineConfig(
  createViteConfig({
    type: 'host',
    dirname: __dirname,
    // Опционально: путь к локальному конфигу для расширения
    localConfigPath: './vite.config.local.mts',
  }),
);
