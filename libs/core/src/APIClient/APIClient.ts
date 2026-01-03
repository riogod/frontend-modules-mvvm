/// <reference path="../vite-env.d.ts" />
import axios from 'axios';
import type { AxiosError, AxiosInstance, AxiosRequestConfig } from 'axios';
import { log } from '../Logger';
import type { IRequestOption } from './interfaces';
import { AbortControllerStorage } from './AbortControllerStorage';
import { UrlNormalizer } from './UrlNormalizer';

/**
 * Класс для работы с вызовом API.
 * Содержит методы для отправки запросов и обработки ошибок.
 */
export class APIClient {
  api: AxiosInstance;
  errorCb = new Map<string, (error: AxiosError) => void>();
  private abortControllerStorage: AbortControllerStorage;
  private urlNormalizer: UrlNormalizer;

  constructor(
    private baseURL: string,
    withCredentials: boolean = false,
  ) {
    this.api = axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
      withCredentials: withCredentials,
    });
    this.abortControllerStorage = new AbortControllerStorage();
    this.urlNormalizer = new UrlNormalizer();
  }

  /**
   * Добавляет функцию обратного вызова для обработки ошибок
   *
   * @param {string} id - ID статуса ошибки
   * @param {(error: AxiosError) => void} cb - Функция обратного вызова.
   * @return {void} Эта функция ничего не возвращает.
   */
  public addErrorCb(id: string, cb: (error: AxiosError) => void): void {
    this.errorCb.set(id, cb);
  }

  /**
   * Отправляет запрос к серверу и возвращает ответ.
   * Метод принимает дженерик с типами Req и Resp, где Req - тип запроса и Resp - тип ответа.
   *
   * Если произошла ошибка, то вызывает функцию обратного вызова errorCb
   * относительно статуса ошибки.
   *
   * @param {IRequestOption<Req>} option - Опции запроса
   * @returns {Promise<Resp>} Ответ от сервера
   */
  public async request<Req, Resp>(option: IRequestOption<Req>): Promise<Resp> {
    // В dev режиме через лаунчер добавляем префикс /dev-api/ для проксирования через Vite на dev-server
    // Dev-server сам решает, использовать моки или проксировать на реальный API
    // Проверяем: dev режим + используется proxy server + baseURL пустой (запросы идут через proxy)
    const shouldUseDevApiPrefix =
      import.meta.env.DEV &&
      import.meta.env.VITE_USE_PROXY_SERVER === 'true' &&
      !this.baseURL;

    // Добавляем префикс /dev-api/ к маршруту, если нужно
    // Гарантируем, что route всегда начинается с /, а префикс добавляется корректно
    const route = shouldUseDevApiPrefix
      ? `/dev-api${option.route.startsWith('/') ? option.route : `/${option.route}`}`
      : option.route;

    const requestConfig: AxiosRequestConfig<Req> = {
      responseType: 'json',
      method: option.method,
      url: route,
      headers: {
        ...option.headers,
      },
    };

    if (option.requestObj) {
      requestConfig.data = option.requestObj;
    }

    if (option.validationSchema && option.validationSchema.request) {
      const result = option.validationSchema.request.safeParse(
        requestConfig.data,
      );
      if (!result.success) {
        return Promise.reject<Resp>(result.error);
      }
    }

    // Обработка механизма отмены запросов
    let normalizedId: string | undefined;
    let controller: AbortController | undefined;
    let controllerRemoved = false; // Флаг для отслеживания, был ли контроллер уже удален

    if (option.useAbortController) {
      // Используем оригинальный route для нормализации (без префикса /dev-api/)
      // чтобы отмена работала корректно независимо от префикса
      normalizedId = this.urlNormalizer.normalize(option.route, option.method);
      controller = this.abortControllerStorage.set(normalizedId);
      requestConfig.signal = controller.signal;
    }

    try {
      const response = await this.api.request<Resp>(requestConfig);

      if (option.validationSchema && option.validationSchema.response) {
        const result = option.validationSchema.response.safeParse(
          response.data,
        );

        if (!result.success) {
          return Promise.reject<Resp>(result.error);
        }
      }

      return response.data;
    } catch (error: unknown) {
      // Проверяем, является ли ошибка отменой запроса
      const isAborted =
        (error instanceof Error &&
          (error.name === 'AbortError' || error.name === 'CanceledError')) ||
        (axios.isAxiosError(error) && error.code === 'ERR_CANCELED');

      // Если запрос был отменен, не логируем и не вызываем errorCb
      if (isAborted) {
        // Удаляем контроллер из хранилища при отмене
        // Но только если это все еще наш контроллер (не был заменен новым запросом)
        if (
          normalizedId &&
          controller &&
          this.abortControllerStorage.get(normalizedId) === controller
        ) {
          this.abortControllerStorage.remove(normalizedId);
          controllerRemoved = true;
        }
        // Пробрасываем ошибку дальше, но не логируем
        return Promise.reject<Resp>(error);
      }

      // Используем оригинальный Error объект (особенно важно для AxiosError)
      // чтобы сохранить всю информацию и предотвратить дублирование
      // Если это не Error, создаем новый, но для AxiosError используем оригинал
      let errorObj: Error;
      if (error instanceof Error) {
        errorObj = error;
      } else {
        errorObj = new Error(String(error));
      }

      // Логируем ошибку через log.error (это автоматически отправит в мониторинг)
      // Это гарантирует, что все ошибки из APIClient попадут в мониторинг,
      // даже если они обрабатываются через errorCb или catch
      const errorMessage = axios.isAxiosError(error)
        ? `Request failed: ${error.message} (${error.response?.status || 'no status'})`
        : errorObj.message;

      // Добавляем дополнительную информацию об ошибке напрямую к Error объекту
      // Это гарантирует, что информация попадет в мониторинг через extractErrorFromArgs
      if (axios.isAxiosError(error)) {
        Object.assign(errorObj, {
          status: error.response?.status,
          statusText: error.response?.statusText,
          url: error.config?.url,
          method: error.config?.method?.toUpperCase(),
          baseURL: error.config?.baseURL,
          request: {
            url: error.config?.url,
            method: error.config?.method?.toUpperCase(),
            baseURL: error.config?.baseURL,
            timeout: error.config?.timeout,
            headers: error.config?.headers,
            data: error.config?.data,
            params: error.config?.params,
          },
          response: error.response
            ? {
                status: error.response.status,
                statusText: error.response.statusText,
                headers: error.response.headers,
                data: error.response.data,
              }
            : undefined,
          code: error.code,
        });
      }

      log.error(errorMessage, { prefix: 'APIClient' }, errorObj);

      // Вызываем errorCb, если он установлен для данного статуса
      if (
        axios.isAxiosError(error) &&
        error.response &&
        error.response.status &&
        this.errorCb.has(String(error.response.status))
      ) {
        const cb = this.errorCb.get(String(error.response.status));
        if (cb) {
          cb(error as AxiosError);
        }
      }

      return Promise.reject<Resp>(errorObj);
    } finally {
      // Удаляем контроллер из хранилища после завершения запроса (успешного или с ошибкой)
      // Но только если:
      // 1. Контроллер не был уже удален (controllerRemoved)
      // 2. Контроллер в хранилище все еще тот же самый (не был заменен новым запросом)
      if (
        normalizedId &&
        controller &&
        !controllerRemoved &&
        !controller.signal.aborted &&
        this.abortControllerStorage.get(normalizedId) === controller
      ) {
        this.abortControllerStorage.remove(normalizedId);
      }
    }
  }

  /**
   * Явно отменяет запрос по URL и методу.
   *
   * @param url - URL запроса для отмены
   * @param method - HTTP метод запроса (опционально)
   */
  public abortRequest(url: string, method?: string): void {
    const normalizedId = this.urlNormalizer.normalize(url, method);
    this.abortControllerStorage.abort(normalizedId);
  }

  /**
   * Отменяет все активные запросы с включенным механизмом отмены.
   * Полезно для cleanup при размонтировании компонентов.
   */
  public abortAllRequests(): void {
    this.abortControllerStorage.abortAll();
  }
}
