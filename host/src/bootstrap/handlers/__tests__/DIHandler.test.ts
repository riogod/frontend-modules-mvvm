import { type Bootstrap } from '../../index';
import { DIHandler } from '../DIHandler';

describe('DIHandler', () => {
  const bootstrapMock: Bootstrap = {
    initDI: vi.fn(),
  } as any;

  test('должен вызывать метод initDI bootstrap', async () => {
    const handler = new DIHandler({});

    await handler.handle(bootstrapMock);

    expect(bootstrapMock.initDI).toBeCalled();
  });
});
