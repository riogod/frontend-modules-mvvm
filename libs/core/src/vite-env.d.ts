/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly DEV?: boolean;
  readonly VITE_USE_PROXY_SERVER?: string;
  readonly VITE_API_URL?: string;
  readonly VITE_APP_PREFIX?: string;
  readonly VITE_LOG_LEVEL?: string;
  readonly LOG_LEVEL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
