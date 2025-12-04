/* eslint-env node */
import { createBaseConfig } from './base.config.js';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';
import federation from '@originjs/vite-plugin-federation';
import path from 'path';
import fs from 'fs';
import process from 'node:process';

/**
 * Shared зависимости для Module Federation
 * Должны совпадать с shared в module.config.js
 * eager: true - загружать немедленно, чтобы share scope был готов до загрузки remote модулей
 */
const federationShared = {
  react: { singleton: true, requiredVersion: false, eager: true },
  'react-dom': { singleton: true, requiredVersion: false, eager: true },
  mobx: { singleton: true, requiredVersion: false, eager: true },
  'mobx-react-lite': { singleton: true, requiredVersion: false, eager: true },
  i18next: { singleton: true, requiredVersion: false, eager: true },
  'react-i18next': { singleton: true, requiredVersion: false, eager: true },
  inversify: { singleton: true, requiredVersion: false, eager: true },
  'reflect-metadata': { singleton: true, requiredVersion: false, eager: true },
  '@riogz/react-router': {
    singleton: true,
    requiredVersion: false,
    eager: true,
  },
  '@riogz/router': { singleton: true, requiredVersion: false, eager: true },
  '@riogz/router-plugin-browser': {
    singleton: true,
    requiredVersion: false,
    eager: true,
  },
  // Внутренние библиотеки - eager для @platform/ui, т.к. он содержит DIContext,
  // который должен быть доступен для remote модулей
  '@platform/core': { singleton: true, requiredVersion: false, eager: true },
  '@platform/ui': { singleton: true, requiredVersion: false, eager: true },
  '@platform/common': { singleton: true, requiredVersion: false, eager: true },
  '@platform/share': { singleton: true, requiredVersion: false, eager: true },
};

/**
 * Плагин для очистки dist с сохранением папки modules
 * Используется вместо emptyOutDir: true, чтобы не удалять собранные модули
 */
function cleanDistPreserveModulesPlugin(outDir) {
  const resolvedOutDir = path.resolve(outDir);

  return {
    name: 'clean-dist-preserve-modules',
    buildStart() {
      // Очищаем dist, но сохраняем папку modules
      if (fs.existsSync(resolvedOutDir)) {
        const entries = fs.readdirSync(resolvedOutDir, { withFileTypes: true });

        for (const entry of entries) {
          const entryPath = path.join(resolvedOutDir, entry.name);

          // Пропускаем папку modules
          if (entry.name === 'modules') {
            continue;
          }

          // Удаляем всё остальное
          try {
            if (entry.isDirectory()) {
              fs.rmSync(entryPath, { recursive: true });
            } else {
              fs.unlinkSync(entryPath);
            }
          } catch (error) {
            // Игнорируем ошибки (файл может быть заблокирован)
            // eslint-disable-next-line no-console
            console.warn(
              `[clean-dist-preserve-modules] Failed to remove ${entryPath}:`,
              error.message,
            );
          }
        }
      }
    },
  };
}

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
    outDir = '../dist',
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

  // Плагин для очистки dist с сохранением папки modules
  const resolvedOutDir = path.resolve(dirname, outDir);
  const cleanDistPlugin = cleanDistPreserveModulesPlugin(resolvedOutDir);

  // Federation плагин для host - экспортирует shared зависимости для remote модулей
  const federationPlugin = federation({
    name: 'host',
    // Host не expose ничего, только предоставляет shared
    exposes: {},
    // Remote модули загружаются динамически через RemoteModuleLoader
    remotes: {},
    // Shared зависимости - remote модули будут использовать их из host
    shared: federationShared,
  });

  const base = createBaseConfig({
    dirname,
    cacheDir: cacheDir || `../../node_modules/.vite/host`,
    plugins: [react(), svgr(), cleanDistPlugin, federationPlugin, ...plugins],
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
      // Исключаем локальные библиотеки из pre-bundling в dev режиме
      // В production они будут собраны в отдельные чанки через manualChunks
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
      emptyOutDir: false, // Используем кастомный плагин для очистки с сохранением modules
      sourcemap: true,
      commonjsOptions: {
        transformMixedEsModules: true,
      },
      rollupOptions: {
        plugins: [],
        // Remote модули загружаются динамически через RemoteModuleLoader,
        // поэтому external не нужен - они не импортируются напрямую в хосте
        output: {
          // Использовать именованные экспорты для лучшего tree shaking
          exports: 'named',
          // Оптимизация для tree shaking
          generatedCode: {
            constBindings: true,
          },
          // manualChunks: (id) => {
          //   // Разделение локальных библиотек из libs/ на отдельные чанки
          //   // Это важно для микрофронтендов - каждая библиотека будет в отдельном чанке,
          //   // который можно переиспользовать в разных микрофронтендах
          //   // if (id.includes('/libs/')) {
          //   //   // Извлекаем имя библиотеки из пути
          //   //   const libMatch = id.match(/\/libs\/([^/]+)\//);
          //   //   if (libMatch) {
          //   //     const libName = libMatch[1];
          //   //     // Создаем чанк с префиксом lib- для удобства идентификации
          //   //     // Формат: lib-core.js, lib-ui.js, lib-common.js, lib-share.js
          //   //     return `lib-${libName}`;
          //   //   }
          //   // }

          //   // Разделение vendor библиотек
          //   if (id.includes('node_modules')) {
          //     // Router библиотеки
          //     if (
          //       id.includes('@riogz/router') ||
          //       id.includes('@riogz/react-router')
          //     ) {
          //       return 'vendor-router';
          //     }
          //     // UI библиотеки (MUI и emotion)
          //     // if (id.includes('@mui/') || id.includes('@emotion/')) {
          //     //   return 'vendor-ui';
          //     // }
          //     // // Утилиты
          //     // if (
          //     //   id.includes('axios') ||
          //     //   id.includes('zod') ||
          //     //   id.includes('@fingerprintjs')
          //     // ) {
          //     //   return 'vendor-utils';
          //     // }
          //     // // i18next
          //     // if (id.includes('i18next') || id.includes('react-i18next')) {
          //     //   return 'i18next';
          //     // }
          //     // inversify
          //     // if (id.includes('inversify') || id.includes('@inversifyjs')) {
          //     //   return 'inversify';
          //     // }
          //     // mobx
          //     // if (id.includes('mobx')) {
          //     //   return 'mobx';
          //     // }
          //     // Остальные node_modules (включая react и react-dom) в общий vendor
          //     return 'vendor';
          //   }

          //   // Разделение локальных модулей из host/src/modules/ на отдельные chunks
          //   // Remote модули (todo, api_example) не должны попадать в билд хоста
          //   // if (id.includes('/host/src/modules/')) {
          //   //   // Извлекаем имя модуля из пути
          //   //   const moduleMatch = id.match(/\/host\/src\/modules\/([^/]+)\//);
          //   //   if (moduleMatch) {
          //   //     const moduleName = moduleMatch[1];
          //   //     // INIT модули (core, core.layout) остаются в основном бандле
          //   //     if (moduleName === 'core' || moduleName === 'core.layout') {
          //   //       return undefined; // Включаем в основной бандл
          //   //     }
          //   //     // Локальные NORMAL модули (local-normal и т.д.) в отдельные чанки
          //   //     return `module-${moduleName}`;
          //   //   }
          //   // }

          //   // Исключаем remote модули из packages/ из билда хоста
          //   // Они должны загружаться через Module Federation
          //   if (id.includes('/packages/')) {
          //     const packageMatch = id.match(/\/packages\/([^/]+)\//);
          //     if (packageMatch) {
          //       const packageName = packageMatch[1];
          //       // В production remote модули не должны попадать в билд
          //       if (process.env.NODE_ENV === 'production') {
          //         // Предупреждаем, если remote модуль попал в билд
          //         // eslint-disable-next-line no-console
          //         console.warn(
          //           `[vite-config] Warning: Remote module ${packageName} is being bundled into host build. This should not happen in production.`,
          //         );
          //       }
          //     }
          //   }

          //   return undefined;
          // },
        },
      },
      ...build,
    },
  };
}
