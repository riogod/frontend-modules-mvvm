import { http, HttpResponse, type RequestHandler } from 'msw';
import { ELocalModuleEndpoints } from '../endpoints';

export const handlers: RequestHandler[] = [
  http.get(ELocalModuleEndpoints.LOCAL_DATA, () => {
    return HttpResponse.json({ message: 'Hello, world!' });
  }),
];
