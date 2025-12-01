import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Класс для запуска proxy-server
 */
export class ProxyServerLauncher {
  /**
   * Запускает proxy-server параллельно с Vite
   * @return {Object} - Child process proxy-server
   */
  async start() {
    const rootDir = path.resolve(__dirname, '../..');
    const proxyServerDir = path.resolve(rootDir, 'config/proxy-server');

    console.log('[ProxyServerLauncher] Запуск proxy-server на порту 1337...');

    // Запускаем proxy-server напрямую через tsx, чтобы избежать ошибок npm при SIGINT
    const proxyProcess = spawn('npx', ['tsx', 'index.ts'], {
      cwd: proxyServerDir,
      stdio: 'inherit',
      shell: process.platform === 'win32',
    });

    // Обработка завершения процесса
    proxyProcess.on('close', (code) => {
      // Коды 130 (SIGINT) и 143 (SIGTERM) - нормальное завершение по сигналу
      // null - процесс был убит сигналом
      if (code !== 0 && code !== 130 && code !== 143 && code !== null) {
        console.error(`[ProxyServerLauncher] Proxy-server process exited with code ${code}`);
      }
    });

    proxyProcess.on('error', (error) => {
      console.error(`[ProxyServerLauncher] Failed to start proxy-server:`, error);
    });

    // Даем время на запуск сервера
    await new Promise((resolve) => setTimeout(resolve, 2000));

    console.log('[ProxyServerLauncher] Proxy-server запущен');

    return proxyProcess;
  }

  /**
   * Останавливает proxy-server
   * @param {Object} process - Child process proxy-server
   */
  stop(process) {
    if (process && !process.killed) {
      console.log('[ProxyServerLauncher] Остановка proxy-server...');
      process.kill('SIGTERM');
    }
  }
}

