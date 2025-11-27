import { createBaseConfig } from './base.config.js';
import react from '@vitejs/plugin-react';
import path from 'path';

export function createLibConfig(options) {
  const {
    dirname,
    libName,
    cacheDir,
    outDir = `../../dist/libs/${libName}`,
    coverageDir = `../../coverage/libs/${libName}`,
    vitestSetupFile = './vitest.setup.mts',
    react: useReact = true,
    dts: useDts = true,
    dtsTsconfigPath,
    lib,
    external = ['react', 'react-dom', 'react/jsx-runtime'],
    build,
    plugins = [],
  } = options;

  let dtsPlugin = null;
  // eslint-disable-next-line no-undef
  const nodeEnv =
    // eslint-disable-next-line no-undef
    typeof process !== 'undefined' ? process.env.NODE_ENV : undefined;
  // eslint-disable-next-line no-undef
  const isVitest =
    // eslint-disable-next-line no-undef
    typeof process !== 'undefined' ? process.env.VITEST : undefined;
  if (useDts && nodeEnv !== 'test' && !isVitest) {
    try {
      // eslint-disable-next-line no-undef
      const dts = require('vite-plugin-dts');
      dtsPlugin = dts.default({
        entryRoot: 'src',
        tsconfigPath:
          dtsTsconfigPath || path.join(dirname, 'tsconfig.lib.json'),
      });
    } catch (e) {
      // ignored
    }
  }

  const basePlugins = [];
  if (useReact) {
    basePlugins.push(react());
  }

  const allPlugins = [...basePlugins, ...plugins];
  if (dtsPlugin) {
    allPlugins.push(dtsPlugin);
  }

  const base = createBaseConfig({
    dirname,
    cacheDir: cacheDir || `../../node_modules/.vite/libs/${libName}`,
    plugins: allPlugins,
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
    build: {
      outDir,
      reportCompressedSize: true,
      target: 'esnext',
      modulePreload: false,
      cssCodeSplit: libName === 'ui',
      minify: libName === 'ui' ? 'esbuild' : true,
      emptyOutDir: true,
      sourcemap: libName === 'ui',
      commonjsOptions: {
        transformMixedEsModules: true,
      },
      lib: lib || {
        entry: 'src/index.ts',
        name: libName,
        fileName:
          libName === 'ui'
            ? (format) => `index.${format === 'es' ? 'mjs' : 'js'}`
            : 'index',
        formats: ['es', 'cjs'],
      },
      rollupOptions: {
        external,
        output:
          libName === 'ui'
            ? {
                sourcemap: true,
                exports: 'named',
                generatedCode: {
                  constBindings: true,
                },
              }
            : undefined,
      },
      ...build,
    },
  };
}
