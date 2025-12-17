#!/usr/bin/env node
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';
import ora from 'ora';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const libsDir = path.resolve(__dirname, '../libs');

/**
 * Универсальный скрипт для линтинга библиотек
 *
 * Использование:
 *   npm run lint:lib -- --name=<lib>
 *   npm run lint:lib -- --all
 *   npm run lint:lib -- --name=<lib1> --name=<lib2> --parallel
 *   npm run lint:lib -- --modules=<lib1>,<lib2>
 *   MODULES=<lib1>,<lib2> npm run lint:lib
 */

/**
 * Сканирует директорию libs/ и возвращает список библиотек
 */
function discoverLibs(libsDir) {
  if (!fs.existsSync(libsDir)) {
    return [];
  }

  return fs
    .readdirSync(libsDir, { withFileTypes: true })
    .filter((d) => {
      if (!d.isDirectory()) return false;
      const hasEslintConfig =
        fs.existsSync(path.join(libsDir, d.name, '.eslintrc.cjs')) ||
        fs.existsSync(path.join(libsDir, d.name, '.eslintrc.js')) ||
        fs.existsSync(path.join(libsDir, d.name, '.eslintrc.json'));
      return hasEslintConfig;
    })
    .map((d) => d.name);
}

function parseArgs() {
  const args = process.argv.slice(2);

  // Поддержка списка библиотек через --modules=lib1,lib2
  const modulesArg = args.find((a) => a.startsWith('--modules='));
  let libsFromArg = [];
  if (modulesArg) {
    libsFromArg = modulesArg
      .replace('--modules=', '')
      .split(',')
      .map((m) => m.trim())
      .filter((m) => m.length > 0);
  }

  // Поддержка переменной окружения MODULES
  const libsFromEnv = process.env.MODULES
    ? process.env.MODULES.split(',')
        .map((m) => m.trim())
        .filter((m) => m.length > 0)
    : [];

  // Объединяем все источники списка библиотек
  const allLibNames = [
    ...args
      .filter((a) => a.startsWith('--name='))
      .map((a) => a.replace('--name=', '')),
    ...libsFromArg,
    ...libsFromEnv,
  ];

  return {
    all: args.includes('--all'),
    names: allLibNames,
    parallel: args.includes('--parallel'),
    fix: args.includes('--fix'),
    verbose: args.includes('--verbose') || args.includes('-v'),
  };
}

async function lintLib(libName, options = {}) {
  const libPath = path.join(libsDir, libName);
  const srcPath = path.join(libPath, 'src');

  if (!fs.existsSync(srcPath)) {
    throw new Error(`Source directory not found: ${srcPath}`);
  }

  const spinner = ora(`Linting ${chalk.cyan(libName)}`).start();

  return new Promise((resolve, reject) => {
    const args = [srcPath];

    if (options.fix) {
      args.push('--fix');
    }

    const lint = spawn('npx', ['eslint', ...args], {
      cwd: libPath,
      stdio: options.verbose ? 'inherit' : 'pipe',
      env: {
        ...process.env,
      },
    });

    let stdout = '';
    let stderr = '';

    if (!options.verbose) {
      lint.stdout?.on('data', (data) => {
        stdout += data.toString();
      });

      lint.stderr?.on('data', (data) => {
        stderr += data.toString();
      });
    }

    lint.on('close', (code) => {
      if (code === 0) {
        spinner.succeed(`Linted ${chalk.cyan(libName)}`);
        resolve({ name: libName, success: true });
      } else {
        spinner.fail(`Linting failed for ${chalk.red(libName)}`);
        if (!options.verbose && (stdout || stderr)) {
          console.error(stdout || stderr);
        }
        resolve({ name: libName, success: false, code });
      }
    });

    lint.on('error', (error) => {
      spinner.fail(`Failed to lint ${chalk.red(libName)}`);
      reject(error);
    });
  });
}

async function lintLibsParallel(libNames, options) {
  console.log(
    chalk.cyan(`\n🔍 Linting ${libNames.length} libraries in parallel...\n`),
  );

  const results = await Promise.allSettled(
    libNames.map((name) => lintLib(name, options)),
  );

  const succeeded = results
    .filter((r) => r.status === 'fulfilled' && r.value.success)
    .map((r) => r.value.name);
  const failed = results
    .filter(
      (r) =>
        r.status === 'rejected' ||
        (r.status === 'fulfilled' && !r.value.success),
    )
    .map((r) =>
      r.status === 'fulfilled' ? r.value.name : r.reason?.message || 'unknown',
    );

  console.log('\n' + chalk.cyan('Lint Summary:'));
  console.log(`  ✅ Succeeded: ${succeeded.length}`);
  if (succeeded.length > 0) {
    console.log(`     ${succeeded.map((n) => chalk.green(n)).join(', ')}`);
  }
  console.log(`  ❌ Failed: ${failed.length}`);
  if (failed.length > 0) {
    console.log(`     ${failed.map((n) => chalk.red(n)).join(', ')}`);
  }

  if (failed.length > 0) {
    process.exit(1);
  }
}

async function lintLibsSequential(libNames, options) {
  console.log(chalk.cyan(`\n🔍 Linting ${libNames.length} libraries...\n`));

  const results = [];
  for (const name of libNames) {
    const result = await lintLib(name, options);
    results.push(result);
  }

  const succeeded = results.filter((r) => r.success);
  const failed = results.filter((r) => !r.success);

  console.log('\n' + chalk.cyan('Lint Summary:'));
  console.log(`  ✅ Succeeded: ${succeeded.length}`);
  if (succeeded.length > 0) {
    console.log(`     ${succeeded.map((r) => chalk.green(r.name)).join(', ')}`);
  }
  console.log(`  ❌ Failed: ${failed.length}`);
  if (failed.length > 0) {
    console.log(`     ${failed.map((r) => chalk.red(r.name)).join(', ')}`);
  }

  if (failed.length > 0) {
    process.exit(1);
  }
}

async function main() {
  const args = parseArgs();

  let libsToLint = [];

  if (args.all) {
    libsToLint = discoverLibs(libsDir);
  } else if (args.names.length > 0) {
    libsToLint = args.names;

    // Валидация
    for (const name of libsToLint) {
      if (!fs.existsSync(path.join(libsDir, name))) {
        console.error(chalk.red(`Library "${name}" not found in libs/`));
        process.exit(1);
      }
    }
  } else {
    const availableLibs = discoverLibs(libsDir);
    const exampleLibs =
      availableLibs.length > 0
        ? availableLibs.slice(0, 2).join(',')
        : 'lib1,lib2';
    const exampleLib = availableLibs.length > 0 ? availableLibs[0] : 'lib1';

    console.log(chalk.yellow('Usage:'));
    console.log(`  npm run lint:lib -- --name=${exampleLib}`);
    console.log('  npm run lint:lib -- --all');
    if (availableLibs.length > 1) {
      console.log(
        `  npm run lint:lib -- --name=${availableLibs[0]} --name=${availableLibs[1]} --parallel`,
      );
      console.log(`  npm run lint:lib -- --modules=${exampleLibs}`);
    }
    console.log(`  MODULES=${exampleLibs} npm run lint:lib`);
    console.log('  npm run lint:lib -- --fix  # автоматическое исправление');
    if (availableLibs.length > 0) {
      console.log(
        chalk.gray(`\nAvailable libraries: ${availableLibs.join(', ')}`),
      );
    }
    process.exit(1);
  }

  if (libsToLint.length === 0) {
    console.log(chalk.yellow('No libraries found to lint'));
    process.exit(0);
  }

  const options = {
    fix: args.fix,
    verbose: args.verbose,
  };

  if (args.parallel) {
    await lintLibsParallel(libsToLint, options);
  } else {
    await lintLibsSequential(libsToLint, options);
  }

  console.log(chalk.green('\n✨ All libraries linted successfully!\n'));
}

main().catch((err) => {
  console.error(chalk.red('❌ Lint failed:'), err.message);
  process.exit(1);
});
