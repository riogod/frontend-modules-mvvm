import { http, HttpResponse, RequestHandler } from 'msw';

import appStartDataResponse from './data/appStartData.json';
import { EAPIAccessEndpoints } from '../endpoints';

export const handlers: RequestHandler[] = [
  http.get(EAPIAccessEndpoints.APP_START_ENDPOINT, () => {
    return HttpResponse.json(appStartDataResponse, { status: 200 });
  }),
];
