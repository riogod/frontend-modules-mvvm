import * as path from 'path';
import type { Plugin, UserConfig } from 'vite';
import { ModuleLoadType } from '@platform/core';
import type { ModuleAliasesOptions } from './types';

/**
 * Vite плагин для создания алиасов LOCAL модулей
 *
 * Читает манифест и для модулей с remoteEntry === '' создает алиас:
 *   @platform/module-{name} → packages/{name}/src
 *
 * Это позволяет импортировать LOCAL модули с HMR в dev режиме
 *
 * @example
 * ```typescript
 * createModuleAliasesPlugin({
 *   manifest,
 *   packagesDir: path.resolve(__dirname, '../packages'),
 * })
 * ```
 */
export function createModuleAliasesPlugin(
  options: ModuleAliasesOptions,
): Plugin {
  const { manifest, packagesDir } = options;

  if (!manifest) {
    return {
      name: 'platform-module-aliases-noop',
    };
  }

  // Извлекаем локальные модули (remoteEntry === '')
  const localModules = manifest.modules
    .filter((m) => m.remoteEntry === '' && m.loadType === ModuleLoadType.NORMAL)
    .map((m) => m.name);

  return {
    name: 'platform-module-aliases',

    config(config: UserConfig) {
      const aliases: Record<string, string> = {};

      // Создаем алиасы для каждого локального модуля
      localModules.forEach((moduleName) => {
        const modulePath = path.resolve(packagesDir, moduleName, 'src');

        // Основной алиас для модуля
        aliases[`@platform/module-${moduleName}`] = modulePath;

        // Алиас для подпутей внутри модуля
        aliases[`@platform/module-${moduleName}/`] = `${modulePath}/`;
      });

      if (localModules.length > 0) {
        console.log(
          '[platform-module-aliases] Created aliases for:',
          localModules,
        );
      }

      if (process.env.DEBUG) {
        console.log('[platform-module-aliases] Configuration:');
        console.log('  Packages dir:', packagesDir);
        console.log('  Local modules:', localModules);
        console.log('  Aliases:', aliases);
      }

      return {
        resolve: {
          alias: {
            ...config.resolve?.alias,
            ...aliases,
          },
        },
      };
    },
  };
}
