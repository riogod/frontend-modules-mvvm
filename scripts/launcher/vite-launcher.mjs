import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Класс для запуска Vite с конфигурацией из манифеста
 */
export class ViteLauncher {
  /**
   * Запускает Vite dev server с указанной конфигурацией
   * @param {Object} config - Конфигурация запуска
   * @param {Object} manifest - Манифест модулей
   * @param {Object} configManager - Менеджер конфигураций для получения настроек
   */
  async start(config, manifest, configManager = null) {
    const rootDir = path.resolve(__dirname, '../..');
    const launcherDir = path.resolve(rootDir, '.launcher');
    const manifestPath = path.resolve(launcherDir, 'current-manifest.json');

    // 1. Создать директорию .launcher если её нет
    fs.mkdirSync(launcherDir, { recursive: true });

    // 2. Сохранить манифест в .launcher/current-manifest.json
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8');

    // 3. Определить локальные модули для ENV
    const localModules = manifest.modules
      .filter((m) => m.remoteEntry === '')
      .map((m) => m.name);

    // 4. Подготовить переменные окружения
    // Приоритет: переменная окружения > настройка из конфига > INFO по умолчанию
    const logLevel = process.env.LOG_LEVEL 
      || (configManager ? configManager.getLogLevel() : 'INFO');

    const env = {
      ...process.env,
      VITE_LOCAL_MODULES: localModules.join(','),
      LOG_LEVEL: logLevel,
    };

    // 5. Запустить Vite
    const viteProcess = spawn('vite', ['--config', 'host/vite.config.mts'], {
      cwd: rootDir,
      env,
      stdio: 'inherit',
      shell: process.platform === 'win32',
    });

    // Обработка завершения процесса
    viteProcess.on('close', (code) => {
      if (code !== 0) {
        console.error(`Vite process exited with code ${code}`);
      }
    });

    return viteProcess;
  }
}

