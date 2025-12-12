import fs from 'fs';
import path from 'path';
import { getModuleVersion, isModuleBuilt } from './utils.js';

// Используем значения enum напрямую для .js файлов
const ModuleLoadType = {
  INIT: 'init',
  NORMAL: 'normal',
};
/**
 * Генерирует production манифест на основе собранных модулей
 */
export function generateManifest(options) {
    const { distDir, packagesDir, outputPath, baseUrl, versionStrategy = 'version', } = options;
    const modules = [];
    // Добавляем INIT модули (core, core.layout) - они всегда локальные
    const initModules = ['core', 'core.layout'];
    for (const moduleName of initModules) {
        modules.push({
            name: moduleName,
            loadType: ModuleLoadType.INIT,
            loadPriority: 0,
            remoteEntry: '',
        });
    }
    // Сканируем собранные модули
    if (fs.existsSync(distDir)) {
        const moduleNames = fs
            .readdirSync(distDir, { withFileTypes: true })
            .filter((d) => d.isDirectory())
            .map((d) => d.name);
        for (const moduleName of moduleNames) {
            if (!isModuleBuilt(distDir, moduleName)) {
                console.warn(`[generateManifest] Module ${moduleName} not built, skipping`);
                continue;
            }
            const version = getModuleVersion(path.join(packagesDir, moduleName));
            const versionPath = versionStrategy === 'latest' ? 'latest' : version;
            modules.push({
                name: moduleName,
                loadType: ModuleLoadType.NORMAL,
                loadPriority: 1,
                remoteEntry: `${baseUrl}${moduleName}/${versionPath}/assets/remoteEntry.js`,
            });
        }
    }
    const manifest = {
        modules,
    };
    // Сохраняем манифест
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, JSON.stringify(manifest, null, 2), 'utf-8');
    console.log(`[generateManifest] Generated manifest with ${modules.length} modules`);
    console.log(`[generateManifest] Output: ${outputPath}`);
    return manifest;
}
