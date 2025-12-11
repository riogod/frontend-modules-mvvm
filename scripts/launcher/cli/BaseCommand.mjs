/**
 * @fileoverview Базовый класс для всех команд меню
 */

/**
 * @abstract
 * @class BaseCommand
 * @description Базовый класс для всех команд меню
 */
export class BaseCommand {
  /**
   * @param {Object} context - Контекст лаунчера
   */
  constructor(context) {
    this.context = context;
  }

  /**
   * Уникальный идентификатор команды
   * @returns {string}
   * @abstract
   */
  get id() {
    throw new Error('Метод id должен быть реализован');
  }

  /**
   * Заголовок для отображения в меню
   * @returns {string}
   * @abstract
   */
  get title() {
    throw new Error('Метод title должен быть реализован');
  }

  /**
   * Порядок отображения в меню (меньше = выше)
   * @returns {number}
   */
  get order() {
    return 100;
  }

  /**
   * Показывать ли команду в главном меню
   * @returns {boolean}
   */
  isVisible() {
    return true;
  }

  /**
   * Выполняет команду
   * @param {Object} [params] - Параметры команды
   * @returns {Promise<{action: string, [key: string]: any}>}
   * @abstract
   */
  async execute(params = {}) {
    throw new Error('Метод execute должен быть реализован');
  }
}
