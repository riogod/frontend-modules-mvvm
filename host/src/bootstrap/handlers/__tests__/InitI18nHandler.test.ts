import { InitI18nHandler } from '../InitI18nHandler';
import { type Bootstrap } from '../../index';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';

vi.mock('i18next');

export const BootstrapMock: any = {
  i18n: {
    use: vi.fn(),
    init: vi.fn(),
  },
};

vi.mock('i18next');

describe('InitI18nHandler', () => {
  const bootstrap: Bootstrap = BootstrapMock;
  let handler: InitI18nHandler;

  beforeEach(() => {
    handler = new InitI18nHandler({});
    bootstrap.i18n.use = vi.fn().mockReturnValue(bootstrap.i18n);
    bootstrap.i18n.init = vi.fn().mockResolvedValue(undefined);
  });

  test('should initialize i18n with the provided options', async () => {
    await handler.handle(bootstrap);

    expect(bootstrap.i18n.use).toHaveBeenCalledWith(LanguageDetector);
    expect(bootstrap.i18n.use).toHaveBeenCalledWith(initReactI18next);
  });

  test('should call the superclass handle method', async () => {
    const superHandleSpy = vi.spyOn(handler, 'handle');

    await handler.handle(bootstrap);

    expect(superHandleSpy).toHaveBeenCalled();
  });
});
