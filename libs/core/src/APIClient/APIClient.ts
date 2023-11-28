import axios from "axios";
import type { AxiosError, AxiosInstance, AxiosRequestConfig } from "axios";
import type { IRequestOption } from "./interfaces";
import FingerprintJS from "@fingerprintjs/fingerprintjs";

/**
 * Класс для работы с вызовом API.
 * Содержит методы для отправки запросов и обработки ошибок.
 */
export class APIClient {
  api: AxiosInstance;
  errorCb = new Map<string, (error: AxiosError) => void>();

  constructor(private baseURL: string) {
    this.api = axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
      withCredentials: true,
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
   * Генерирует уникальный идентификатор устройства
   *
   * @return {Promise<string>} Уникальный идентификатор
   */
  public async genearateDeviceId(): Promise<string> {
    const fp = await FingerprintJS.load();
    const result = await fp.get();
    return result.visitorId;
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
    const DeviceUUID = localStorage.getItem("D_UUID");
    const requestConfig: AxiosRequestConfig<Req> = {
      responseType: "json",
      method: option.method,
      url: option.route,
      headers: {
        "Device-Id": DeviceUUID,
        ...option.headers,
      },
    };

    if (option.requestObj) {
      requestConfig.data = option.requestObj;
    }

    try {
      const response = await this.api.request<Resp>(requestConfig);

      return response.data;
    } catch (error: any | AxiosError) {
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

      return Promise.reject<Resp>(error);
    }
  }
}
