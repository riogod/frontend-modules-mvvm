import { inject, injectable } from "inversify";
import { APIClient, HttpMethod } from "@todo/core";
import { EAPIAccessEndpoints } from "../config/endpoints.ts";
import { AppStartDTO } from "./app.dto.ts";
import { appStartResponseSchema } from "./validation/appStart.response.schema.ts";


@injectable()
export class AppStartRepository {
  constructor(
    @inject(APIClient)
    private apiClient: APIClient,
  ) { }

  async getAppStart(): Promise<AppStartDTO> {
    const response = await this.apiClient.request<null, AppStartDTO>({
      route: EAPIAccessEndpoints.APP_START_ENDPOINT,
      method: HttpMethod.GET,
      validationSchema: {
        response: appStartResponseSchema,
      },
    });

    return response;
  }
}
