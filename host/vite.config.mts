/// <reference types='vitest' />
import { defineConfig } from 'vite';
import {
  createViteConfig,
  createModuleAliasesPlugin,
  createManifestMiddleware,
  loadManifest,
} from '@platform/vite-config';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Загружаем манифест (с fallback)
const manifest = loadManifest({
  dirname: __dirname,
  manifestPath: '../.launcher/current-manifest.json',
  packagesDir: '../packages',
  createFallback: true,
});

export default defineConfig(
  createViteConfig({
    type: 'host',
    dirname: __dirname,
    // Опционально: путь к локальному конфигу для расширения
    localConfigPath: './vite.config.local.mts',
    plugins: [
      // Плагин для алиасов локальных модулей
      createModuleAliasesPlugin({
        manifest,
        packagesDir: path.resolve(__dirname, '../packages'),
      }),

      // Middleware для /app/start (только в dev)
      createManifestMiddleware({
        manifest,
        defaultUser: {
          permissions: ['api.module.load.permission'],
          featureFlags: ['api.module.load.feature'],
        },
      }),
    ],
  }),
);
