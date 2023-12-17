import { delay, http, HttpResponse, RequestHandler } from 'msw';
import { EAPIExampleEndpoints } from '../endpoints.ts';
import jokes from './data/getJoke.json';

export const handlers: RequestHandler[] = [
  http.get(EAPIExampleEndpoints.JOKES_DATA, async () => {
    // select random joke from mocks
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access
    const joke = jokes[Math.floor(Math.random() * jokes.length)];

    await delay(Math.random() * 5000);

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
