import * as fs from 'fs';
import * as path from 'path';
import { ModuleLoadType } from '@platform/core';
import type { AppManifest } from './types';

export interface LoadManifestOptions {
  /**
   * Путь к директории проекта (dirname)
   */
  dirname: string;

  /**
   * Путь к файлу манифеста относительно корня проекта
   * @default '../.launcher/current-manifest.json'
   */
  manifestPath?: string;

  /**
   * Путь к директории packages/ для fallback
   * @default '../packages'
   */
  packagesDir?: string;

  /**
   * Создать fallback манифест если файл не найден
   * @default true
   */
  createFallback?: boolean;
}

/**
 * Загружает манифест из файла или создает fallback
 */
export function loadManifest(options: LoadManifestOptions): AppManifest | null {
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
function createFallbackManifest(
  dirname: string,
  packagesDir: string,
): AppManifest {
  const fullPackagesDir = path.resolve(dirname, packagesDir);
  const modules: AppManifest['modules'] = [];

  // INIT модули всегда локальные
  modules.push(
    {
      name: 'core',
      version: '1.0.0',
      loadType: ModuleLoadType.INIT,
      loadPriority: 0,
      remoteEntry: '',
    },
    {
      name: 'core.layout',
      version: '1.0.0',
      loadType: ModuleLoadType.INIT,
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
        loadType: ModuleLoadType.NORMAL,
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
