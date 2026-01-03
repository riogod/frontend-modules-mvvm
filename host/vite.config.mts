/// <reference types='vitest' />
import { defineConfig } from 'vite';
import {
  createViteConfig,
  createModuleAliasesPlugin,
  loadManifest,
} from '@platform/vite-config';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Загружаем манифест (с fallback)
const manifest = loadManifest({
  dirname: __dirname,
  manifestPath: '../.launcher/current-manifest.json',
  packagesDir: '../packages',
  createFallback: true,
});

// Получаем appStartEndpoint из configs.json или используем значение по умолчанию
function getAppStartEndpoint(): string {
  const configsPath = path.resolve(__dirname, '../.launcher/configs.json');
  try {
    if (fs.existsSync(configsPath)) {
      const configsContent = fs.readFileSync(configsPath, 'utf-8');
      const configs = JSON.parse(configsContent);
      return configs.appStartEndpoint || '/app/start';
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.warn(
      '[vite.config] Failed to load appStartEndpoint from configs.json:',
      errorMessage,
    );
  }
  return '/app/start';
}

const appStartEndpoint = getAppStartEndpoint();

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
      // Примечание: middleware отключен, так как теперь используется dev-server
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
      proxy: {
        // Проксируем эндпоинт стартового манифеста отдельно, так как он может обогащаться в dev режиме через dev-server
        // Используем настраиваемый эндпоинт из глобальных настроек (по умолчанию /app/start)
        [appStartEndpoint]: {
          target: 'http://localhost:1337',
          changeOrigin: true,
          secure: false,
        },
        // Проксируем все остальные запросы с префиксом /dev-api/ на dev-server (порт 1337)
        // Dev-server определяет модуль по пути и решает:
        // - использовать MSW моки (если useLocalMocks: true для модуля)
        // - проксировать на реальный API (если useLocalMocks: false для модуля)
        '/dev-api': {
          target: 'http://localhost:1337',
          changeOrigin: true,
          secure: false,
          // Убираем префикс /dev-api/ перед отправкой на dev-server
          // Dev-server ожидает оригинальные пути (например, /jokes/...)
          rewrite: (path) => path.replace(/^\/dev-api/, ''),
        },
      },
    },
  }),
);
