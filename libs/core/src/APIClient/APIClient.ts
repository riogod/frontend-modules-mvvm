import axios from 'axios';
import type { AxiosError, AxiosInstance, AxiosRequestConfig } from 'axios';
import { log } from '../Logger';
import type { IRequestOption } from './interfaces';

/**
 * Класс для работы с вызовом API.
 * Содержит методы для отправки запросов и обработки ошибок.
 */
export class APIClient {
  api: AxiosInstance;
  errorCb = new Map<string, (error: AxiosError) => void>();

  constructor(
    private baseURL: string,
    withCredentials: boolean = false,
  ) {
    this.api = axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
      withCredentials: withCredentials,
    });
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
    const requestConfig: AxiosRequestConfig<Req> = {
      responseType: 'json',
      method: option.method,
      url: option.route,
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
    }
  }
}
