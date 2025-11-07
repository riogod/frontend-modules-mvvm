import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import * as path from 'path';

export default defineConfig({
  root: __dirname,
  cacheDir: '../../node_modules/.vite/libs/ui',

  plugins: [
    react(),
    tsconfigPaths(),
  ],

  resolve: {
    alias: {
      '@todo/core': path.resolve(__dirname, '../core/src'),
      '@todo/ui': path.resolve(__dirname, './src'),
    },
  },
});

