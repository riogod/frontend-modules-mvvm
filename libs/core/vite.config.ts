import { defineConfig } from 'vite';
import { join } from 'path';
import dts from 'vite-plugin-dts';

export default defineConfig({
  build: {
    lib: {
      entry: join(__dirname, 'src/index.ts'),
      name: 'core',
      fileName: 'index',
      formats: ['es', 'cjs']
    },
    outDir: '../../dist/libs/core',
    emptyOutDir: true,
    rollupOptions: {
      external: ['react', 'react-dom', 'react/jsx-runtime']
    }
  },
  plugins: [
    dts({
      entryRoot: 'src',
      tsconfigPath: join(__dirname, 'tsconfig.json')
    })
  ]
}); 