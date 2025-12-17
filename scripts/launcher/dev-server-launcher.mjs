import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Класс для запуска dev-server
 */
export class DevServerLauncher {
  /**
   * Запускает dev-server параллельно с Vite
   * @return {Object} - Child process dev-server
   */
  async start() {
    const rootDir = path.resolve(__dirname, '../..');
    const devServerDir = path.resolve(rootDir, 'config/dev-server');

    console.log('[DevServerLauncher] Запуск dev-server на порту 1337...');

    // Запускаем dev-server напрямую через tsx, чтобы избежать ошибок npm при SIGINT
    const devProcess = spawn('npx', ['tsx', 'index.ts'], {
      cwd: devServerDir,
      stdio: 'inherit',
      shell: process.platform === 'win32',
    });

    // Обработка завершения процесса
    devProcess.on('close', (code) => {
      // Коды 130 (SIGINT) и 143 (SIGTERM) - нормальное завершение по сигналу
      // null - процесс был убит сигналом
      if (code !== 0 && code !== 130 && code !== 143 && code !== null) {
        console.error(`[DevServerLauncher] Dev-server process exited with code ${code}`);
      }
    });

    devProcess.on('error', (error) => {
      console.error(`[DevServerLauncher] Failed to start dev-server:`, error);
    });

    // Даем время на запуск сервера
    await new Promise((resolve) => setTimeout(resolve, 2000));

    console.log('[DevServerLauncher] Dev-server запущен');

    return devProcess;
  }

  /**
   * Останавливает dev-server
   * @param {Object} process - Child process dev-server
   */
  stop(process) {
    if (process && !process.killed) {
      console.log('[DevServerLauncher] Остановка dev-server...');
      process.kill('SIGTERM');
    }
  }
}

