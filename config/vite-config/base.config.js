import tsconfigPaths from 'vite-tsconfig-paths';

/**
 * Базовый конфиг для всех Vite проектов
 */
export function createBaseConfig(options) {
  const { dirname, cacheDir, plugins = [], resolve, test } = options;

  return {
    root: dirname,
    cacheDir: cacheDir || `../../node_modules/.vite/${dirname.split('/').pop()}`,
    plugins: [tsconfigPaths(), ...plugins],
    resolve,
    test: test || {
      globals: true,
      environment: 'jsdom',
      include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
      reporters: ['default'],
      coverage: {
        provider: 'v8',
      },
    },
  };
}
