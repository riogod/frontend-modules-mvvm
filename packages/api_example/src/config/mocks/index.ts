import { delay, http, HttpResponse, type RequestHandler } from 'msw';
import { EAPIExampleEndpoints } from '../endpoints';
import jokes from './data/getJoke.json';

export const handlers: RequestHandler[] = [
  http.get(EAPIExampleEndpoints.JOKES_DATA, async () => {
    const joke = jokes[Math.floor(Math.random() * jokes.length)];

    await delay(Math.random() * 1000);

    //random status 200 or 500 , but 500 in 20% of cases
    if (Math.random() > 0.2) {
      return HttpResponse.json([joke]);
    }

    return HttpResponse.json(
      {},
      {
        status: 500,
      },
    );
  }),
];
