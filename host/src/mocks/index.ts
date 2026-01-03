import { http, HttpResponse, type RequestHandler } from 'msw';
import appStartDataResponse from './data/appStartData.json';
import { getAppStartEndpoint } from '../bootstrap/services/appStart/endpoints';

export const handlers: RequestHandler[] = [
  http.get(getAppStartEndpoint(), () => {
    return HttpResponse.json(appStartDataResponse, { status: 200 });
  }),
];
