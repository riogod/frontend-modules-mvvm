import z from 'zod';

/**
 * Схема записи модуля в манифесте
 */
const moduleManifestEntrySchema = z.object({
  name: z.string(),
  version: z.string().optional(),
  loadType: z.enum(['init', 'normal']),
  loadPriority: z.number().optional(),
  remoteEntry: z.string(),
  dependencies: z.array(z.string()).optional(),
  featureFlags: z.array(z.string()).optional(),
  accessPermissions: z.array(z.string()).optional(),
});

/**
 * Схема валидации ответа от API (AppStartDTO)
 */
const appStartResponseSchema = z.object({
  status: z.string(),
  data: z.object({
    features: z.record(z.string(), z.boolean()),
    permissions: z.record(z.string(), z.boolean()),
    params: z.record(z.string(), z.unknown()).optional(),
    modules: z.array(moduleManifestEntrySchema).optional(),
  }),
});

export { appStartResponseSchema, moduleManifestEntrySchema };
