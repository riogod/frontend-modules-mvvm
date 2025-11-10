import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

