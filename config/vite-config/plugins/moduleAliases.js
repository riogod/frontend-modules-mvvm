import * as path from 'path';

/**
 * Vite плагин для создания алиасов LOCAL модулей
 *
 * Читает манифест и для модулей с remoteEntry === '' создает алиас:
 *   @platform/module-{name} → packages/{name}/src
 *
 * Это позволяет импортировать LOCAL модули с HMR в dev режиме
 */
export function createModuleAliasesPlugin(options) {
  const { manifest, packagesDir } = options;

  if (!manifest) {
    return {
      name: 'platform-module-aliases-noop',
    };
  }

  // Извлекаем локальные модули (remoteEntry === '')
  const localModules = manifest.modules
    .filter((m) => m.remoteEntry === '' && m.loadType === 'normal')
    .map((m) => m.name);

  return {
    name: 'platform-module-aliases',

    config(config) {
      const aliases = {};

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

