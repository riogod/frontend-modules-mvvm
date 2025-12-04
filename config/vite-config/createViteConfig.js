/* eslint-env node */
import { createBaseConfig } from './base.config.js';
import { createHostConfig } from './host.config.js';
import { createLibConfig } from './lib.config.js';
import { createRequire } from 'module';
import path from 'path';
import fs from 'fs';

const require = createRequire(import.meta.url);

function loadLocalConfig(localConfigPath) {
  if (!localConfigPath) {
    return null;
  }

  const resolvedPath = path.resolve(localConfigPath);

  if (!fs.existsSync(resolvedPath)) {
    return null;
  }

  try {
    if (resolvedPath.endsWith('.json')) {
      const content = fs.readFileSync(resolvedPath, 'utf-8');
      return JSON.parse(content);
    }

    delete require.cache[resolvedPath];
    return require(resolvedPath);
  } catch (error) {
    console.warn(`Failed to load local config from ${resolvedPath}:`, error);
    return null;
  }
}

export function createViteConfig(options) {
  const { type, localConfigPath, dirname, ...restOptions } = options;

  const localConfig = loadLocalConfig(localConfigPath);

  const mergedOptions = localConfig
    ? {
        ...restOptions,
        dirname: restOptions.dirname || localConfig.dirname || dirname,
        plugins: [
          ...(restOptions.plugins || []),
          ...(localConfig.plugins || []),
        ],
        resolve: { ...restOptions.resolve, ...localConfig.resolve },
        build: { ...restOptions.build, ...localConfig.build },
        server: { ...restOptions.server, ...localConfig.server },
        preview: { ...restOptions.preview, ...localConfig.preview },
        test: { ...restOptions.test, ...localConfig.test },
        define: { ...restOptions.define, ...localConfig.define },
        react: localConfig.react ?? restOptions.react,
        svgr: localConfig.svgr ?? restOptions.svgr,
        dts: localConfig.dts ?? restOptions.dts,
      }
    : { ...restOptions, dirname };

  let base;

  switch (type) {
    case 'host':
      base = createHostConfig({
        dirname: mergedOptions.dirname,
        cacheDir: mergedOptions.cacheDir,
        outDir: mergedOptions.outDir,
        coverageDir: mergedOptions.coverageDir,
        vitestSetupFile: mergedOptions.vitestSetupFile,
        resolve: mergedOptions.resolve,
        server: mergedOptions.server,
        preview: mergedOptions.preview,
        define: mergedOptions.define,
        build: mergedOptions.build,
        plugins: mergedOptions.plugins,
      });
      break;

    case 'lib':
      base = createLibConfig({
        dirname: mergedOptions.dirname,
        libName:
          options.libName || mergedOptions.dirname.split('/').pop() || 'lib',
        cacheDir: mergedOptions.cacheDir,
        outDir: mergedOptions.outDir,
        coverageDir: mergedOptions.coverageDir,
        vitestSetupFile: mergedOptions.vitestSetupFile,
        react: mergedOptions.react,
        dts: mergedOptions.dts,
        dtsTsconfigPath: mergedOptions.dtsTsconfigPath,
        lib: mergedOptions.lib,
        external: mergedOptions.external,
        build: mergedOptions.build,
        plugins: mergedOptions.plugins,
      });
      break;

    case 'base':
    default:
      base = createBaseConfig({
        dirname: mergedOptions.dirname,
        cacheDir: mergedOptions.cacheDir,
        plugins: mergedOptions.plugins,
        resolve: mergedOptions.resolve,
        test: mergedOptions.test,
      });
      break;
  }

  if (type === 'host') {
    return (env) => {
      const config = { ...base };

      if (env.mode === 'analyze' && config.build?.rollupOptions) {
        const { visualizer } = require('rollup-plugin-visualizer');
        config.build.rollupOptions.plugins = [
          visualizer({
            open: false,
            filename: path.resolve(process.cwd(), 'dist/host/stats.html'),
            gzipSize: true,
            brotliSize: true,
            template: 'treemap',
          }),
        ];
      }

      return config;
    };
  }

  return base;
}
