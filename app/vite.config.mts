/// <reference types='vitest' />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";
import tsconfigPaths from "vite-tsconfig-paths";
import type { InlineConfig } from "vitest/node";
import type { UserConfig } from "vite";
import * as path from "path";
import { visualizer } from "rollup-plugin-visualizer";

type ViteConfig = UserConfig & { test: InlineConfig };

export default defineConfig(({ mode }) => {
  const config: ViteConfig = {
    root: __dirname,
    cacheDir: "../../node_modules/.vite/app",

    server: {
      port: 4200,
      host: "localhost"
    },

    preview: {
      port: 4300,
      host: "localhost"
    },

    plugins: [react(), tsconfigPaths(), svgr()],

    optimizeDeps: {
      // Включаем оптимизацию для локальных библиотек
      include: ['@todo/ui', '@todo/core']
    },

    build: {
      outDir: "../dist/app",
      reportCompressedSize: true,
      target: "esnext",
      chunkSizeWarningLimit: 1000,
      modulePreload: false,
      cssCodeSplit: false,
      minify: "esbuild",
      emptyOutDir: true,
      sourcemap: true,
      commonjsOptions: {
        transformMixedEsModules: true
      },
      rollupOptions: {
        plugins: [
          // Визуализация бандла только в режиме analyze
          ...(mode === "analyze"
            ? [
              visualizer({
                open: false,
                filename: path.resolve(process.cwd(), "dist/app/stats.html"),
                gzipSize: true,
                brotliSize: true,
                template: "treemap", // или "sunburst", "network"
              }),
            ]
            : []),
        ],
        output: {
          // Использовать именованные экспорты для лучшего tree shaking
          exports: "named",
          // Оптимизация для tree shaking
          generatedCode: {
            constBindings: true
          },
          manualChunks: (id) => {
            // Разделение vendor библиотек
            if (id.includes('node_modules')) {
              // Router библиотеки
              if (id.includes('@riogz/router') || id.includes('@riogz/react-router')) {
                return 'vendor-router';
              }
              // UI библиотеки (MUI и emotion)
              if (id.includes('@mui/') || id.includes('@emotion/')) {
                return 'vendor-ui';

              }
              // Утилиты
              if (id.includes('axios') || id.includes('zod') || id.includes('@fingerprintjs')) {
                return 'vendor-utils';
              }
              // i18next
              if (id.includes('i18next') || id.includes('react-i18next')) {
                return 'i18next';
              }
              // inversify
              if (id.includes('inversify') || id.includes('@inversifyjs')) {
                return 'inversify';
              }
              // mobx
              if (id.includes('mobx')) {
                return 'mobx';
              }
              // Остальные node_modules (включая react и react-dom) в общий vendor
              return 'vendor';
            }

            // Разделение модулей на отдельные chunks для LAZY модулей
            if (id.includes('/modules/')) {
              // Извлекаем имя модуля из пути
              const moduleMatch = id.match(/\/modules\/([^/]+)\//);
              if (moduleMatch) {
                const moduleName = moduleMatch[1];
                // Создаем отдельный chunk для каждого LAZY модуля
                if (moduleName === 'todo' || moduleName === 'api_example') {
                  return `module-${moduleName}`;
                }
                // INIT модули (core) остаются в основном бандле
                if (moduleName === 'core') {
                  return undefined; // Включаем в основной бандл
                }
              }
            }

            return undefined;
          }
        }
      }
    },

    test: {
      globals: true,
      environment: "jsdom",
      include: ["src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
      setupFiles: ["./vitest.setup.mts"],
      reporters: ["default"],
      coverage: {
        reportsDirectory: "../../coverage/app",
        provider: "v8"
      }
    }
  };

  return config;
});

