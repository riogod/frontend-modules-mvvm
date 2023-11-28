import type { HttpMethod } from './enums';

export interface IRequestOption<T> {
  method: HttpMethod;
  route: string;
  requestObj?: T;
  headers?: Record<string, string | undefined>;
}

export interface ResponseSuccess {
  success: boolean;
}