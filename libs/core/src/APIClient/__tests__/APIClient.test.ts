import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { APIClient } from '../index';
import { HttpMethod } from '../enums';
import MockAdapter from 'axios-mock-adapter';
import { AxiosError } from 'axios';
import { z } from 'zod';

interface RequestDTO {
  foo: string;
}

interface ResponseDTO {
  data: string;
}

describe('APIClient', () => {
  let apiClient: APIClient;
  let mock: MockAdapter;
  const cbMock = vi.fn();

  beforeEach(() => {
    apiClient = new APIClient('http://example.com');
    mock = new MockAdapter(apiClient.api);

    apiClient.addErrorCb('403', cbMock);
  });

  afterEach(() => {
    mock.reset();
  });

  describe('addErrorCb', () => {
    it('should add an error callback to the errorCb map', () => {
      const id = '500';
      const cb = (error: AxiosError) => console.log(error);

      apiClient.addErrorCb(id, cb);

      expect(apiClient.errorCb.get(id)).toBe(cb);
    });
  });

  describe('request function', () => {
    it('should make a successful request', async () => {
      const responseData = { data: 'example response' };
      mock.onGet('/example').reply(200, responseData);

      const response = await apiClient.request<RequestDTO, ResponseDTO>({
        method: HttpMethod.GET,
        route: '/example',
      });
      expect(response).toEqual(responseData);
    });

    it('should handle request errors and call the error callback', async () => {
      mock.onGet('/example').reply(403, { success: false });

      await expect(
        apiClient.request<RequestDTO, ResponseDTO>({
          method: HttpMethod.GET,
          route: '/example',
        }),
      ).rejects.toThrowError();

      expect(cbMock).toHaveBeenCalled();
    });

    describe('validation schema', () => {
      const requestSchema = z.object({
        foo: z.string(),
      });

      const responseSchema = z.object({
        data: z.string(),
      });

      it('should validate request schema successfully', async () => {
        const validRequest = { foo: 'bar' };
        const responseData = { data: 'example response' };
        mock.onPost('/example').reply(200, responseData);

        const response = await apiClient.request<RequestDTO, ResponseDTO>({
          method: HttpMethod.POST,
          route: '/example',
          requestObj: validRequest,
          validationSchema: {
            request: requestSchema,
          },
        });

        expect(response).toEqual(responseData);
      });

      it('should reject request with invalid request schema', async () => {
        const invalidRequest = { foo: 123 }; // should be string
        mock.onPost('/example').reply(200, { data: 'example response' });

        await expect(
          apiClient.request<RequestDTO, ResponseDTO>({
            method: HttpMethod.POST,
            route: '/example',
            requestObj: invalidRequest as unknown as RequestDTO,
            validationSchema: {
              request: requestSchema,
            },
          }),
        ).rejects.toBeInstanceOf(z.ZodError);
      });

      it('should validate response schema successfully', async () => {
        const validResponse = { data: 'example response' };
        mock.onGet('/example').reply(200, validResponse);

        const response = await apiClient.request<RequestDTO, ResponseDTO>({
          method: HttpMethod.GET,
          route: '/example',
          validationSchema: {
            response: responseSchema,
          },
        });

        expect(response).toEqual(validResponse);
      });

      it('should reject response with invalid response schema', async () => {
        const invalidResponse = { data: 123 }; // should be string
        mock.onGet('/example').reply(200, invalidResponse);

        await expect(
          apiClient.request<RequestDTO, ResponseDTO>({
            method: HttpMethod.GET,
            route: '/example',
            validationSchema: {
              response: responseSchema,
            },
          }),
        ).rejects.toBeInstanceOf(z.ZodError);
      });

      it('should validate both request and response schemas', async () => {
        const validRequest = { foo: 'bar' };
        const validResponse = { data: 'example response' };
        mock.onPost('/example').reply(200, validResponse);

        const response = await apiClient.request<RequestDTO, ResponseDTO>({
          method: HttpMethod.POST,
          route: '/example',
          requestObj: validRequest,
          validationSchema: {
            request: requestSchema,
            response: responseSchema,
          },
        });

        expect(response).toEqual(validResponse);
      });

      it('should work without validation schema', async () => {
        const responseData = { data: 'example response' };
        mock.onGet('/example').reply(200, responseData);

        const response = await apiClient.request<RequestDTO, ResponseDTO>({
          method: HttpMethod.GET,
          route: '/example',
        });

        expect(response).toEqual(responseData);
      });
    });
  });
});
