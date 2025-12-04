/* eslint-env node */
import { createBaseConfig } from './base.config.js';
import react from '@vitejs/plugin-react';
import federation from '@originjs/vite-plugin-federation';
import { loadConfigFromFile } from 'vite';
import path from 'path';
import fs from 'fs';

/**
 * Базовые shared зависимости для всех модулей
 */
const defaultShared = {
  react: { singleton: true, requiredVersion: false },
  'react-dom': { singleton: true, requiredVersion: false },
  mobx: { singleton: true, requiredVersion: false },
  'mobx-react-lite': { singleton: true, requiredVersion: false },
  '@platform/core': { singleton: true, requiredVersion: false },
  '@platform/ui': { singleton: true, requiredVersion: false },
  '@platform/common': { singleton: true, requiredVersion: false },
};

/**
 * Загружает локальную конфигурацию модуля если она существует
 * Использует loadConfigFromFile из Vite для поддержки .mts файлов
 */
async function loadLocalConfig(dirname, localConfigPath) {
  const configPath = path.resolve(
    dirname,
    localConfigPath || './vite.config.local.mts',
  );

  if (!fs.existsSync(configPath)) {
    return {};
  }

  try {
    const loaded = await loadConfigFromFile(
      { command: 'build', mode: process.env.NODE_ENV || 'production' },
      configPath,
    );

    if (loaded && loaded.config) {
      return loaded.config.default || loaded.config;
    }
    return {};
  } catch (error) {
    // В dev режиме это не критично - просто используем значения по умолчанию
    if (process.env.NODE_ENV !== 'production') {
      console.log(
        `[vite-config] Локальная конфигурация не найдена для ${path.basename(dirname)}, используются значения по умолчанию`,
      );
    } else {
      console.warn(
        `[vite-config] Не удалось загрузить локальную конфигурацию из ${configPath}:`,
        error.message,
      );
    }
    return {};
  }
}

/**
 * Конфигурация для MFE модулей
 * Включает Module Federation с shared dependencies и поддержку локальных настроек
 */
export async function createModuleConfig(options) {
  const {
    dirname,
    moduleName,
    localConfigPath = './vite.config.local.mts',
    exposes: defaultExposes = {},
    shared: additionalShared = {},
    cacheDir,
    outDir = `../../dist/modules/${moduleName}/latest`,
    server = {
      port: 4201,
      host: 'localhost',
    },
    preview = {
      port: 4301,
      host: 'localhost',
    },
    build,
    plugins = [],
  } = options;

  // Загружаем локальную конфигурацию
  const localConfig = await loadLocalConfig(dirname, localConfigPath);

  // Объединяем exposes: базовые + из локального конфига
  const finalExposes = {
    './Config': './src/config/module_config.ts',
    ...defaultExposes,
    ...(localConfig.exposes || {}),
  };

  // Объединяем shared: базовые + дополнительные + из локального конфига
  const finalShared = {
    ...defaultShared,
    ...additionalShared,
    ...(localConfig.shared || {}),
  };

  // Определяем имя модуля для Federation
  const federationName = localConfig.name || moduleName;

  // Базовые плагины
  const basePlugins = [react()];

  // Добавляем Federation плагин только в production режиме
  // В dev режиме модули загружаются через Vite алиасы
  const nodeEnv = process.env.NODE_ENV || 'development';
  const isProduction = nodeEnv === 'production';

  if (isProduction) {
    basePlugins.push(
      federation({
        name: federationName,
        filename: 'remoteEntry.js',
        exposes: finalExposes,
        shared: finalShared,
        remotes: localConfig.remotes || {},
      }),
    );
  }

  const allPlugins = [...basePlugins, ...plugins];

  // Настраиваем resolve для workspace пакетов
  const resolveAliases = {};
  const libsDir = path.resolve(dirname, '../../libs');

  // Добавляем алиасы для библиотек
  if (fs.existsSync(libsDir)) {
    const libs = fs.readdirSync(libsDir, { withFileTypes: true });
    libs.forEach((lib) => {
      if (lib.isDirectory()) {
        const libPackageJson = path.join(libsDir, lib.name, 'package.json');
        if (fs.existsSync(libPackageJson)) {
          try {
            const pkg = JSON.parse(fs.readFileSync(libPackageJson, 'utf-8'));
            const aliasName = pkg.name || `@platform/${lib.name}`;
            resolveAliases[aliasName] = path.resolve(libsDir, lib.name, 'src');
          } catch (e) {
            // игнорируем ошибки
          }
        }
      }
    });
  }

  const base = createBaseConfig({
    dirname,
    cacheDir: cacheDir || `../../node_modules/.vite/packages/${moduleName}`,
    plugins: allPlugins,
    resolve: {
      alias: resolveAliases,
    },
  });

  return {
    ...base,
    server,
    preview,
    base: localConfig.base || (isProduction ? `/modules/${moduleName}/` : '/'),
    build: {
      outDir,
      target: 'esnext',
      minify: isProduction ? 'esbuild' : false,
      cssCodeSplit: true,
      sourcemap: !isProduction,
      emptyOutDir: true,
      rollupOptions: {
        // Для Module Federation используем module_config как входную точку
        // Это нужно только для сборки, реальный экспорт через federation exposes
        input: path.resolve(dirname, 'src/config/module_config.ts'),
        output: {
          format: 'esm',
          exports: 'named',
          generatedCode: {
            constBindings: true,
          },
          // Все файлы в корень модуля, не в assets/
          entryFileNames: '[name].js',
          chunkFileNames: '[name]-[hash].js',
          assetFileNames: '[name]-[hash][extname]',
        },
      },
      ...build,
    },
  };
}
