#!/usr/bin/env node
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';
import ora from 'ora';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const packagesDir = path.resolve(__dirname, '../packages');
const distDir = path.resolve(__dirname, '../dist/modules');

/**
 * Универсальный скрипт для сборки MFE модулей
 *
 * Использование:
 *   npm run build:module -- --name=todo
 *   npm run build:module -- --all
 *   npm run build:module -- --name=todo --name=api_example --parallel
 *
 * Результат сборки:
 *   dist/modules/{module}/latest/   — всегда актуальная версия
 *   dist/modules/{module}/{version}/ — копия для версионирования
 */

/**
 * Получает версию модуля из package.json
 */
function getModuleVersion(modulePath) {
  const pkgPath = path.join(modulePath, 'package.json');
  if (fs.existsSync(pkgPath)) {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
    return pkg.version || '1.0.0';
  }
  return '1.0.0';
}

/**
 * Рекурсивно копирует директорию
 */
function copyDirectory(src, dest) {
  fs.mkdirSync(dest, { recursive: true });

  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDirectory(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

/**
 * Реорганизует структуру модуля после сборки:
 * - Удаляет index.html
 * - Перемещает все файлы из assets/ в корень
 * - Удаляет пустую папку assets/
 */
function reorganizeModuleOutput(moduleDir) {
  const indexPath = path.join(moduleDir, 'index.html');
  const assetsPath = path.join(moduleDir, 'assets');

  // Удаляем index.html
  if (fs.existsSync(indexPath)) {
    try {
      fs.unlinkSync(indexPath);
    } catch (error) {
      // Игнорируем ошибки
    }
  }

  // Перемещаем все файлы из assets/ в корень
  if (fs.existsSync(assetsPath)) {
    const entries = fs.readdirSync(assetsPath, { withFileTypes: true });
    for (const entry of entries) {
      const srcPath = path.join(assetsPath, entry.name);
      const destPath = path.join(moduleDir, entry.name);

      // Если файл уже существует, удаляем его
      if (fs.existsSync(destPath)) {
        if (fs.statSync(destPath).isDirectory()) {
          fs.rmSync(destPath, { recursive: true });
        } else {
          fs.unlinkSync(destPath);
        }
      }

      // Перемещаем файл/папку
      fs.renameSync(srcPath, destPath);
    }

    // Удаляем пустую папку assets/
    try {
      const remaining = fs.readdirSync(assetsPath);
      if (remaining.length === 0) {
        fs.rmdirSync(assetsPath);
      }
    } catch (error) {
      // Игнорируем ошибки
    }
  }

  // Исправляем пути в remoteEntry.js: заменяем /assets/../ на /
  const remoteEntryPath = path.join(moduleDir, 'remoteEntry.js');
  if (fs.existsSync(remoteEntryPath)) {
    let content = fs.readFileSync(remoteEntryPath, 'utf8');
    // Заменяем /assets/../ на / в путях
    content = content.replace(/\/assets\/\.\.\//g, '/');
    fs.writeFileSync(remoteEntryPath, content, 'utf8');
  }
}

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

function parseArgs() {
  const args = process.argv.slice(2);
  return {
    all: args.includes('--all'),
    names: args
      .filter((a) => a.startsWith('--name='))
      .map((a) => a.replace('--name=', '')),
    parallel: args.includes('--parallel'),
    analyze: args.includes('--analyze'),
  };
}

async function buildModule(moduleName, options = {}) {
  const modulePath = path.join(packagesDir, moduleName);
  const version = getModuleVersion(modulePath);
  const moduleDistDir = path.join(distDir, moduleName);
  const latestDir = path.join(distDir, moduleName, 'latest');
  const versionDir = path.join(distDir, moduleName, version);

  // Очищаем всю папку модуля перед сборкой
  if (fs.existsSync(moduleDistDir)) {
    fs.rmSync(moduleDistDir, { recursive: true });
  }

  const spinner = ora(`Building ${chalk.cyan(moduleName)} v${version}`).start();

  return new Promise((resolve, reject) => {
    const args = ['build', '--outDir', latestDir];

    if (options.analyze) {
      args.push('--mode', 'analyze');
    }

    const build = spawn('npx', ['vite', ...args], {
      cwd: modulePath,
      stdio: options.verbose ? 'inherit' : 'pipe',
      env: {
        ...process.env,
        NODE_ENV: 'production',
      },
    });

    let stderr = '';

    if (!options.verbose) {
      build.stderr?.on('data', (data) => {
        stderr += data.toString();
      });
    }

    build.on('close', (code) => {
      if (code === 0) {
        // Реорганизуем структуру модуля: перемещаем файлы из assets/ в корень
        try {
          reorganizeModuleOutput(latestDir);

          // Копируем latest → version
          if (fs.existsSync(versionDir)) {
            fs.rmSync(versionDir, { recursive: true });
          }
          copyDirectory(latestDir, versionDir);
          // Реорганизуем и версионированную копию
          reorganizeModuleOutput(versionDir);

          spinner.succeed(`Built ${chalk.cyan(moduleName)} v${version}`);
          console.log(`   Latest:  ${chalk.gray(latestDir)}`);
          console.log(`   Version: ${chalk.gray(versionDir)}`);

          resolve({ name: moduleName, version, latestDir, versionDir });
        } catch (error) {
          spinner.fail(`Failed to reorganize output for ${chalk.red(moduleName)}`);
          reject(error);
        }
      } else {
        spinner.fail(`Failed to build ${chalk.red(moduleName)}`);
        if (stderr) {
          console.error(chalk.red(stderr));
        }
        reject(new Error(`Build failed for ${moduleName}`));
      }
    });
  });
}

async function buildModulesParallel(moduleNames, options) {
  console.log(
    chalk.cyan(`\n📦 Building ${moduleNames.length} modules in parallel...\n`),
  );

  const results = await Promise.allSettled(
    moduleNames.map((name) => buildModule(name, options)),
  );

  const succeeded = results.filter((r) => r.status === 'fulfilled');
  const failed = results.filter((r) => r.status === 'rejected');

  console.log('\n' + chalk.cyan('Build Summary:'));
  console.log(`  ✅ Succeeded: ${succeeded.length}`);
  console.log(`  ❌ Failed: ${failed.length}`);

  if (failed.length > 0) {
    process.exit(1);
  }
}

async function buildModulesSequential(moduleNames, options) {
  console.log(chalk.cyan(`\n📦 Building ${moduleNames.length} modules...\n`));

  for (const name of moduleNames) {
    await buildModule(name, options);
  }
}

async function main() {
  const args = parseArgs();

  let modulesToBuild = [];

  if (args.all) {
    modulesToBuild = discoverModules(packagesDir);
  } else if (args.names.length > 0) {
    modulesToBuild = args.names;

    // Валидация
    for (const name of modulesToBuild) {
      if (!fs.existsSync(path.join(packagesDir, name))) {
        console.error(chalk.red(`Module "${name}" not found in packages/`));
        process.exit(1);
      }
    }
  } else {
    console.log(chalk.yellow('Usage:'));
    console.log('  npm run build:module -- --name=todo');
    console.log('  npm run build:module -- --all');
    console.log(
      '  npm run build:module -- --name=todo --name=api_example --parallel',
    );
    process.exit(1);
  }

  if (modulesToBuild.length === 0) {
    console.log(chalk.yellow('No modules found to build'));
    process.exit(0);
  }

  const options = { analyze: args.analyze };

  if (args.parallel) {
    await buildModulesParallel(modulesToBuild, options);
  } else {
    await buildModulesSequential(modulesToBuild, options);
  }

  console.log(chalk.green('\n✨ All modules built successfully!\n'));
}

main().catch((err) => {
  console.error(chalk.red('❌ Build failed:'), err.message);
  process.exit(1);
});

