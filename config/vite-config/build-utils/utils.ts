import fs from 'fs';
import path from 'path';
import type { AppManifest, ModuleManifestEntry } from '../plugins/types';

/**
 * Получает версию модуля из package.json
 */
export function getModuleVersion(modulePath: string): string {
  const pkgPath = path.join(modulePath, 'package.json');
  if (fs.existsSync(pkgPath)) {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
    return pkg.version || '1.0.0';
  }
  return '1.0.0';
}

/**
 * Сканирует директорию packages/ и возвращает список модулей
 */
export function discoverModules(packagesDir: string): string[] {
  if (!fs.existsSync(packagesDir)) {
    return [];
  }

  return fs
    .readdirSync(packagesDir, { withFileTypes: true })
    .filter((d) => {
      if (!d.isDirectory()) return false;
      // Проверяем наличие vite.config.mts
      const hasViteConfig = fs.existsSync(
        path.join(packagesDir, d.name, 'vite.config.mts'),
      );
      return hasViteConfig;
    })
    .map((d) => d.name);
}

/**
 * Проверяет, собран ли модуль (есть remoteEntry.js)
 */
export function isModuleBuilt(distDir: string, moduleName: string): boolean {
  const remoteEntry = path.join(
    distDir,
    moduleName,
    'latest',
    'assets',
    'remoteEntry.js',
  );
  return fs.existsSync(remoteEntry);
}

