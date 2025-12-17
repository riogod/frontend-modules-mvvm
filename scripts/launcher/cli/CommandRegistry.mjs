/**
 * @fileoverview Реестр команд для главного меню
 */

/**
 * @class CommandRegistry
 * @description Реестр команд для главного меню
 */
export class CommandRegistry {
  constructor() {
    /** @type {Map<string, BaseCommand>} */
    this.commands = new Map();
  }

  /**
   * Регистрирует команду
   * @param {BaseCommand} command - Экземпляр команды
   */
  register(command) {
    if (!command.id) {
      throw new Error('Команда должна иметь id');
    }
    this.commands.set(command.id, command);
  }

  /**
   * Получает список команд для меню, отсортированный по order
   * @returns {BaseCommand[]}
   */
  getMenuCommands() {
    return Array.from(this.commands.values())
      .filter((cmd) => cmd.isVisible())
      .sort((a, b) => a.order - b.order);
  }

  /**
   * Получает команду по ID
   * @param {string} id - Идентификатор команды
   * @returns {BaseCommand|undefined}
   */
  get(id) {
    return this.commands.get(id);
  }

  /**
   * Выполняет команду по ID
   * @param {string} id - Идентификатор команды
   * @param {Object} [params] - Параметры команды
   * @returns {Promise<{action: string, [key: string]: any}>}
   */
  async execute(id, params = {}) {
    const command = this.commands.get(id);
    if (!command) {
      throw new Error(`Команда "${id}" не найдена`);
    }
    return command.execute(params);
  }
}
