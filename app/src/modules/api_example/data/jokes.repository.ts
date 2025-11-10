import { inject, injectable } from "inversify";
import { APIClient, HttpMethod } from "@todo/core";
import { EAPIExampleEndpoints } from "../config/endpoints.ts";
import { JokeResponseDTO } from "./jokes.dto.ts";
import { jokesResponseSchema } from "./validation/jokes.response.schema.ts";


@injectable()
export class JokesRepository {
  constructor(
    @inject(APIClient)
    private apiClient: APIClient,
  ) { }

  async getJoke(): Promise<JokeResponseDTO[]> {
    return await this.apiClient.request<null, JokeResponseDTO[]>({
      route: EAPIExampleEndpoints.JOKES_DATA,
      method: HttpMethod.GET,
      validationSchema: {
        response: jokesResponseSchema,
      },
    });
  }
}
