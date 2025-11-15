export interface AppStartDTO {
  status: string;
  data: {
    features: Record<string, boolean>;
    permissions: Record<string, boolean>;
  };
}
