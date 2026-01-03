import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { ProcessManager } from './ProcessManager.mjs';
import { DevServerRunner } from './DevServerRunner.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * @class ViteRunner
 * @description Запуск Vite dev server с конфигурацией из манифеста
 */
export class ViteRunner {
  /**
   * @param {string} [rootDir] - Корневая директория проекта
   */
  constructor(rootDir = null) {
    this.rootDir = rootDir || path.resolve(__dirname, '../../..');
    this.processManager = new ProcessManager();
    this.devServerRunner = new DevServerRunner(
      this.processManager,
      this.rootDir,
    );
  }

  /**
   * Запускает Vite dev server с указанной конфигурацией
   * @param {Object} config - Конфигурация запуска
   * @param {Object} manifest - Манифест модулей
   * @param {Object} configRepository - Репозиторий конфигураций для получения настроек
   */
  async start(config, manifest, configRepository = null) {
    const rootDir = this.rootDir;
    const launcherDir = path.resolve(rootDir, '.launcher');
    const manifestPath = path.resolve(launcherDir, 'current-manifest.json');

    // 1. Создать директорию .launcher если её нет
    fs.mkdirSync(launcherDir, { recursive: true });

    // 2. Сохранить манифест в .launcher/current-manifest.json
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8');
    console.log(
      `[ViteRunner] Манифест сохранен: ${manifest.modules.length} модулей, ` +
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
    const configSettings = config.settings || {};
    const logLevel =
      process.env.VITE_LOG_LEVEL ||
      process.env.LOG_LEVEL ||
      configSettings.logLevel ||
      'INFO';

    // Настройка использования моков
    const useLocalMocks =
      process.env.VITE_USE_LOCAL_MOCKS !== undefined
        ? process.env.VITE_USE_LOCAL_MOCKS === 'true'
        : configSettings.useLocalMocks !== undefined
          ? configSettings.useLocalMocks
          : true;

    // Получаем appStartEndpoint из глобальных настроек
    const appStartEndpoint =
      process.env.VITE_APP_START_ENDPOINT ||
      process.env.APP_START_ENDPOINT ||
      (configRepository
        ? configRepository.getAppStartEndpoint()
        : '/app/start');

    // В dev режиме всегда используем пустой API URL, чтобы запросы шли через Vite proxy на dev-server
    const env = {
      ...process.env,
      VITE_LOCAL_MODULES: localModules.join(','),
      LOG_LEVEL: logLevel, // для совместимости со старыми местами
      VITE_LOG_LEVEL: logLevel, // чтобы попасть в import.meta.env на клиенте
      VITE_USE_LOCAL_MOCKS: String(useLocalMocks),
      VITE_API_URL: '',
      VITE_USE_PROXY_SERVER: 'true',
      VITE_APP_START_ENDPOINT: appStartEndpoint, // Эндпоинт для стартового манифеста
    };

    // 5. Запустить dev-server параллельно
    const devProcess = await this.devServerRunner.start();

    // 6. Запустить Vite
    const viteProcess = spawn('vite', ['--config', 'host/vite.config.mts'], {
      cwd: rootDir,
      env,
      stdio: 'inherit',
      shell: process.platform === 'win32',
    });

    // Добавляем процессы в менеджер
    this.processManager.add(devProcess);
    this.processManager.add(viteProcess);

    // Обработка завершения процесса Vite
    viteProcess.on('close', (code) => {
      this.processManager.stop(devProcess);
      if (code !== 0 && code !== 130 && code !== 143 && code !== null) {
        console.error(`[ViteRunner] Vite process exited with code ${code}`);
      }
    });

    return viteProcess;
  }
}
