/// <reference types='vitest' />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import * as path from "path";
import tsconfigPaths from "vite-tsconfig-paths";

import type { InlineConfig } from "vitest";
import type { UserConfig } from "vite";

type ViteConfig = UserConfig & { test: InlineConfig };

// Conditionally import dts plugin only when building, not when running tests
let dtsPlugin: any = null;
if (process.env.NODE_ENV !== "test" && !process.env.VITEST) {
  try {
    const dts = require("vite-plugin-dts");
    dtsPlugin = dts.default({
      entryRoot: "src",
      tsconfigPath: path.join(__dirname, "tsconfig.lib.json")
    });
  } catch (e) {
    // Ignore if dts plugin can't be loaded
  }
}

const plugins: any[] = [
  react(),
  tsconfigPaths(),
];

if (dtsPlugin) {
  plugins.push(dtsPlugin);
}

const config: ViteConfig = {
  root: __dirname,
  cacheDir: "../../node_modules/.vite/libs/common",

  plugins,

  // Configuration for building your library.
  // See: https://vitejs.dev/guide/build.html#library-mode
  build: {
    outDir: "../../dist/libs/common",
    reportCompressedSize: true,
    target: "esnext",
    modulePreload: false,
    cssCodeSplit: false,
    minify: true,
    emptyOutDir: true,
    commonjsOptions: {
      transformMixedEsModules: true
    },
    lib: {
      // Could also be a dictionary or array of multiple entry points.
      entry: "src/index.ts",
      name: "common",
      fileName: "index",
      // Change this to the formats you want to support.
      // Don't forget to update your package.json as well.
      formats: ["es", "cjs"]
    },
    rollupOptions: {
      // External packages that should not be bundled into your library.
      external: ["react", "react-dom", "react/jsx-runtime"]
    }
  },

  test: {
    globals: true,
    environment: "jsdom",
    include: ["src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    setupFiles: ["./vitest.setup.mts"],
    reporters: ["default"],
    coverage: {
      reportsDirectory: "../../coverage/libs/common",
      provider: "v8"
    }
  }
};

export default defineConfig(config);

