import { type Bootstrap } from '../../index';
import { APIClientHandler } from '../APIClient';

describe('APIClientHandler', () => {
  const bootstrapMock: Bootstrap = {
    initAPIClient: vi.fn(),
  } as any;

  test('should initialize APIClient with apiUrl', async () => {
    const testUrl: string = 'test_url';

    const handler = new APIClientHandler({
      apiUrl: testUrl,
    });

    await handler.handle(bootstrapMock);

    expect(bootstrapMock.initAPIClient).toBeCalledWith(testUrl);
  });

  test('should throw error if apiUrl is not defined', async () => {
    const handler = new APIClientHandler({});

    await expect(handler.handle(bootstrapMock)).rejects.toThrow();
  });
});
