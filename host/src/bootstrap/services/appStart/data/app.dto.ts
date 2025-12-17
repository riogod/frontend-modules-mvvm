import type { ModuleManifestEntry } from '@platform/core';

export interface AppStartDTO {
  status: string;
  data: {
    features: Record<string, boolean>;
    permissions: Record<string, boolean>;
    params: Record<string, unknown>;
    modules: ModuleManifestEntry[];
  };
}
