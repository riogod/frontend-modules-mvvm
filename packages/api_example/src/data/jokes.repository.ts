import { inject, injectable } from 'inversify';
import { APIClient, HttpMethod, IOC_CORE_TOKENS } from '@platform/core';
import { EAPIExampleEndpoints } from '../config/endpoints';
import { JokeResponseDTO } from './jokes.dto';
import { jokesResponseSchema } from './validation/jokes.response.schema';

@injectable()
export class JokesRepository {
  constructor(
    @inject(IOC_CORE_TOKENS.APIClient)
    private apiClient: APIClient,
  ) {}

  async getJoke(): Promise<JokeResponseDTO[]> {
    return await this.apiClient.request<
      { limit: number; offset: number },
      JokeResponseDTO[]
    >({
      route: EAPIExampleEndpoints.JOKES_DATA,
      method: HttpMethod.GET,
      requestObj: {
        limit: 10,
        offset: 0,
      },
      validationSchema: {
        response: jokesResponseSchema,
      },
    });
  }
}
