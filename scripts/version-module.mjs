#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import prompts from 'prompts';

const packagesDir = path.resolve(process.cwd(), 'packages');

/**
 * Сканирует директорию packages/ и возвращает список модулей
 */
function discoverModules(packagesDir) {
  if (!fs.existsSync(packagesDir)) {
    return [];
  }

  return fs
    .readdirSync(packagesDir, { withFileTypes: true })
    .filter((d) => {
      if (!d.isDirectory()) return false;
      const hasViteConfig = fs.existsSync(
        path.join(packagesDir, d.name, 'vite.config.mts'),
      );
      return hasViteConfig;
    })
    .map((d) => d.name);
}

async function versionModule(moduleName, bumpType) {
  const modulePath = path.join(packagesDir, moduleName);
  const pkgPath = path.join(modulePath, 'package.json');

  // Используем npm version для bump
  execSync(`npm version ${bumpType} --no-git-tag-version`, {
    cwd: modulePath,
    stdio: 'inherit',
  });

  // Читаем новую версию
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
  console.log(`\n✅ ${moduleName} bumped to v${pkg.version}`);

  return pkg.version;
}

async function main() {
  const moduleName = process.argv[2];
  const bumpType = process.argv[3] || 'patch';

  if (!moduleName) {
    const modules = discoverModules(packagesDir);

    const { selectedModule, selectedBump } = await prompts([
      {
        type: 'select',
        name: 'selectedModule',
        message: 'Select module:',
        choices: modules.map((m) => ({ title: m, value: m })),
      },
      {
        type: 'select',
        name: 'selectedBump',
        message: 'Version bump:',
        choices: [
          { title: 'patch (1.0.x)', value: 'patch' },
          { title: 'minor (1.x.0)', value: 'minor' },
          { title: 'major (x.0.0)', value: 'major' },
        ],
      },
    ]);

    await versionModule(selectedModule, selectedBump);
  } else {
    await versionModule(moduleName, bumpType);
  }
}

main().catch(console.error);

