import { AbstractInitHandler } from './AbstractInitHandler';
import { Bootstrap } from '../index.ts';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

/**
 * Обработчик инициализации i18n для языковых пакетов приложения.
 */
export class InitI18nHandler extends AbstractInitHandler {
  async handle(bootstrap: Bootstrap): Promise<Bootstrap> {
    const bootstrapI18n = bootstrap.i18n;
    bootstrapI18n.use(LanguageDetector);
    bootstrapI18n.use(initReactI18next);
    if (this.params.i18nOptions) {
      await bootstrapI18n.init(this.params.i18nOptions);
    }

    return await super.handle(bootstrap);
  }
}
