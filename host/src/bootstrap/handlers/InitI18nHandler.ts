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
    
    // Проверяем базовые методы i18next (addResourceBundle появляется только после init)
    const hasInit = typeof bootstrapI18n?.init === 'function';
    const hasUse = typeof bootstrapI18n?.use === 'function';
    log.debug(
      `InitI18nHandler: bootstrap.i18n type: ${typeof bootstrapI18n}, hasInit: ${hasInit}, hasUse: ${hasUse}, constructor: ${bootstrapI18n?.constructor?.name}`,
      { prefix: 'bootstrap.handlers.InitI18nHandler' },
    );

    if (!hasInit || !hasUse) {
      log.error(
        `bootstrap.i18n is not a valid i18next instance! Expected init and use methods.`,
        {
          prefix: 'bootstrap.handlers.InitI18nHandler',
          i18nType: typeof bootstrapI18n,
          i18nConstructor: bootstrapI18n?.constructor?.name,
        },
      );
      throw new Error(
        `bootstrap.i18n is not a valid i18next instance. Missing init or use method.`,
      );
    }

    bootstrapI18n.use(LanguageDetector);
    bootstrapI18n.use(initReactI18next);
    if (this.params.i18nOptions) {
      log.debug('InitI18nHandler: initializing i18n with options', {
        prefix: 'bootstrap.handlers.InitI18nHandler',
      });
      await bootstrapI18n.init(this.params.i18nOptions);
      
      // Проверяем addResourceBundle после инициализации
      const hasAddResourceBundle =
        typeof bootstrapI18n?.addResourceBundle === 'function';
      log.debug(
        `InitI18nHandler: after init, hasAddResourceBundle: ${hasAddResourceBundle}`,
        { prefix: 'bootstrap.handlers.InitI18nHandler' },
      );
      
      if (!hasAddResourceBundle) {
        log.error(
          `bootstrap.i18n does not have addResourceBundle after init!`,
          {
            prefix: 'bootstrap.handlers.InitI18nHandler',
          },
        );
        throw new Error(
          `bootstrap.i18n does not have addResourceBundle after init.`,
        );
      }
      
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
