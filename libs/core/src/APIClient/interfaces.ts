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
  }
}

export interface ResponseSuccess {
  success: boolean;
}