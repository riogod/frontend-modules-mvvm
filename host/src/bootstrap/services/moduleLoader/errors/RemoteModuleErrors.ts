/**
 * Ошибки загрузки удаленных модулей.
 * @module errors/RemoteModuleErrors
 */

import { log } from '@platform/core';

/** Префикс для логирования */
const LOG_PREFIX = 'moduleLoader.remoteErrors';

/**
 * Ошибка загрузки удаленного модуля.
 *
 * Возникает при неудачной загрузке remote модуля после всех попыток.
 */
export class RemoteModuleLoadError extends Error {
  /** Имя класса ошибки */
  public readonly name = 'RemoteModuleLoadError';

  /**
   * Создает экземпляр ошибки загрузки удаленного модуля.
   *
   * @param moduleName - Имя модуля
   * @param remoteEntry - URL точки входа
   * @param originalError - Оригинальная ошибка
   * @param attempts - Количество попыток загрузки
   */
  constructor(
    public readonly moduleName: string,
    public readonly remoteEntry: string,
    public readonly originalError: Error,
    public readonly attempts: number,
  ) {
    super(
      `Не удалось загрузить удаленный модуль "${moduleName}" из ${remoteEntry}: ${originalError.message}`,
    );

    log.debug(
      `RemoteModuleLoadError: ${moduleName} из ${remoteEntry} после ${attempts} попыток`,
      { prefix: LOG_PREFIX },
    );
  }
}

/**
 * Ошибка таймаута загрузки удаленного модуля.
 *
 * Возникает при превышении времени ожидания загрузки.
 */
export class RemoteModuleTimeoutError extends Error {
  /** Имя класса ошибки */
  public readonly name = 'RemoteModuleTimeoutError';

  /**
   * Создает экземпляр ошибки таймаута.
   *
   * @param moduleName - Имя модуля
   * @param timeout - Время таймаута в миллисекундах
   */
  constructor(
    public readonly moduleName: string,
    public readonly timeout: number,
  ) {
    super(
      `Таймаут загрузки удаленного модуля "${moduleName}" после ${timeout}мс`,
    );

    log.debug(`RemoteModuleTimeoutError: ${moduleName} после ${timeout}мс`, {
      prefix: LOG_PREFIX,
    });
  }
}

/**
 * Ошибка: контейнер Module Federation не найден.
 *
 * Возникает, когда remoteEntry.js загружен, но контейнер не найден в window.
 */
export class RemoteContainerNotFoundError extends Error {
  /** Имя класса ошибки */
  public readonly name = 'RemoteContainerNotFoundError';

  /**
   * Создает экземпляр ошибки отсутствия контейнера.
   *
   * @param scope - Имя scope контейнера
   */
  constructor(public readonly scope: string) {
    super(
      `Контейнер "${scope}" не найден. Убедитесь, что remoteEntry.js загружен корректно.`,
    );

    log.debug(`RemoteContainerNotFoundError: ${scope}`, { prefix: LOG_PREFIX });
  }
}
