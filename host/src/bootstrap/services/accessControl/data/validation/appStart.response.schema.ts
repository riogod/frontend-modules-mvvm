import z from "zod"

/**
 * Схема валидации ответа от API (AppStartDTO)
 */
const appStartResponseSchema = z.object({
  status: z.string(),
  data: z.object({
    features: z.record(z.string(), z.boolean()),
    permissions: z.record(z.string(), z.boolean()),
  }),
});

export { appStartResponseSchema };