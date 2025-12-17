import { defineConfig } from 'vite';
import { createModuleConfig } from '@platform/vite-config';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig(async () =>
  createModuleConfig({
    dirname: __dirname,
    moduleName: 'api_example',
  })
);


