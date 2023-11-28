import { AbstractInitHandler } from "./AbstractInitHandler";
import { Bootstrap } from "../index.ts";

/**
 * Обработчик инициализации мок сервиса
 */
export class MockServiceHandler extends AbstractInitHandler {
  async handle(bootstrap: Bootstrap): Promise<Bootstrap> {
    if (process.env.NODE_ENV === "development") {
      await bootstrap.mockService?.init();
    }
    return await super.handle(bootstrap);
  }
}
