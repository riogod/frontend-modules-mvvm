/// <reference types='vitest' />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import dts from "vite-plugin-dts";
import * as path from "path";
import tsconfigPaths from "vite-tsconfig-paths";

import type { InlineConfig } from "vitest/node";
import type { UserConfig } from "vite";

type ViteConfig = UserConfig & { test: InlineConfig };
const config: ViteConfig = {
  root: __dirname,
  cacheDir: "../../node_modules/.vite/libs/ui",

  plugins: [
    react(),
    tsconfigPaths(),
    dts({
      entryRoot: "src",
      tsconfigPath: path.join(__dirname, "tsconfig.lib.json")
    })
  ],

  // Uncomment this if you are using workers.
  // worker: {
  //  plugins: [ tsconfigPaths() ],
  // },

  // Configuration for building your library.
  // See: https://vitejs.dev/guide/build.html#library-mode
  build: {
    outDir: "../../dist/libs/ui",
    reportCompressedSize: true,
    target: "esnext",
    modulePreload: false,
    cssCodeSplit: true,
    minify: "esbuild",
    emptyOutDir: true,
    sourcemap: true,
    commonjsOptions: {
      transformMixedEsModules: true
    },
    lib: {
      // Could also be a dictionary or array of multiple entry points.
      entry: "src/index.ts",
      name: "TodoUI",
      fileName: (format) => `index.${format === "es" ? "mjs" : "js"}`,
      // Change this to the formats you want to support.
      // Don't forget to update your package.json as well.
      formats: ["es", "cjs"]
    },
    rollupOptions: {
      // External packages that should not be bundled into your library.
      external: [
        "react",
        "react-dom",
        "react/jsx-runtime",
        "@emotion/react",
        "@emotion/styled",
        "@mui/material",
        "@mui/icons-material",
        "inversify"
      ],
      output: {
        // Generate source maps for better debugging
        sourcemap: true,
        // Use named exports for better tree shaking
        exports: "named",
        // Optimize for tree shaking
        generatedCode: {
          constBindings: true
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
      reportsDirectory: "../../coverage/libs/ui",
      provider: "v8"
    }
  }
};

export default defineConfig(config);
