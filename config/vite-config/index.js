export { createBaseConfig } from './base.config.js';
export { createHostConfig } from './host.config.js';
export { createLibConfig } from './lib.config.js';
export { createModuleConfig } from './module.config.js';
export { createViteConfig } from './createViteConfig.js';

// Плагины для MFE
export {
  createModuleAliasesPlugin,
  createManifestMiddleware,
  loadManifest,
} from './plugins/index.js';

// Build утилиты
export {
  getModuleVersion,
  discoverModules,
  isModuleBuilt,
} from './build-utils/index.js';
