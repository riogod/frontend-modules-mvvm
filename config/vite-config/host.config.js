import { createBaseConfig } from './base.config.js';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';
import path from 'path';
import fs from 'fs';
import process from 'node:process';

function collectLibraryAliases(dirname) {
  const aliases = {};
  const libsDir = path.resolve(dirname, '../libs');

  if (!fs.existsSync(libsDir)) {
    return aliases;
  }

  const libraries = fs.readdirSync(libsDir, { withFileTypes: true });

  libraries.forEach((libraryDirent) => {
    if (!libraryDirent.isDirectory()) {
      return;
    }

    const libraryRoot = path.join(libsDir, libraryDirent.name);
    const packageJsonPath = path.join(libraryRoot, 'package.json');
    const srcDir = path.join(libraryRoot, 'src');

    if (!fs.existsSync(packageJsonPath) || !fs.existsSync(srcDir)) {
      return;
    }

    try {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
      const aliasName = packageJson.name || `@platform/${libraryDirent.name}`;
      aliases[aliasName] = path.resolve(
        dirname,
        `../libs/${libraryDirent.name}/src`,
      );
    } catch (error) {
      process.emitWarning(
        `[vite-config] Не удалось прочитать ${packageJsonPath}: ${(error && error.message) || error}`,
      );
    }
  });

  return aliases;
}

/**
 * Конфиг для host приложений
 * Включает React, SVGR, сложную конфигурацию сборки
 */
export function createHostConfig(options) {
  const {
    dirname,
    cacheDir,
    outDir = '../dist/host',
    coverageDir = '../../coverage/host',
    vitestSetupFile = './vitest.setup.mts',
    resolve,
    server = {
      port: 4200,
      host: 'localhost',
    },
    preview = {
      port: 4300,
      host: 'localhost',
    },
    define,
    build,
    plugins = [],
  } = options;

  const libraryAliases = collectLibraryAliases(dirname);
  const finalResolve = resolve
    ? {
        ...resolve,
        alias: {
          ...libraryAliases,
          ...(resolve.alias || {}),
        },
      }
    : { alias: libraryAliases };

  const base = createBaseConfig({
    dirname,
    cacheDir: cacheDir || `../../node_modules/.vite/host`,
    plugins: [react(), svgr(), ...plugins],
    resolve: finalResolve,
    test: {
      globals: true,
      environment: 'jsdom',
      include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
      setupFiles: [vitestSetupFile],
      reporters: ['default'],
      coverage: {
        reportsDirectory: coverageDir,
        provider: 'v8',
      },
    },
  });

  return {
    ...base,
    server,
    preview,
    define: {
      // Делаем переменную окружения LOG_LEVEL доступной в коде
      'import.meta.env.LOG_LEVEL': JSON.stringify(process.env.LOG_LEVEL || ''),
      ...define,
    },
    optimizeDeps: {
      // Исключаем локальные библиотеки из pre-bundling, используем исходники через алиасы
      exclude: Object.keys(libraryAliases),
    },
    build: {
      outDir,
      reportCompressedSize: true,
      target: 'esnext',
      chunkSizeWarningLimit: 1000,
      modulePreload: false,
      cssCodeSplit: false,
      minify: 'esbuild',
      emptyOutDir: true,
      sourcemap: true,
      commonjsOptions: {
        transformMixedEsModules: true,
      },
      rollupOptions: {
        plugins: [],
        output: {
          // Использовать именованные экспорты для лучшего tree shaking
          exports: 'named',
          // Оптимизация для tree shaking
          generatedCode: {
            constBindings: true,
          },
          manualChunks: (id) => {
            // Разделение vendor библиотек
            if (id.includes('node_modules')) {
              // Router библиотеки
              if (
                id.includes('@riogz/router') ||
                id.includes('@riogz/react-router')
              ) {
                return 'vendor-router';
              }
              // UI библиотеки (MUI и emotion)
              if (id.includes('@mui/') || id.includes('@emotion/')) {
                return 'vendor-ui';
              }
              // Утилиты
              if (
                id.includes('axios') ||
                id.includes('zod') ||
                id.includes('@fingerprintjs')
              ) {
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
          },
        },
      },
      ...build,
    },
  };
}
