import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { log, createLogger, LogLevel } from '../index';

describe('Logger', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;
  let consoleInfoSpy: ReturnType<typeof vi.spyOn>;
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  let consoleTraceSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    log.setConfig({ level: LogLevel.TRACE });
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
    // DEBUG уровень использует console.log, а не console.debug (см. Logger.ts:239-256)
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleTraceSpy = vi.spyOn(console, 'trace').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    log.setConfig({ level: LogLevel.INFO }); // Сброс к дефолтным настройкам
  });

  describe('log.error', () => {
    it('должен выводить сообщение об ошибке', () => {
      log.error('Test error');
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('log.warn', () => {
    it('должен выводить предупреждение', () => {
      log.warn('Test warning');
      expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('log.info', () => {
    it('должен выводить информационное сообщение', () => {
      log.info('Test info');
      expect(consoleInfoSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('log.debug', () => {
    it('должен выводить отладочное сообщение', () => {
      log.debug('Test debug');
      // DEBUG уровень использует console.log, а не console.debug
      expect(consoleLogSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('log.trace', () => {
    it('должен выводить трассировочное сообщение', () => {
      log.trace('Test trace');
      expect(consoleTraceSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('log.setLevel', () => {
    it('должен фильтровать сообщения ниже установленного уровня', () => {
      log.setLevel(LogLevel.WARN);
      log.info('This should not be logged');
      log.warn('This should be logged');
      log.error('This should be logged');

      expect(consoleInfoSpy).not.toHaveBeenCalled();
      expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    });

    it('должен отключать все логирование при уровне NONE', () => {
      log.setLevel(LogLevel.NONE);
      log.error('This should not be logged');
      log.warn('This should not be logged');
      log.info('This should not be logged');
      log.debug('This should not be logged');
      log.trace('This should not be logged');

      expect(consoleErrorSpy).not.toHaveBeenCalled();
      expect(consoleWarnSpy).not.toHaveBeenCalled();
      expect(consoleInfoSpy).not.toHaveBeenCalled();
      expect(consoleLogSpy).not.toHaveBeenCalled();
      expect(consoleTraceSpy).not.toHaveBeenCalled();
    });
  });

  describe('createLogger', () => {
    it('должен создавать логгер с кастомной конфигурацией', () => {
      const logger = createLogger({ prefix: 'MyApp', level: LogLevel.INFO });
      logger.info('Test message');
      expect(consoleInfoSpy).toHaveBeenCalledWith(
        expect.stringContaining('[INFO]')
      );
    });

    it('должен использовать независимую конфигурацию', () => {
      const logger1 = createLogger({ level: LogLevel.ERROR });
      const logger2 = createLogger({ level: LogLevel.DEBUG });

      logger1.info('Should not be logged');
      logger2.info('Should be logged');

      expect(consoleInfoSpy).toHaveBeenCalledTimes(1);
    });

    it('должен отключать все логирование при уровне NONE', () => {
      const logger = createLogger({ level: LogLevel.NONE });
      logger.error('This should not be logged');
      logger.warn('This should not be logged');
      logger.info('This should not be logged');
      logger.debug('This should not be logged');
      logger.trace('This should not be logged');

      expect(consoleErrorSpy).not.toHaveBeenCalled();
      expect(consoleWarnSpy).not.toHaveBeenCalled();
      expect(consoleInfoSpy).not.toHaveBeenCalled();
      expect(consoleLogSpy).not.toHaveBeenCalled();
      expect(consoleTraceSpy).not.toHaveBeenCalled();
    });
  });

  describe('log.setConfig', () => {
    it('должен обновлять конфигурацию логгера', () => {
      log.setConfig({ prefix: 'MyApp', level: LogLevel.INFO });
      log.info('Test message');
      expect(consoleInfoSpy).toHaveBeenCalledWith(
        expect.stringContaining('[INFO]')
      );
    });
  });
});
