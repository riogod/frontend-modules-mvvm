import { http, HttpResponse, type RequestHandler } from 'msw';
import appStartDataResponse from './data/appStartData.json';
import { ECoreEndpoints } from '../config/endpoints';

export const handlers: RequestHandler[] = [
  http.get(ECoreEndpoints.APP_START_ENDPOINT, () => {
    return HttpResponse.json(appStartDataResponse, { status: 200 });
  }),
];
