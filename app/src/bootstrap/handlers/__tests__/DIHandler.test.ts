import { Bootstrap } from '../../index.ts';
import { DIHandler } from '../DIHandler.ts';

describe('DIHandler', () => {
  const bootstrapMock: Bootstrap = {
    initDI: vi.fn(),
  } as any;

  test('should call initDI bootstrap method', async () => {
    const handler = new DIHandler({});

    await handler.handle(bootstrapMock);

    expect(bootstrapMock.initDI).toBeCalled();
  });
});
