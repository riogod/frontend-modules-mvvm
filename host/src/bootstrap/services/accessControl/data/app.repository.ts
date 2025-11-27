import { inject, injectable } from 'inversify';
import { APIClient, HttpMethod } from '@platform/core';
import { AppStartDTO } from './app.dto.ts';
import { appStartResponseSchema } from './validation/appStart.response.schema.ts';
import { ECoreEndpoints } from 'host/src/config/endpoints.ts';

@injectable()
export class AppStartRepository {
  constructor(
    @inject(APIClient)
    private apiClient: APIClient,
  ) {}

  async getAppStart(): Promise<AppStartDTO> {
    const response = await this.apiClient.request<null, AppStartDTO>({
      route: ECoreEndpoints.APP_START_ENDPOINT,
      method: HttpMethod.GET,
      validationSchema: {
        response: appStartResponseSchema,
      },
    });

    return response;
  }
}
