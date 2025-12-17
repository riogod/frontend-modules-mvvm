import z from 'zod';
import { ModuleLoadType } from '@platform/core';

/**
 * Схема записи модуля в манифесте
 */
const moduleManifestEntrySchema = z.object({
  name: z.string(),
  version: z.string().optional(),
  loadType: z.nativeEnum(ModuleLoadType),
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
    params: z.record(z.string(), z.unknown()).default({}),
    modules: z.array(moduleManifestEntrySchema).optional(),
  }),
});

export { appStartResponseSchema, moduleManifestEntrySchema };
