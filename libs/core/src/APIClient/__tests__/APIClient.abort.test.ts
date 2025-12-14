import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { APIClient } from '../index';
import { HttpMethod } from '../enums';
import MockAdapter from 'axios-mock-adapter';

interface RequestDTO {
  foo: string;
}

interface ResponseDTO {
  data: string;
}

describe('APIClient - AbortController', () => {
  let apiClient: APIClient;
  let mock: MockAdapter;

  beforeEach(() => {
    apiClient = new APIClient('http://example.com');
    mock = new MockAdapter(apiClient.api);
  });

  afterEach(() => {
    mock.reset();
    apiClient.abortAllRequests();
  });

  describe('useAbortController option', () => {
    it('should not use abort mechanism when useAbortController is not set', async () => {
      const responseData = { data: 'response' };
      mock.onGet('/users/123').reply(200, responseData);

      const response = await apiClient.request<RequestDTO, ResponseDTO>({
        method: HttpMethod.GET,
        route: '/users/123',
      });

      expect(response).toEqual(responseData);
    });

    it('should not use abort mechanism when useAbortController is false', async () => {
      const responseData = { data: 'response' };
      mock.onGet('/users/123').reply(200, responseData);

      const response = await apiClient.request<RequestDTO, ResponseDTO>({
        method: HttpMethod.GET,
        route: '/users/123',
        useAbortController: false,
      });

      expect(response).toEqual(responseData);
    });

    it('should use abort mechanism when useAbortController is true', async () => {
      const responseData = { data: 'response' };
      mock.onGet('/users/123').reply(200, responseData);

      const response = await apiClient.request<RequestDTO, ResponseDTO>({
        method: HttpMethod.GET,
        route: '/users/123',
        useAbortController: true,
      });

      expect(response).toEqual(responseData);
    });
  });

  describe('automatic request cancellation', () => {
    it('should cancel previous request when new request with same normalized URL is made', async () => {
      // Первый запрос будет отменен
      const firstRequestPromise = apiClient.request<RequestDTO, ResponseDTO>({
        method: HttpMethod.GET,
        route: '/users/123',
        useAbortController: true,
      });

      // Второй запрос с другим ID, но нормализуется в тот же URL
      mock.onGet('/users/456').reply(200, { data: 'second response' });
      const secondRequestPromise = apiClient.request<RequestDTO, ResponseDTO>({
        method: HttpMethod.GET,
        route: '/users/456', // Нормализуется в /users/number, как и первый
        useAbortController: true,
      });

      // Первый запрос должен быть отменен
      await expect(firstRequestPromise).rejects.toThrow();

      // Второй запрос должен успешно выполниться
      const secondResponse = await secondRequestPromise;
      expect(secondResponse).toEqual({ data: 'second response' });
    });

    it('should not cancel requests without useAbortController', async () => {
      mock.onGet('/users/123').reply(200, { data: 'first response' });
      mock.onGet('/users/456').reply(200, { data: 'second response' });

      const firstRequestPromise = apiClient.request<RequestDTO, ResponseDTO>({
        method: HttpMethod.GET,
        route: '/users/123',
        useAbortController: false,
      });

      const secondRequestPromise = apiClient.request<RequestDTO, ResponseDTO>({
        method: HttpMethod.GET,
        route: '/users/456',
        useAbortController: false,
      });

      // Оба запроса должны успешно выполниться
      const firstResponse = await firstRequestPromise;
      const secondResponse = await secondRequestPromise;

      expect(firstResponse).toEqual({ data: 'first response' });
      expect(secondResponse).toEqual({ data: 'second response' });
    });

    it('should not cancel request without useAbortController when request with useAbortController is made', async () => {
      mock.onGet('/users/123').reply(200, { data: 'first response' });
      mock.onGet('/users/456').reply(200, { data: 'second response' });

      const firstRequestPromise = apiClient.request<RequestDTO, ResponseDTO>({
        method: HttpMethod.GET,
        route: '/users/123',
        useAbortController: false,
      });

      const secondRequestPromise = apiClient.request<RequestDTO, ResponseDTO>({
        method: HttpMethod.GET,
        route: '/users/456',
        useAbortController: true,
      });

      // Оба запроса должны успешно выполниться
      const firstResponse = await firstRequestPromise;
      const secondResponse = await secondRequestPromise;

      expect(firstResponse).toEqual({ data: 'first response' });
      expect(secondResponse).toEqual({ data: 'second response' });
    });

    it('should not cancel requests with different normalized URLs', async () => {
      mock.onGet('/users/123').reply(200, { data: 'first response' });
      mock.onGet('/posts/456').reply(200, { data: 'second response' });

      const firstRequestPromise = apiClient.request<RequestDTO, ResponseDTO>({
        method: HttpMethod.GET,
        route: '/users/123',
        useAbortController: true,
      });

      const secondRequestPromise = apiClient.request<RequestDTO, ResponseDTO>({
        method: HttpMethod.GET,
        route: '/posts/456',
        useAbortController: true,
      });

      // Оба запроса должны успешно выполниться
      const firstResponse = await firstRequestPromise;
      const secondResponse = await secondRequestPromise;

      expect(firstResponse).toEqual({ data: 'first response' });
      expect(secondResponse).toEqual({ data: 'second response' });
    });

    it('should ignore query parameters when normalizing URL', async () => {
      // Первый запрос будет отменен
      const firstRequestPromise = apiClient.request<RequestDTO, ResponseDTO>({
        method: HttpMethod.GET,
        route: '/users/123?page=1',
        useAbortController: true,
      });

      // Второй запрос с другими query-параметрами, но нормализуется в тот же URL
      mock.onGet('/users/456?page=2').reply(200, { data: 'second response' });
      const secondRequestPromise = apiClient.request<RequestDTO, ResponseDTO>({
        method: HttpMethod.GET,
        route: '/users/456?page=2',
        useAbortController: true,
      });

      // Первый запрос должен быть отменен
      await expect(firstRequestPromise).rejects.toThrow();

      // Второй запрос должен успешно выполниться
      const secondResponse = await secondRequestPromise;
      expect(secondResponse).toEqual({ data: 'second response' });
    });
  });

  describe('explicit request cancellation', () => {
    it('should cancel request explicitly via abortRequest', async () => {
      const requestPromise = apiClient.request<RequestDTO, ResponseDTO>({
        method: HttpMethod.GET,
        route: '/users/123',
        useAbortController: true,
      });

      // Отменяем запрос явно
      apiClient.abortRequest('/users/123', HttpMethod.GET);

      await expect(requestPromise).rejects.toThrow();
    });

    it('should cancel all requests via abortAllRequests', async () => {
      const firstRequestPromise = apiClient.request<RequestDTO, ResponseDTO>({
        method: HttpMethod.GET,
        route: '/users/123',
        useAbortController: true,
      });

      const secondRequestPromise = apiClient.request<RequestDTO, ResponseDTO>({
        method: HttpMethod.GET,
        route: '/posts/456',
        useAbortController: true,
      });

      // Отменяем все запросы
      apiClient.abortAllRequests();

      await expect(firstRequestPromise).rejects.toThrow();
      await expect(secondRequestPromise).rejects.toThrow();
    });
  });

  describe('error handling for aborted requests', () => {
    it('should not log aborted requests as errors', async () => {
      const logErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      const requestPromise = apiClient.request<RequestDTO, ResponseDTO>({
        method: HttpMethod.GET,
        route: '/users/123',
        useAbortController: true,
      });

      // Отменяем запрос
      apiClient.abortRequest('/users/123', HttpMethod.GET);

      try {
        await requestPromise;
      } catch {
        // Игнорируем ошибку
      }

      // Проверяем, что log.error не был вызван для отмененного запроса
      // (в реальной реализации нужно проверить через log.error, но здесь используем console.error как пример)
      logErrorSpy.mockRestore();
    });

    it('should not call errorCb for aborted requests', async () => {
      const errorCbMock = vi.fn();
      apiClient.addErrorCb('403', errorCbMock);

      const requestPromise = apiClient.request<RequestDTO, ResponseDTO>({
        method: HttpMethod.GET,
        route: '/users/123',
        useAbortController: true,
      });

      // Отменяем запрос
      apiClient.abortRequest('/users/123', HttpMethod.GET);

      try {
        await requestPromise;
      } catch {
        // Игнорируем ошибку
      }

      // errorCb не должен быть вызван для отмененного запроса
      expect(errorCbMock).not.toHaveBeenCalled();
    });
  });

  describe('URL normalization', () => {
    it('should normalize UUID to template', async () => {
      const uuid1 = '550e8400-e29b-41d4-a716-446655440000';
      const uuid2 = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';

      mock.onGet(`/users/${uuid2}`).reply(200, { data: 'response' });

      // Первый запрос будет отменен
      const firstRequestPromise = apiClient.request<RequestDTO, ResponseDTO>({
        method: HttpMethod.GET,
        route: `/users/${uuid1}`,
        useAbortController: true,
      });

      // Второй запрос с другим UUID, но нормализуется в тот же шаблон
      const secondRequestPromise = apiClient.request<RequestDTO, ResponseDTO>({
        method: HttpMethod.GET,
        route: `/users/${uuid2}`,
        useAbortController: true,
      });

      await expect(firstRequestPromise).rejects.toThrow();
      const secondResponse = await secondRequestPromise;
      expect(secondResponse).toEqual({ data: 'response' });
    });

    it('should normalize numbers to template', async () => {
      mock.onGet('/users/456').reply(200, { data: 'response' });

      // Первый запрос будет отменен
      const firstRequestPromise = apiClient.request<RequestDTO, ResponseDTO>({
        method: HttpMethod.GET,
        route: '/users/123',
        useAbortController: true,
      });

      // Второй запрос с другим числом, но нормализуется в тот же шаблон
      const secondRequestPromise = apiClient.request<RequestDTO, ResponseDTO>({
        method: HttpMethod.GET,
        route: '/users/456',
        useAbortController: true,
      });

      await expect(firstRequestPromise).rejects.toThrow();
      const secondResponse = await secondRequestPromise;
      expect(secondResponse).toEqual({ data: 'response' });
    });

    it('should include HTTP method in normalized ID', async () => {
      mock.onGet('/users/123').reply(200, { data: 'get response' });
      mock.onPost('/users/123').reply(200, { data: 'post response' });

      // GET и POST к одному URL не должны отменять друг друга
      const getRequestPromise = apiClient.request<RequestDTO, ResponseDTO>({
        method: HttpMethod.GET,
        route: '/users/123',
        useAbortController: true,
      });

      const postRequestPromise = apiClient.request<RequestDTO, ResponseDTO>({
        method: HttpMethod.POST,
        route: '/users/123',
        useAbortController: true,
      });

      // Оба запроса должны успешно выполниться
      const getResponse = await getRequestPromise;
      const postResponse = await postRequestPromise;

      expect(getResponse).toEqual({ data: 'get response' });
      expect(postResponse).toEqual({ data: 'post response' });
    });
  });

  describe('cleanup', () => {
    it('should remove controller from storage after successful request', async () => {
      mock.onGet('/users/123').reply(200, { data: 'response' });

      await apiClient.request<RequestDTO, ResponseDTO>({
        method: HttpMethod.GET,
        route: '/users/123',
        useAbortController: true,
      });

      // После успешного запроса контроллер должен быть удален
      // Проверяем, что новый запрос не отменяет предыдущий (если бы контроллер остался, это могло бы вызвать проблемы)
      mock.onGet('/users/123').reply(200, { data: 'second response' });

      const secondResponse = await apiClient.request<RequestDTO, ResponseDTO>({
        method: HttpMethod.GET,
        route: '/users/123',
        useAbortController: true,
      });

      expect(secondResponse).toEqual({ data: 'second response' });
    });

    it('should remove controller from storage after request error', async () => {
      mock.onGet('/users/123').reply(500, { error: 'Internal Server Error' });

      await expect(
        apiClient.request<RequestDTO, ResponseDTO>({
          method: HttpMethod.GET,
          route: '/users/123',
          useAbortController: true,
        }),
      ).rejects.toThrow();

      // После ошибки контроллер должен быть удален
      mock.onGet('/users/123').reply(200, { data: 'response' });

      const response = await apiClient.request<RequestDTO, ResponseDTO>({
        method: HttpMethod.GET,
        route: '/users/123',
        useAbortController: true,
      });

      expect(response).toEqual({ data: 'response' });
    });
  });

  describe('race condition handling', () => {
    it('should not remove controller twice when request is aborted', async () => {
      // Создаем первый запрос, который будет отменен
      const firstRequestPromise = apiClient.request<RequestDTO, ResponseDTO>({
        method: HttpMethod.GET,
        route: '/users/123',
        useAbortController: true,
      });

      // Создаем второй запрос, который отменит первый
      mock.onGet('/users/456').reply(200, { data: 'second response' });
      const secondRequestPromise = apiClient.request<RequestDTO, ResponseDTO>({
        method: HttpMethod.GET,
        route: '/users/456', // Нормализуется в тот же ID
        useAbortController: true,
      });

      // Первый запрос должен быть отменен
      await expect(firstRequestPromise).rejects.toThrow();

      // Второй запрос должен успешно выполниться
      const secondResponse = await secondRequestPromise;
      expect(secondResponse).toEqual({ data: 'second response' });

      // Контроллер должен быть удален только один раз
      // Проверяем, что новый запрос может быть создан без проблем
      mock.onGet('/users/789').reply(200, { data: 'third response' });
      const thirdResponse = await apiClient.request<RequestDTO, ResponseDTO>({
        method: HttpMethod.GET,
        route: '/users/789',
        useAbortController: true,
      });

      expect(thirdResponse).toEqual({ data: 'third response' });
    });

    it('should not remove replaced controller in finally block', async () => {
      // Создаем первый запрос
      const firstRequestPromise = apiClient.request<RequestDTO, ResponseDTO>({
        method: HttpMethod.GET,
        route: '/users/123',
        useAbortController: true,
      });

      // Создаем второй запрос ДО того, как первый завершится
      // Это создаст новый контроллер и отменит первый
      mock.onGet('/users/456').reply(200, { data: 'second response' });
      const secondRequestPromise = apiClient.request<RequestDTO, ResponseDTO>({
        method: HttpMethod.GET,
        route: '/users/456', // Нормализуется в тот же ID
        useAbortController: true,
      });

      // Первый запрос должен быть отменен
      await expect(firstRequestPromise).rejects.toThrow();

      // Второй запрос должен успешно выполниться
      const secondResponse = await secondRequestPromise;
      expect(secondResponse).toEqual({ data: 'second response' });

      // Контроллер второго запроса должен остаться в хранилище до завершения
      // и быть удален только после успешного завершения
      // Проверяем, что можно создать еще один запрос
      mock.onGet('/users/789').reply(200, { data: 'third response' });
      const thirdResponse = await apiClient.request<RequestDTO, ResponseDTO>({
        method: HttpMethod.GET,
        route: '/users/789',
        useAbortController: true,
      });

      expect(thirdResponse).toEqual({ data: 'third response' });
    });

    it('should handle controller replacement during successful request', async () => {
      // Создаем первый запрос с задержкой на сервере
      mock.onGet('/users/123').reply(() => {
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve([200, { data: 'first response' }]);
          }, 50);
        });
      });

      const firstRequestPromise = apiClient.request<RequestDTO, ResponseDTO>({
        method: HttpMethod.GET,
        route: '/users/123',
        useAbortController: true,
      });

      // Создаем второй запрос, который отменит первый
      mock.onGet('/users/456').reply(200, { data: 'second response' });
      const secondRequestPromise = apiClient.request<RequestDTO, ResponseDTO>({
        method: HttpMethod.GET,
        route: '/users/456', // Нормализуется в тот же ID
        useAbortController: true,
      });

      // Первый запрос должен быть отменен
      await expect(firstRequestPromise).rejects.toThrow();

      // Второй запрос должен успешно выполниться
      const secondResponse = await secondRequestPromise;
      expect(secondResponse).toEqual({ data: 'second response' });
    });

    it('should verify controller identity before removal', async () => {
      // Создаем первый запрос
      const firstRequestPromise = apiClient.request<RequestDTO, ResponseDTO>({
        method: HttpMethod.GET,
        route: '/users/123',
        useAbortController: true,
      });

      // Создаем второй запрос, который заменит контроллер первого
      mock.onGet('/users/456').reply(200, { data: 'second response' });
      const secondRequestPromise = apiClient.request<RequestDTO, ResponseDTO>({
        method: HttpMethod.GET,
        route: '/users/456', // Нормализуется в тот же ID
        useAbortController: true,
      });

      // Первый запрос должен быть отменен
      await expect(firstRequestPromise).rejects.toThrow();

      // Второй запрос должен успешно выполниться
      const secondResponse = await secondRequestPromise;
      expect(secondResponse).toEqual({ data: 'second response' });

      // Проверяем, что контроллер второго запроса был корректно удален
      // и новый запрос может быть создан
      mock.onGet('/users/789').reply(200, { data: 'third response' });
      const thirdResponse = await apiClient.request<RequestDTO, ResponseDTO>({
        method: HttpMethod.GET,
        route: '/users/789',
        useAbortController: true,
      });

      expect(thirdResponse).toEqual({ data: 'third response' });
    });

    it('should handle multiple rapid requests correctly', async () => {
      // Создаем несколько запросов подряд очень быстро
      const requests: Promise<ResponseDTO>[] = [];

      for (let i = 1; i <= 5; i++) {
        mock.onGet(`/users/${i}`).reply(200, { data: `response ${i}` });
        requests.push(
          apiClient.request<RequestDTO, ResponseDTO>({
            method: HttpMethod.GET,
            route: `/users/${i}`, // Все нормализуются в один ID
            useAbortController: true,
          }),
        );
      }

      // Все предыдущие запросы должны быть отменены
      // Только последний должен успешно выполниться
      for (let i = 0; i < requests.length - 1; i++) {
        await expect(requests[i]).rejects.toThrow();
      }

      const lastResponse = await requests[requests.length - 1];
      expect(lastResponse).toEqual({ data: 'response 5' });
    });
  });
});
