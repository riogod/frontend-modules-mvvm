import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * @class DevServerRunner
 * @description Запуск dev-server параллельно с Vite
 */
export class DevServerRunner {
  /**
   * @param {import('./ProcessManager.mjs').ProcessManager} processManager - Менеджер процессов
   * @param {string} [rootDir] - Корневая директория проекта
   */
  constructor(processManager, rootDir = null) {
    this.processManager = processManager;
    this.rootDir = rootDir || path.resolve(__dirname, '../../..');
  }

  /**
   * Запускает dev-server параллельно с Vite
   * @return {Promise<import('child_process').ChildProcess>} - Child process dev-server
   */
  async start() {
    const rootDir = this.rootDir;
    const devServerDir = path.resolve(rootDir, 'config/dev-server');

    console.log('[DevServerRunner] Запуск dev-server на порту 1337...');

    // Запускаем dev-server напрямую через tsx
    const devProcess = spawn('npx', ['tsx', 'index.ts'], {
      cwd: devServerDir,
      stdio: 'inherit',
      shell: process.platform === 'win32',
    });

    // Обработка завершения процесса
    devProcess.on('close', (code) => {
      if (code !== 0 && code !== 130 && code !== 143 && code !== null) {
        console.error(
          `[DevServerRunner] Dev-server process exited with code ${code}`,
        );
      }
    });

    devProcess.on('error', (error) => {
      console.error(`[DevServerRunner] Failed to start dev-server:`, error);
    });

    // Даем время на запуск сервера
    await new Promise((resolve) => setTimeout(resolve, 2000));

    console.log('[DevServerRunner] Dev-server запущен');

    return devProcess;
  }
}
