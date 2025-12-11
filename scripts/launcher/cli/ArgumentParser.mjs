/**
 * @fileoverview Парсинг аргументов командной строки
 */

/**
 * @class ArgumentParser
 * @description Парсинг аргументов командной строки для CLI лаунчера
 */
export class ArgumentParser {
  /**
   * Парсит аргументы командной строки
   * @param {string[]} args - Аргументы командной строки
   * @returns {Object} Объект с распарсенными аргументами
   */
  static parse(args) {
    const result = {
      configName: null,
      last: false,
      createModule: false,
    };

    for (let i = 0; i < args.length; i++) {
      if (args[i] === '--config' || args[i] === '-c') {
        result.configName = args[i + 1] || null;
        i++;
      } else if (args[i].startsWith('--config=')) {
        result.configName = args[i].split('=')[1];
      } else if (args[i] === '--last' || args[i] === '-l') {
        result.last = true;
      } else if (args[i] === '--create-module') {
        result.createModule = true;
      }
    }

    return result;
  }
}
