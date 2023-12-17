import { Bootstrap } from '../../index.ts';
import { ClientHashHandler } from '../ClientHashHandler.ts';

const localStorageMock: Storage = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: vi.fn((key: string): string => store[key] ?? null),
    setItem: vi.fn((key: string, value: string): void => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string): void => {
      delete store[key];
    }),
    clear: vi.fn((): void => {
      store = {};
    }),
    key: vi.fn((_index: number): string | null => ''),
    length: Object.keys(store).length,
  };
})();

describe('ClientHashHandler', () => {
  localStorage = localStorageMock;
  const bootstrapMock: Bootstrap = {
    getAPIClient: {
      genearateDeviceId: vi.fn().mockResolvedValue('UUID_TEST'),
    },
  } as any;

  test('should generate device id if D_UUID not exist in localStorage', async () => {
    const handler = new ClientHashHandler({});

    await handler.handle(bootstrapMock);

    expect(localStorage.getItem).toBeCalled();
    expect(localStorage.setItem).toBeCalled();
    expect(bootstrapMock.getAPIClient.genearateDeviceId).toBeCalled();
    expect(localStorage.getItem('D_UUID')).toBe('UUID_TEST');
  });
});
