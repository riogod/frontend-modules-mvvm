import type { HttpMethod } from './enums';
import type { ZodType } from 'zod';

export interface IRequestOption<T> {
  method: HttpMethod;
  route: string;
  requestObj?: T;
  headers?: Record<string, string | undefined>;
  validationSchema?: {
    request?: ZodType;
    response?: ZodType;
  };
  /**
   * Включает механизм автоматической отмены неактуальных запросов.
   * При установке в `true`, новый запрос с тем же нормализованным URL
   * автоматически отменит предыдущий запрос.
   * По умолчанию: `false`
   */
  useAbortController?: boolean;
}

export interface ResponseSuccess {
  success: boolean;
}
