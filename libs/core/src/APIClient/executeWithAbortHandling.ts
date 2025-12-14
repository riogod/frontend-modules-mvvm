import axios from 'axios';

/**
 * Опции для функции executeWithAbortHandling.
 *
 * @template TData - Тип данных, которые возвращает запрос и которые хранятся в модели
 */
export interface AbortHandlingOptions<TData> {
  /**
   * Асинхронная функция, выполняющая запрос к API.
   * Должна использовать useAbortController: true для автоматической отмены предыдущих запросов.
   *
   * @returns Promise с данными ответа
   */
  requestFn: () => Promise<TData>;

  /**
   * Функция для получения предыдущих данных из модели.
   * Используется для восстановления данных при отмене запроса.
   *
   * @returns Предыдущие данные или null, если данных нет
   */
  getPreviousData: () => TData | null;

  /**
   * Функция для установки данных в модель.
   *
   * @param data - Данные для установки
   */
  setData: (data: TData) => void;

  /**
   * Функция для установки состояния загрузки в модели.
   *
   * @param loading - Состояние загрузки (true/false)
   */
  setLoading: (loading: boolean) => void;

  /**
   * Опциональный обработчик ошибок.
   * Вызывается только для неотмененных запросов.
   *
   * @param error - Ошибка запроса
   */
  onError?: (error: unknown) => void;

  /**
   * Опциональный трекер ID запросов для отслеживания актуальности.
   * Если не передан, создается новый для каждого вызова функции.
   * Рекомендуется создать один экземпляр в usecase и переиспользовать.
   *
   * @example
   * ```typescript
   * private requestIdTracker = { current: 0 };
   * ```
   */
  requestIdTracker?: { current: number };
}

/**
 * Выполняет запрос с автоматической обработкой отмененных запросов.
 *
 * Функция автоматически:
 * - Отслеживает актуальность запроса (игнорирует результаты устаревших запросов)
 * - Сохраняет предыдущие данные перед началом запроса
 * - Управляет состоянием loading
 * - Восстанавливает предыдущие данные при отмене запроса
 * - Корректно обрабатывает ошибки отмены (не показывает их в нотификациях)
 *
 * @template TData - Тип данных, которые возвращает запрос
 *
 * @param options - Опции для выполнения запроса
 *
 * @example
 * ```typescript
 * private requestIdTracker = { current: 0 };
 *
 * async execute(): Promise<void> {
 *   await executeWithAbortHandling({
 *     requestFn: async () => {
 *       const response = await this.repository.getData();
 *       return response.data;
 *     },
 *     getPreviousData: () => this.model.data,
 *     setData: (data) => this.model.setData(data),
 *     setLoading: (loading) => { this.model.loading = loading; },
 *     onError: (error) => {
 *       if (error instanceof Error) {
 *         this.appModel.notification = error.message;
 *       }
 *     },
 *     requestIdTracker: this.requestIdTracker,
 *   });
 * }
 * ```
 */
export async function executeWithAbortHandling<TData>(
  options: AbortHandlingOptions<TData>,
): Promise<void> {
  const {
    requestFn,
    getPreviousData,
    setData,
    setLoading,
    onError,
    requestIdTracker = { current: 0 },
  } = options;

  const requestId = ++requestIdTracker.current;
  const previousData = getPreviousData();
  setLoading(true);

  let wasAborted = false;

  try {
    const response = await requestFn();

    if (requestId === requestIdTracker.current) {
      setData(response);
    }
  } catch (error) {
    const isAborted =
      (error instanceof Error &&
        (error.name === 'AbortError' || error.name === 'CanceledError')) ||
      (axios.isAxiosError(error) && error.code === 'ERR_CANCELED');

    if (isAborted) {
      wasAborted = true;
      if (requestId === requestIdTracker.current && previousData) {
        setData(previousData);
      }
      return;
    }

    if (onError) {
      onError(error);
    }
    throw error;
  } finally {
    if (
      requestId === requestIdTracker.current &&
      (!wasAborted || previousData)
    ) {
      setLoading(false);
    }
  }
}
