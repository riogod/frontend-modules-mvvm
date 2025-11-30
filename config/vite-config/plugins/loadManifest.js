import * as fs from 'fs';
import * as path from 'path';

/**
 * Загружает манифест из файла или создает fallback
 */
export function loadManifest(options) {
  const {
    dirname,
    manifestPath = '../.launcher/current-manifest.json',
    packagesDir = '../packages',
    createFallback = true,
  } = options;

  const fullManifestPath = path.resolve(dirname, manifestPath);

  // Пытаемся загрузить манифест из файла
  try {
    if (fs.existsSync(fullManifestPath)) {
      const manifest = JSON.parse(fs.readFileSync(fullManifestPath, 'utf-8'));
      console.log(
        '[loadManifest] Loaded manifest with',
        manifest.modules?.length || 0,
        'modules',
      );
      return manifest;
    }
  } catch (error) {
    console.warn('[loadManifest] Failed to load manifest:', error);
  }

  // Создаем fallback если разрешено
  if (createFallback) {
    return createFallbackManifest(dirname, packagesDir);
  }

  console.log('[loadManifest] No manifest found');
  return null;
}

/**
 * Создает fallback манифест со всеми модулями как LOCAL
 */
function createFallbackManifest(dirname, packagesDir) {
  const fullPackagesDir = path.resolve(dirname, packagesDir);
  const modules = [];

  // INIT модули всегда локальные
  modules.push(
    {
      name: 'core',
      version: '1.0.0',
      loadType: 'init',
      loadPriority: 0,
      remoteEntry: '',
    },
    {
      name: 'core.layout',
      version: '1.0.0',
      loadType: 'init',
      loadPriority: 2,
      remoteEntry: '',
    },
  );

  // Сканируем packages/ для NORMAL модулей
  if (fs.existsSync(fullPackagesDir)) {
    const packageDirs = fs
      .readdirSync(fullPackagesDir, { withFileTypes: true })
      .filter((d) => d.isDirectory());

    packageDirs.forEach((dir) => {
      modules.push({
        name: dir.name,
        version: '1.0.0',
        loadType: 'normal',
        loadPriority: 1,
        remoteEntry: '',
      });
    });
  }

  console.log(
    '[loadManifest] Created fallback manifest with',
    modules.length,
    'modules',
  );

  return { modules };
}

