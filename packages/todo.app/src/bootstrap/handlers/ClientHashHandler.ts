import { AbstractInitHandler } from "./AbstractInitHandler";
import { Bootstrap } from "..";

/**
 * Обработчик генерации хеша уникального устройства пользователя.
 */
export class ClientHashHandler extends AbstractInitHandler {
  async handle(bootstrap: Bootstrap): Promise<Bootstrap> {
    const apiClient = bootstrap.getAPIClient;
    const checkStorage = localStorage.getItem("D_UUID");
    if (!checkStorage) {
      const deviceID = await apiClient.genearateDeviceId();
      localStorage.setItem("D_UUID", deviceID);
    }

    return await super.handle(bootstrap);
  }
}
