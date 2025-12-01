import { AbstractInitHandler } from './AbstractInitHandler';
import { type Bootstrap } from '../index';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { log } from '@platform/core';

/**
 * Обработчик инициализации i18n для языковых пакетов приложения.
 */
export class InitI18nHandler extends AbstractInitHandler {
  async handle(bootstrap: Bootstrap): Promise<Bootstrap> {
    log.debug('InitI18nHandler: starting', {
      prefix: 'bootstrap.handlers.InitI18nHandler',
    });
    const bootstrapI18n = bootstrap.i18n;
    bootstrapI18n.use(LanguageDetector);
    bootstrapI18n.use(initReactI18next);
    if (this.params.i18nOptions) {
      log.debug('InitI18nHandler: initializing i18n with options', {
        prefix: 'bootstrap.handlers.InitI18nHandler',
      });
      await bootstrapI18n.init(this.params.i18nOptions);
      log.debug('InitI18nHandler: i18n initialized', {
        prefix: 'bootstrap.handlers.InitI18nHandler',
      });
    }

    log.debug('InitI18nHandler: completed', {
      prefix: 'bootstrap.handlers.InitI18nHandler',
    });
    return await super.handle(bootstrap);
  }
}
