/**
 * Типы для Module Federation runtime API
 */
declare const __webpack_share_scopes__: Record<string, Record<string, any>> | undefined;
declare const __webpack_init_sharing__: ((scope: string) => Promise<void>) | undefined;

declare module 'virtual:federation' {
  export function loadRemote<T = any>(id: string): Promise<T>;
}

