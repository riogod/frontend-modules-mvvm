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
    // Манифест всегда генерируется заново при каждом запуске конфигурации,
    // поэтому мы всегда перезаписываем файл актуальными данными
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8');
    console.log(
      `[ViteLauncher] Манифест сохранен: ${manifest.modules.length} модулей, ` +
        `${Object.keys(manifest.data?.features || {}).length} features, ` +
        `${Object.keys(manifest.data?.permissions || {}).length} permissions, ` +
        `${Object.keys(manifest.data?.params || {}).length} params`,
    );

    // 3. Определить локальные модули для ENV
    const localModules = manifest.modules
      .filter((m) => m.remoteEntry === '')
      .map((m) => m.name);

    // 4. Подготовить переменные окружения
    // Приоритет: переменная окружения > настройка из конфигурации > значение по умолчанию
    // Получаем настройки из конфигурации (config.settings)
    const configSettings = config.settings || {};
    const logLevel = process.env.LOG_LEVEL 
      || configSettings.logLevel 
      || 'INFO';

    // Настройка использования моков
    const useLocalMocks = process.env.VITE_USE_LOCAL_MOCKS !== undefined
      ? process.env.VITE_USE_LOCAL_MOCKS === 'true'
      : (configSettings.useLocalMocks !== undefined ? configSettings.useLocalMocks : true);

    // Настройка API URL (используется, если моки отключены)
    const apiUrl = process.env.VITE_API_URL
      || (configSettings.apiUrl || '');

    const env = {
      ...process.env,
      VITE_LOCAL_MODULES: localModules.join(','),
      LOG_LEVEL: logLevel,
      VITE_USE_LOCAL_MOCKS: String(useLocalMocks),
    };

    // Добавляем API URL только если он задан
    if (apiUrl) {
      env.VITE_API_URL = apiUrl;
    }

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

