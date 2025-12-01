import { inject, injectable } from 'inversify';
import { APIClient, HttpMethod, IOC_CORE_TOKENS } from '@platform/core';
import { AppStartDTO } from './app.dto';
import { appStartResponseSchema } from './validation/appStart.response.schema';
import { ECoreEndpoints } from 'host/src/config/endpoints';

@injectable()
export class AppStartRepository {
  constructor(
    @inject(IOC_CORE_TOKENS.APIClient)
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
