/// <reference types='vitest' />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";
import { nxViteTsPaths } from "@nx/vite/plugins/nx-tsconfig-paths.plugin";
import type { InlineConfig } from "vitest";
import type { UserConfig } from "vite";

type ViteConfig = UserConfig & { test: InlineConfig };
const config: ViteConfig = {
  root: __dirname,
  cacheDir: "../../node_modules/.vite/app",

  server: {
    port: 4200,
    host: "localhost"
  },

  preview: {
    port: 4300,
    host: "localhost"
  },

  plugins: [react(), nxViteTsPaths(), svgr()],

  build: {
    outDir: "../../dist/app",
    reportCompressedSize: true,
    target: "esnext",
    modulePreload: false,
    cssCodeSplit: false,
    minify: true,
    emptyOutDir: true,
    commonjsOptions: {
      transformMixedEsModules: true
    },
    rollupOptions: {
      output: {
        manualChunks: {
          react: ["react", "react-dom"],
          mui: [
            "@mui/material",
            "@mui/icons-material",
            "@emotion/react",
            "@emotion/styled"
          ],
          i18next: ["i18next", "i18next-browser-languagedetector"],
          inversify: ["inversify", "inversify-binding-decorators"],
          mobx: ["mobx", "mobx-react-lite"],
          "lib-core": ["@todo/core"],
          "lib-ui": ["@todo/ui"]
        }
      }
    }
  },

  test: {
    globals: true,
    environment: "jsdom",
    include: ["src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    setupFiles: ["./vitest.setup.mts"],
    reporters: ["default"],
    coverage: {
      reportsDirectory: "../../coverage/app",
      provider: "v8"
    }
  }
};

export default defineConfig(config);
