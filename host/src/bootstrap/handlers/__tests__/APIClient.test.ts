import { type Bootstrap } from '../../index';
import { APIClientHandler } from '../APIClient';

describe('APIClientHandler', () => {
  const bootstrapMock: Bootstrap = {
    initAPIClient: vi.fn(),
  } as any;

  test('должен инициализировать APIClient с apiUrl', async () => {
    const testUrl: string = 'test_url';

    const handler = new APIClientHandler({
      apiUrl: testUrl,
    });

    await handler.handle(bootstrapMock);

    expect(bootstrapMock.initAPIClient).toBeCalledWith(testUrl);
  });

  test('должен выбрасывать ошибку, если apiUrl не определен', async () => {
    const handler = new APIClientHandler({});

    await expect(handler.handle(bootstrapMock)).rejects.toThrow();
  });
});
