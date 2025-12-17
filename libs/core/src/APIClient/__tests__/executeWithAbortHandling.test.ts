import { describe, it, expect, beforeEach, vi } from 'vitest';
import { executeWithAbortHandling } from '../executeWithAbortHandling';
import axios from 'axios';

describe('executeWithAbortHandling', () => {
  let mockSetData: ReturnType<typeof vi.fn>;
  let mockSetLoading: ReturnType<typeof vi.fn>;
  let mockGetPreviousData: ReturnType<typeof vi.fn>;
  let mockOnError: ReturnType<typeof vi.fn>;
  let requestIdTracker: { current: number };

  beforeEach(() => {
    mockSetData = vi.fn();
    mockSetLoading = vi.fn();
    mockGetPreviousData = vi.fn(() => null);
    mockOnError = vi.fn();
    requestIdTracker = { current: 0 };
  });

  describe('successful request', () => {
    it('should set loading to true, execute request, set data, and set loading to false', async () => {
      const mockRequestFn = vi.fn().mockResolvedValue({ data: 'test' });

      await executeWithAbortHandling({
        requestFn: mockRequestFn,
        getPreviousData: mockGetPreviousData,
        setData: mockSetData,
        setLoading: mockSetLoading,
        requestIdTracker,
      });

      expect(mockSetLoading).toHaveBeenCalledWith(true);
      expect(mockRequestFn).toHaveBeenCalled();
      expect(mockSetData).toHaveBeenCalledWith({ data: 'test' });
      expect(mockSetLoading).toHaveBeenCalledWith(false);
    });

    it('should not set data if request is outdated', async () => {
      const mockRequestFn = vi.fn(
        () =>
          new Promise((resolve) => {
            setTimeout(() => resolve({ data: 'old' }), 100);
          }),
      );

      const promise1 = executeWithAbortHandling({
        requestFn: mockRequestFn,
        getPreviousData: mockGetPreviousData,
        setData: mockSetData,
        setLoading: mockSetLoading,
        requestIdTracker,
      });

      const mockRequestFn2 = vi.fn().mockResolvedValue({ data: 'new' });

      const promise2 = executeWithAbortHandling({
        requestFn: mockRequestFn2,
        getPreviousData: mockGetPreviousData,
        setData: mockSetData,
        setLoading: mockSetLoading,
        requestIdTracker,
      });

      await promise2;
      await promise1;

      expect(mockSetData).toHaveBeenCalledWith({ data: 'new' });
      expect(mockSetData).not.toHaveBeenCalledWith({ data: 'old' });
    });
  });

  describe('aborted request', () => {
    it('should restore previous data when request is aborted and previous data exists', async () => {
      const previousData = { data: 'previous' };
      mockGetPreviousData = vi.fn(() => previousData);

      const abortError = new Error('Request aborted');
      abortError.name = 'AbortError';
      const mockRequestFn = vi.fn().mockRejectedValue(abortError);

      await executeWithAbortHandling({
        requestFn: mockRequestFn,
        getPreviousData: mockGetPreviousData,
        setData: mockSetData,
        setLoading: mockSetLoading,
        requestIdTracker,
      });

      expect(mockSetData).toHaveBeenCalledWith(previousData);
      expect(mockSetLoading).toHaveBeenCalledWith(true);
      expect(mockSetLoading).toHaveBeenCalledWith(false);
      expect(mockOnError).not.toHaveBeenCalled();
    });

    it('should not restore previous data when request is aborted but no previous data', async () => {
      mockGetPreviousData = vi.fn(() => null);

      const abortError = new Error('Request aborted');
      abortError.name = 'AbortError';
      const mockRequestFn = vi.fn().mockRejectedValue(abortError);

      await executeWithAbortHandling({
        requestFn: mockRequestFn,
        getPreviousData: mockGetPreviousData,
        setData: mockSetData,
        setLoading: mockSetLoading,
        requestIdTracker,
      });

      expect(mockSetData).not.toHaveBeenCalled();
      expect(mockSetLoading).not.toHaveBeenCalledWith(false);
    });

    it('should handle axios AbortError (ERR_CANCELED)', async () => {
      const previousData = { data: 'previous' };
      mockGetPreviousData = vi.fn(() => previousData);

      const axiosError = {
        code: 'ERR_CANCELED',
        name: 'CanceledError',
        message: 'canceled',
        isAxiosError: true,
      };
      const mockRequestFn = vi.fn().mockRejectedValue(axiosError);

      await executeWithAbortHandling({
        requestFn: mockRequestFn,
        getPreviousData: mockGetPreviousData,
        setData: mockSetData,
        setLoading: mockSetLoading,
        requestIdTracker,
      });

      expect(mockSetData).toHaveBeenCalledWith(previousData);
      expect(mockOnError).not.toHaveBeenCalled();
    });

    it('should not call onError for aborted requests', async () => {
      const abortError = new Error('Request aborted');
      abortError.name = 'AbortError';
      const mockRequestFn = vi.fn().mockRejectedValue(abortError);

      await executeWithAbortHandling({
        requestFn: mockRequestFn,
        getPreviousData: mockGetPreviousData,
        setData: mockSetData,
        setLoading: mockSetLoading,
        onError: mockOnError,
        requestIdTracker,
      });

      expect(mockOnError).not.toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should call onError for non-aborted errors', async () => {
      const error = new Error('Network error');
      const mockRequestFn = vi.fn().mockRejectedValue(error);

      await expect(
        executeWithAbortHandling({
          requestFn: mockRequestFn,
          getPreviousData: mockGetPreviousData,
          setData: mockSetData,
          setLoading: mockSetLoading,
          onError: mockOnError,
          requestIdTracker,
        }),
      ).rejects.toThrow('Network error');

      expect(mockOnError).toHaveBeenCalledWith(error);
      expect(mockSetLoading).toHaveBeenCalledWith(false);
    });

    it('should set loading to false on error', async () => {
      const error = new Error('Network error');
      const mockRequestFn = vi.fn().mockRejectedValue(error);

      await expect(
        executeWithAbortHandling({
          requestFn: mockRequestFn,
          getPreviousData: mockGetPreviousData,
          setData: mockSetData,
          setLoading: mockSetLoading,
          requestIdTracker,
        }),
      ).rejects.toThrow();

      expect(mockSetLoading).toHaveBeenCalledWith(false);
    });
  });

  describe('requestIdTracker', () => {
    it('should use provided requestIdTracker', async () => {
      const customTracker = { current: 5 };
      const mockRequestFn = vi.fn().mockResolvedValue({ data: 'test' });

      await executeWithAbortHandling({
        requestFn: mockRequestFn,
        getPreviousData: mockGetPreviousData,
        setData: mockSetData,
        setLoading: mockSetLoading,
        requestIdTracker: customTracker,
      });

      expect(customTracker.current).toBe(6);
    });

    it('should create new tracker if not provided', async () => {
      const mockRequestFn = vi.fn().mockResolvedValue({ data: 'test' });

      await executeWithAbortHandling({
        requestFn: mockRequestFn,
        getPreviousData: mockGetPreviousData,
        setData: mockSetData,
        setLoading: mockSetLoading,
      });

      expect(mockSetData).toHaveBeenCalledWith({ data: 'test' });
    });
  });

  describe('loading state management', () => {
    it('should set loading to false only for current request when aborted without previous data', async () => {
      mockGetPreviousData = vi.fn(() => null);

      const abortError = new Error('Request aborted');
      abortError.name = 'AbortError';
      const mockRequestFn = vi.fn().mockRejectedValue(abortError);

      await executeWithAbortHandling({
        requestFn: mockRequestFn,
        getPreviousData: mockGetPreviousData,
        setData: mockSetData,
        setLoading: mockSetLoading,
        requestIdTracker,
      });

      expect(mockSetLoading).toHaveBeenCalledWith(true);
      expect(mockSetLoading).not.toHaveBeenCalledWith(false);
    });

    it('should set loading to false when aborted with previous data', async () => {
      const previousData = { data: 'previous' };
      mockGetPreviousData = vi.fn(() => previousData);

      const abortError = new Error('Request aborted');
      abortError.name = 'AbortError';
      const mockRequestFn = vi.fn().mockRejectedValue(abortError);

      await executeWithAbortHandling({
        requestFn: mockRequestFn,
        getPreviousData: mockGetPreviousData,
        setData: mockSetData,
        setLoading: mockSetLoading,
        requestIdTracker,
      });

      expect(mockSetLoading).toHaveBeenCalledWith(true);
      expect(mockSetLoading).toHaveBeenCalledWith(false);
    });

    it('should not set loading to false for outdated requests', async () => {
      const slowRequestFn = vi.fn(
        () =>
          new Promise((resolve) => {
            setTimeout(() => resolve({ data: 'slow' }), 100);
          }),
      );

      const promise1 = executeWithAbortHandling({
        requestFn: slowRequestFn,
        getPreviousData: mockGetPreviousData,
        setData: mockSetData,
        setLoading: mockSetLoading,
        requestIdTracker,
      });

      const fastRequestFn = vi.fn().mockResolvedValue({ data: 'fast' });

      const promise2 = executeWithAbortHandling({
        requestFn: fastRequestFn,
        getPreviousData: mockGetPreviousData,
        setData: mockSetData,
        setLoading: mockSetLoading,
        requestIdTracker,
      });

      await promise2;
      await promise1;

      const loadingCalls = mockSetLoading.mock.calls;
      const lastLoadingCall = loadingCalls[loadingCalls.length - 1];
      expect(lastLoadingCall[0]).toBe(false);
    });
  });

  describe('race conditions', () => {
    it('should handle multiple rapid requests correctly', async () => {
      const requests: Promise<void>[] = [];

      for (let i = 1; i <= 5; i++) {
        const requestFn = vi.fn().mockResolvedValue({ data: `response ${i}` });
        requests.push(
          executeWithAbortHandling({
            requestFn,
            getPreviousData: mockGetPreviousData,
            setData: mockSetData,
            setLoading: mockSetLoading,
            requestIdTracker,
          }),
        );
      }

      await Promise.all(requests);

      expect(mockSetData).toHaveBeenCalledTimes(1);
      expect(mockSetData).toHaveBeenCalledWith({ data: 'response 5' });
    });

    it('should ignore results from outdated requests', async () => {
      const slowRequestFn = vi.fn(
        () =>
          new Promise((resolve) => {
            setTimeout(() => resolve({ data: 'outdated' }), 200);
          }),
      );

      const promise1 = executeWithAbortHandling({
        requestFn: slowRequestFn,
        getPreviousData: mockGetPreviousData,
        setData: mockSetData,
        setLoading: mockSetLoading,
        requestIdTracker,
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      const fastRequestFn = vi.fn().mockResolvedValue({ data: 'current' });

      const promise2 = executeWithAbortHandling({
        requestFn: fastRequestFn,
        getPreviousData: mockGetPreviousData,
        setData: mockSetData,
        setLoading: mockSetLoading,
        requestIdTracker,
      });

      await promise2;
      await promise1;

      expect(mockSetData).toHaveBeenCalledWith({ data: 'current' });
      expect(mockSetData).not.toHaveBeenCalledWith({ data: 'outdated' });
    });
  });
});
