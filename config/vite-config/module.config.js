/* eslint-env node */
import { createBaseConfig } from './base.config.js';
import react from '@vitejs/plugin-react';
import federation from '@originjs/vite-plugin-federation';
import { loadConfigFromFile } from 'vite';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { removeDevFieldsPlugin } from './plugins/removeDevFields.js';

/**
 * Базовые shared зависимости для всех модулей
 * Должны совпадать с shared в host.config.js
 * Модули используют shared из host если доступно, иначе fallback на свою копию
 */
const defaultShared = {
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
  // Внутренние библиотеки - резолвятся через алиасы
  '@platform/core': { singleton: true, requiredVersion: false, eager: true },
  '@platform/ui': { singleton: true, requiredVersion: false, eager: true },
  '@platform/common': { singleton: true, requiredVersion: false, eager: true },
  '@platform/share': { singleton: true, requiredVersion: false, eager: true },
  '@emotion/react': {
    singleton: true,
    requiredVersion: false,
    eager: true,
  },
  '@emotion/styled': {
    singleton: true,
    requiredVersion: false,
    eager: true,
  },
  '@mui/material': {
    singleton: true,
    requiredVersion: false,
    eager: true,
  },
  '@mui/icons-material': {
    singleton: true,
    requiredVersion: false,
    eager: true,
  },
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
  // Имя должно соответствовать формату, который ожидает RemoteModuleLoader:
  // createScopeName(name) создает `module_${name.replace(/-/g, '_')}`
  // Vite Federation плагин (@originjs/vite-plugin-federation) добавляет префикс 'module_' к имени
  // Поэтому передаем просто moduleName (например, 'todo'), и плагин создаст контейнер 'module_todo'
  const federationName = moduleName;

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
        // Настройки для правильной генерации путей
        // Vite Federation по умолчанию добавляет /assets/ в пути
        // Но мы выводим файлы в корень модуля
      }),
    );
    // Добавляем плагин для удаления dev-полей только в production
    basePlugins.push(removeDevFieldsPlugin());
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

  // Нормализуем имя модуля для использования в CSS Modules
  const modulePart = moduleName.replace(/-/g, '_');

  return {
    ...base,
    server,
    preview,
    base: './',
    css: {
      modules: {
        // Генерация уникальных имен классов с префиксом модуля
        // Это обеспечивает изоляцию стилей между разными модулями
        generateScopedName: (name, filename) => {
          // В production используем короткий хеш для минимизации размера
          if (isProduction) {
            const hash = crypto
              .createHash('md5')
              .update(filename + name)
              .digest('base64')
              .substring(0, 5)
              .replace(/[+/=]/g, '_');
            return `${modulePart}_${name}_${hash}`;
          }
          // В dev используем читаемое имя для отладки
          return `${modulePart}__${name}`;
        },
        // Преобразование kebab-case в camelCase для удобства использования
        // Например: .my-class -> styles.myClass
        localsConvention: 'camelCase',
      },
    },
    build: {
      outDir,
      target: 'esnext',
      minify: isProduction ? 'esbuild' : false,
      cssCodeSplit: true,
      sourcemap: !isProduction,
      emptyOutDir: true,
      rollupOptions: {
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
