/// <reference types='vitest' />
import { defineConfig } from 'vite';
import {
  createViteConfig,
  createModuleAliasesPlugin,
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
      // Примечание: middleware отключен, так как теперь используется proxy-server
      // createManifestMiddleware({
      //   manifest,
      //   defaultUser: {
      //     permissions: ['api.module.load.permission'],
      //     featureFlags: ['api.module.load.feature'],
      //   },
      // }),
    ],
    server: {
      port: 4200,
      host: 'localhost',
      // Проксируем все API запросы на proxy-server (порт 1337)
      // Proxy-server обрабатывает запросы через MSW или проксирует на реальный сервер
      proxy: {
        // Проксируем /app/start на proxy-server
        '/app/start': {
          target: 'http://localhost:1337',
          changeOrigin: true,
          secure: false,
        },
        // Проксируем все остальные API запросы
        // Добавляем пути по мере необходимости или используем общий паттерн
        '/jokes': {
          target: 'http://localhost:1337',
          changeOrigin: true,
          secure: false,
        },
        // Можно добавить другие API пути здесь
        // Или использовать более общий паттерн для всех API запросов
      },
    },
  }),
);
