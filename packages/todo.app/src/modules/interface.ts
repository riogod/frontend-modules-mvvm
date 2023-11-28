import { ModuleConfig } from "../bootstrap/interface";

export interface Module {
  name: string;
  path: string;
  description?: string;
  config: ModuleConfig;
}
