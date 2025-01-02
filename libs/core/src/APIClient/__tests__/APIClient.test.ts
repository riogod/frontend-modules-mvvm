import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { APIClient } from '../index';
import { HttpMethod } from '../enums';
import MockAdapter from 'axios-mock-adapter';
import { AxiosError } from 'axios';

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

  describe('genearateDeviceId function', () => {
    it('should generate a device ID', async () => {
      // Testing the successful generation of a device ID
      const deviceId = await apiClient.genearateDeviceId();
      expect(deviceId).toBeTruthy();
      expect(typeof deviceId).toBe('string');
    });

    it('should not throw any errors', async () => {
      // Testing that the function does not throw any errors
      await expect(apiClient.genearateDeviceId()).resolves.not.toThrow();
    });
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
  });
});
