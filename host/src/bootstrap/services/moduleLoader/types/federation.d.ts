/**
 * Типы для Module Federation runtime API.
 * @module types/federation
 */

// Webpack Module Federation
declare const __webpack_share_scopes__:
  | Record<string, Record<string, unknown>>
  | undefined;
declare const __webpack_init_sharing__:
  | ((scope: string) => Promise<void>)
  | undefined;

// Vite Plugin Federation (@originjs/vite-plugin-federation)
// Использует globalThis.__federation_shared__ для хранения shared модулей
declare global {
  // eslint-disable-next-line no-var
  var __federation_shared__:
    | Record<string, Record<string, unknown>>
    | undefined;
}

declare module 'virtual:federation' {
  export function loadRemote<T = unknown>(id: string): Promise<T>;
}

