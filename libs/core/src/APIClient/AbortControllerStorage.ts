/**
 * Хранилище для управления AbortController объектами.
 * Позволяет отменять предыдущие запросы при создании новых с тем же нормализованным ID.
 */
export class AbortControllerStorage {
  private abortControllerStorage: Map<string, AbortController> = new Map();

  /**
   * Создает новый AbortController, отменяя предыдущий с тем же ID.
   * Метод атомарный - возвращает контроллер, который можно сразу использовать.
   *
   * @param normalizedId - Нормализованный ID запроса
   * @returns Новый AbortController
   */
  set(normalizedId: string): AbortController {
    // Отменяем предыдущий запрос, если он существует
    const existingController = this.abortControllerStorage.get(normalizedId);
    if (existingController && !existingController.signal.aborted) {
      existingController.abort();
    }

    // Создаем новый контроллер
    const newController = new AbortController();
    this.abortControllerStorage.set(normalizedId, newController);

    return newController;
  }

  /**
   * Получает AbortController по нормализованному ID.
   *
   * @param normalizedId - Нормализованный ID запроса
   * @returns AbortController или undefined, если не найден
   */
  get(normalizedId: string): AbortController | undefined {
    return this.abortControllerStorage.get(normalizedId);
  }

  /**
   * Проверяет наличие контроллера по нормализованному ID.
   *
   * @param normalizedId - Нормализованный ID запроса
   * @returns true, если контроллер существует
   */
  has(normalizedId: string): boolean {
    return this.abortControllerStorage.has(normalizedId);
  }

  /**
   * Удаляет контроллер из хранилища.
   *
   * @param normalizedId - Нормализованный ID запроса
   */
  remove(normalizedId: string): void {
    this.abortControllerStorage.delete(normalizedId);
  }

  /**
   * Явно отменяет запрос и удаляет контроллер из хранилища.
   *
   * @param normalizedId - Нормализованный ID запроса
   */
  abort(normalizedId: string): void {
    const controller = this.abortControllerStorage.get(normalizedId);

    if (controller && !controller.signal.aborted) {
      controller.abort();
    }

    this.abortControllerStorage.delete(normalizedId);
  }

  /**
   * Отменяет все активные запросы и очищает хранилище.
   * Полезно для cleanup при размонтировании компонентов.
   */
  abortAll(): void {
    for (const [id, controller] of this.abortControllerStorage.entries()) {
      if (!controller.signal.aborted) {
        controller.abort();
      }
    }
    this.abortControllerStorage.clear();
  }
}
