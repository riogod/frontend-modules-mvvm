/// <reference types='vitest' />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";
import tsconfigPaths from "vite-tsconfig-paths";
import type { InlineConfig } from "vitest";
import type { UserConfig } from "vite";

type ViteConfig = UserConfig & { test: InlineConfig };
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

  build: {
    outDir: "../../dist/app",
    reportCompressedSize: true,
    target: "esnext",
    chunkSizeWarningLimit: 1000,
    modulePreload: false,
    cssCodeSplit: false,
    minify: true,
    emptyOutDir: true,
    commonjsOptions: {
      transformMixedEsModules: true
    },
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Разделение vendor библиотек
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom')) {
              return 'react';
            }
            if (id.includes('i18next') || id.includes('i18next-browser-languagedetector')) {
              return 'i18next';
            }
            if (id.includes('inversify') || id.includes('inversify-binding-decorators')) {
              return 'inversify';
            }
            if (id.includes('mobx') || id.includes('mobx-react-lite')) {
              return 'mobx';
            }
            if (id.includes('@todo/core')) {
              return 'lib-core';
            }
            if (id.includes('@todo/ui')) {
              return 'lib-ui';
            }
            // Остальные node_modules в отдельный chunk
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

export default defineConfig(config);
