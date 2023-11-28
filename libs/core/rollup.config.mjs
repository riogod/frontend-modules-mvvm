// @ts-check

import { readFile } from 'node:fs/promises';

import typescript2 from 'rollup-plugin-typescript2';
import cleaner from 'rollup-plugin-cleaner';
import resolve from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';

const packageJSON = JSON.parse(await readFile('./package.json', 'utf-8'));

/**
 * Comment with library information to be appended in the generated bundles.
 */
const banner = `/*!
 * ${packageJSON.name} v${packageJSON.version}
 * Released under the ${packageJSON.license} License.
 */
`;

/**
 * Creates an output options object for Rollup.js.
 * @param {import('rollup').OutputOptions} options
 * @returns {import('rollup').OutputOptions}
 */
function createOutputOptions(options) {
  return {
    banner,
    name: '@riogz/core',
    exports: 'named',
    sourcemap: true,
    plugins: [terser()],
    ...options,
  };
}

/**
 * @type {import('rollup').RollupOptions}
 */
const options = {
  input: './src/index.ts',
  external: ['router5', 'router5-plugin-browser'],
  output: [
    createOutputOptions({
      file: './dist/index.js',
      format: 'commonjs',
    }),
    createOutputOptions({
      file: './dist/index.esm.js',
      format: 'esm',
    }),
  ],
  plugins: [
    cleaner({
      targets: ['./dist', './types'],
    }),
    resolve({ browser: true }),
    typescript2({
      clean: true,
      useTsconfigDeclarationDir: true,
      tsconfig: './tsconfig.bundle.json',
    }),
  ],
};

export default options;
