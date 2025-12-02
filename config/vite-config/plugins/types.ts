/**
 * 🔑 ЕДИНЫЙ ИСТОЧНИК ТИПОВ МАНИФЕСТА
 *
 * Эти типы используются во всём проекте:
 * - config/vite-config/plugins/ — Vite плагины
 * - config/vite-config/build/ — Build утилиты
 * - host/src/bootstrap/ — Bootstrap handlers (через реэкспорт)
 *
 * Примечание: ModuleManifestEntry определен здесь для vite-config,
 * но также доступен через @platform/core для использования в других частях проекта
 */

/**
 * Запись модуля в манифесте
 * Дублируется из @platform/core для использования в vite-config
 */
export interface ModuleManifestEntry {
  name: string;
  version?: string;
  loadType: 'init' | 'normal';
  loadPriority?: number;
  remoteEntry: string;
  dependencies?: string[];
  featureFlags?: string[];
  accessPermissions?: string[];
}

export interface AppManifest {
  modules: ModuleManifestEntry[];
  user?: {
    permissions: string[];
    featureFlags: string[];
  };
}

export interface ModuleAliasesOptions {
  /**
   * Манифест с описанием модулей
   */
  manifest: AppManifest | null;

  /**
   * Путь к директории packages/
   */
  packagesDir: string;
}

export interface ManifestMiddlewareOptions {
  /**
   * Манифест для отдачи на /app/start
   */
  manifest: AppManifest | null;

  /**
   * Дефолтные user данные для dev режима
   */
  defaultUser?: {
    permissions: string[];
    featureFlags: string[];
  };
}

