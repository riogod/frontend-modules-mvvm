import { inject, injectable } from 'inversify';
import { APIClient, HttpMethod, IOC_CORE_TOKENS, log } from '@platform/core';
import { AppStartDTO } from './app.dto';
import { appStartResponseSchema } from './validation/appStart.response.schema';
import { ECoreEndpoints } from '../endpoints';

@injectable()
export class AppStartRepository {
  constructor(
    @inject(IOC_CORE_TOKENS.APIClient)
    private apiClient: APIClient,
  ) {
    log.debug('AppStartRepository: constructor', {
      prefix: 'bootstrap.services.appStart.repository',
    });
  }

  async getAppStart(): Promise<AppStartDTO> {
    log.debug('AppStartRepository: requesting app start data', {
      prefix: 'bootstrap.services.appStart.repository.getAppStart',
    });
    log.debug(
      `AppStartRepository: endpoint=${ECoreEndpoints.APP_START_ENDPOINT}, method=${HttpMethod.GET}`,
      {
        prefix: 'bootstrap.services.appStart.repository.getAppStart',
      },
    );

    try {
      const response = await this.apiClient.request<null, AppStartDTO>({
        route: ECoreEndpoints.APP_START_ENDPOINT,
        method: HttpMethod.GET,
        validationSchema: {
          response: appStartResponseSchema,
        },
      });

      const featuresCount = Object.keys(response.data?.features || {}).length;
      const permissionsCount = Object.keys(
        response.data?.permissions || {},
      ).length;
      log.debug(
        `AppStartRepository: app start data received, features=${featuresCount}, permissions=${permissionsCount}`,
        {
          prefix: 'bootstrap.services.appStart.repository.getAppStart',
        },
      );

      return response;
    } catch (error) {
      log.error(
        'AppStartRepository: failed to get app start data',
        {
          prefix: 'bootstrap.services.appStart.repository.getAppStart',
        },
        {
          error,
        },
      );
      throw error;
    }
  }
}
