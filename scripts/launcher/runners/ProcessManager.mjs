/**
 * @fileoverview Менеджер процессов для управления дочерними процессами
 */

/**
 * @class ProcessManager
 * @description Управление дочерними процессами и обработка сигналов
 */
export class ProcessManager {
  constructor() {
    /** @type {Set<import('child_process').ChildProcess>} */
    this.processes = new Set();
    this.signalHandlersRegistered = false;
  }

  /**
   * Регистрирует обработчики сигналов (только один раз)
   */
  registerSignalHandlers() {
    if (this.signalHandlersRegistered) {
      return;
    }

    const cleanup = () => {
      console.log(
        '\n[ProcessManager] Получен сигнал завершения, останавливаем процессы...',
      );
      this.stopAll();
    };

    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);
    this.signalHandlersRegistered = true;
  }

  /**
   * Добавляет процесс в управление
   * @param {import('child_process').ChildProcess} process
   */
  add(process) {
    this.processes.add(process);
    this.registerSignalHandlers();
  }

  /**
   * Удаляет процесс из управления
   * @param {import('child_process').ChildProcess} process
   */
  remove(process) {
    this.processes.delete(process);
  }

  /**
   * Останавливает процесс
   * @param {import('child_process').ChildProcess} process
   */
  stop(process) {
    if (process && !process.killed) {
      try {
        process.kill('SIGTERM');
      } catch (error) {
        // Игнорируем ошибки при остановке
      }
    }
    this.remove(process);
  }

  /**
   * Останавливает все процессы
   */
  stopAll() {
    for (const proc of this.processes) {
      this.stop(proc);
    }
  }
}
