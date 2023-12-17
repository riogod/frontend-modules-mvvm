/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
// import type { InlineConfig } from 'vitest';
// import type { UserConfig } from 'vite';
import type { UserConfig as VitestUserConfig } from 'vitest/config';

// interface VitestConfigExport extends UserConfig {
//   test: InlineConfig;
// }

declare module 'vite' {
  export interface UserConfig {
    test: VitestUserConfig['test'];
  }
}
export default defineConfig({
  plugins: [nxViteTsPaths(), react(), svgr()],
  build: {
    emptyOutDir: true,
    // modulePreload: false,
    target: 'esnext',
    // minify: false,
    // cssCodeSplit: false,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom'],
          mui: [
            '@mui/material',
            '@mui/icons-material',
            '@emotion/react',
            '@emotion/styled',
          ],
          i18next: ['i18next', 'i18next-browser-languagedetector'],
          inversify: ['inversify', 'inversify-binding-decorators'],
          mobx: ['mobx', 'mobx-react-lite'],
        },
      },
    },
  },
  test: {
    globals: true,
    cache: {
      dir: '../node_modules/.vitest',
    },
    reporters: ['default'],
    coverage: {
      reportsDirectory: '../coverage/<project-root>',
      provider: 'v8',
    },
    environment: 'jsdom',
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    setupFiles: ['./vitest.setup.ts'],
  },
});
