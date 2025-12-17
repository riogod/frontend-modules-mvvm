/**
 * @fileoverview Константы и перечисления для лаунчера
 */

/**
 * Типы источников модулей
 * @enum {string}
 */
export const ModuleSource = {
  LOCAL: 'local',
  REMOTE: 'remote',
  REMOTE_CUSTOM: 'remote_custom',
  SKIP: 'skip',
};

/**
 * Уровни логирования
 * @enum {string}
 */
export const LogLevel = {
  NONE: 'NONE',
  ERROR: 'ERROR',
  WARN: 'WARN',
  INFO: 'INFO',
  DEBUG: 'DEBUG',
  TRACE: 'TRACE',
};

/**
 * Действия команд
 * @enum {string}
 */
export const CommandAction = {
  CONTINUE: 'continue',
  EXIT: 'exit',
  BACK: 'back',
};

/**
 * Типы пунктов меню
 * @enum {string}
 */
export const MenuItemType = {
  CONFIG: 'config',
  COMMAND: 'command',
};
