import z from "zod"

/**
 * Схема валидации одного объекта шутки (JokeResponseDTO)
 */
const jokeSchema = z.object({
  id: z.number(),
  type: z.string(),
  setup: z.string(),
  punchline: z.string(),
});

/**
 * Схема валидации ответа от API (массив шуток)
 */
export const jokesResponseSchema = z.array(jokeSchema).min(1).max(1);