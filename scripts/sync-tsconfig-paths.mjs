import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const libsDir = path.join(rootDir, 'libs');
const tsconfigPath = path.join(rootDir, 'tsconfig.base.json');

function collectLibraryPaths() {
    if (!fs.existsSync(libsDir)) {
        return {};
    }

    const aliases = {};
    const dirEntries = fs.readdirSync(libsDir, { withFileTypes: true });

    dirEntries.forEach((entry) => {
        if (!entry.isDirectory()) {
            return;
        }

        const libraryRoot = path.join(libsDir, entry.name);
        const packageJsonPath = path.join(libraryRoot, 'package.json');
        const srcIndexPath = path.join(libraryRoot, 'src', 'index.ts');

        if (!fs.existsSync(packageJsonPath) || !fs.existsSync(srcIndexPath)) {
            return;
        }

        try {
            const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
            const aliasName = packageJson.name || `@todo/${entry.name}`;
            aliases[aliasName] = [`libs/${entry.name}/src/index.ts`];
        } catch (error) {
            process.emitWarning(
                `[sync-tsconfig-paths] Не удалось прочитать ${packageJsonPath}: ${(error && error.message) || error
                }`
            );
        }
    });

    return Object.fromEntries(Object.entries(aliases).sort(([a], [b]) => a.localeCompare(b)));
}

function updateTsconfigPaths() {
    if (!fs.existsSync(tsconfigPath)) {
        throw new Error(`tsconfig.base.json не найден по пути ${tsconfigPath}`);
    }

    const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf-8'));
    const newPaths = collectLibraryPaths();

    tsconfig.compilerOptions = tsconfig.compilerOptions || {};
    tsconfig.compilerOptions.paths = newPaths;

    fs.writeFileSync(tsconfigPath, `${JSON.stringify(tsconfig, null, 2)}\n`);

    const aliasesList = Object.keys(newPaths);
    const summary =
        aliasesList.length > 0
            ? aliasesList.join(', ')
            : 'ни одной библиотеки не найдено (paths очищены)';

    console.info(`[sync-tsconfig-paths] Обновлены paths для: ${summary}`);
}

try {
    updateTsconfigPaths();
} catch (error) {
    console.error('[sync-tsconfig-paths] Ошибка при обновлении paths:', error);
    process.exitCode = 1;
}

