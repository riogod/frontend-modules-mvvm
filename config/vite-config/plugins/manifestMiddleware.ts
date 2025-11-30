import type { Plugin, ViteDevServer } from 'vite';
import type { ManifestMiddlewareOptions } from './types.ts';

/**
 * Vite плагин для создания /app/start endpoint в dev режиме
 *
 * Возвращает манифест модулей для Bootstrap приложения.
 * В production этот endpoint обслуживается бэкендом.
 *
 * @example
 * ```typescript
 * createManifestMiddleware({
 *   manifest,
 *   defaultUser: {
 *     permissions: ['admin'],
 *     featureFlags: ['feature1'],
 *   },
 * })
 * ```
 */
export function createManifestMiddleware(
  options: ManifestMiddlewareOptions,
): Plugin {
  const { manifest, defaultUser } = options;

  if (!manifest) {
    return {
      name: 'platform-manifest-middleware-noop',
    };
  }

  if (process.env.DEBUG) {
    console.log(
      '[platform-manifest-middleware] Manifest content:',
      JSON.stringify(manifest, null, 2),
    );
  }

  return {
    name: 'platform-manifest-middleware',

    configureServer(server: ViteDevServer) {
      server.middlewares.use('/app/start', (req, res, next) => {
        if (req.method !== 'GET') {
          return next();
        }

        // Добавляем user данные для dev режима
        const devManifest = {
          ...manifest,
          user:
            manifest.user ||
            defaultUser || {
              permissions: [],
              featureFlags: [],
            },
        };

        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Cache-Control', 'no-cache');

        res.end(JSON.stringify(devManifest, null, 2));

        console.log('[platform-manifest-middleware] Served /app/start');
      });
    },
  };
}

