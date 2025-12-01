import type { ModuleManifestEntry } from '@host/bootstrap/interface';

export interface AppStartDTO {
  status: string;
  data: {
    features: Record<string, boolean>;
    permissions: Record<string, boolean>;
    params: Record<string, undefined>;
    modules: ModuleManifestEntry[];
  };
}
