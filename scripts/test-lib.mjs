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
 * Универсальный скрипт для тестирования библиотек
 *
 * Использование:
 *   npm run test:lib -- --name=<lib>
 *   npm run test:lib -- --all
 *   npm run test:lib -- --name=<lib1> --name=<lib2> --parallel
 *   npm run test:lib -- --modules=<lib1>,<lib2>
 *   MODULES=<lib1>,<lib2> npm run test:lib
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
      const hasVitestConfig =
        fs.existsSync(path.join(libsDir, d.name, 'vitest.config.ts')) ||
        fs.existsSync(path.join(libsDir, d.name, 'vitest.config.mts')) ||
        fs.existsSync(path.join(libsDir, d.name, 'vitest.config.js'));
      return hasVitestConfig;
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
    watch: args.includes('--watch') || args.includes('-w'),
    ui: args.includes('--ui'),
    coverage: args.includes('--coverage'),
    verbose: args.includes('--verbose') || args.includes('-v'),
  };
}

async function testLib(libName, options = {}) {
  const libPath = path.join(libsDir, libName);
  const vitestConfigPath = path.join(libPath, 'vitest.config.ts');

  // Проверяем наличие конфига vitest
  const hasVitestConfig =
    fs.existsSync(vitestConfigPath) ||
    fs.existsSync(path.join(libPath, 'vitest.config.mts')) ||
    fs.existsSync(path.join(libPath, 'vitest.config.js'));

  if (!hasVitestConfig) {
    throw new Error(`Vitest config not found for library: ${libName}`);
  }

  const spinner = ora(`Testing ${chalk.cyan(libName)}`).start();

  return new Promise((resolve, reject) => {
    const configFile = fs.existsSync(vitestConfigPath)
      ? 'vitest.config.ts'
      : 'vitest.config.mts';
    const args = ['vitest', '--config', configFile];

    // По умолчанию запускаем в режиме run (одноразовый запуск)
    if (!options.watch) {
      args.push('--run');
    } else {
      args.push('--watch');
    }

    if (options.ui) {
      args.push('--ui');
    }

    if (options.coverage) {
      args.push('--coverage');
    }

    if (options.verbose) {
      args.push('--reporter=verbose');
    } else {
      args.push('--reporter=default');
    }

    const test = spawn('npx', args, {
      cwd: libPath,
      stdio: options.verbose ? 'inherit' : 'pipe',
      env: {
        ...process.env,
      },
    });

    let stdout = '';
    let stderr = '';

    if (!options.verbose) {
      test.stdout?.on('data', (data) => {
        stdout += data.toString();
      });

      test.stderr?.on('data', (data) => {
        stderr += data.toString();
      });
    }

    test.on('close', (code) => {
      const output = (stdout + stderr).toLowerCase();
      const noTestsFound =
        output.includes('no test files found') ||
        output.includes('no tests found');

      if (code === 0) {
        spinner.succeed(`Tests passed for ${chalk.cyan(libName)}`);
        resolve({ name: libName, success: true });
      } else if (noTestsFound) {
        // Если тестов нет, это не ошибка
        spinner.info(`No tests found for ${chalk.cyan(libName)}`);
        resolve({ name: libName, success: true, noTests: true });
      } else {
        spinner.fail(`Tests failed for ${chalk.red(libName)}`);
        if (!options.verbose && (stdout || stderr)) {
          console.error(stdout || stderr);
        }
        resolve({ name: libName, success: false, code });
      }
    });

    test.on('error', (error) => {
      spinner.fail(`Failed to test ${chalk.red(libName)}`);
      reject(error);
    });
  });
}

async function testLibsParallel(libNames, options) {
  console.log(
    chalk.cyan(`\n🧪 Testing ${libNames.length} libraries in parallel...\n`),
  );

  const results = await Promise.allSettled(
    libNames.map((name) => testLib(name, options)),
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

  console.log('\n' + chalk.cyan('Test Summary:'));
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

async function testLibsSequential(libNames, options) {
  console.log(chalk.cyan(`\n🧪 Testing ${libNames.length} libraries...\n`));

  const results = [];
  for (const name of libNames) {
    const result = await testLib(name, options);
    results.push(result);
  }

  const succeeded = results.filter((r) => r.success);
  const failed = results.filter((r) => !r.success);

  console.log('\n' + chalk.cyan('Test Summary:'));
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

  let libsToTest = [];

  if (args.all) {
    libsToTest = discoverLibs(libsDir);
  } else if (args.names.length > 0) {
    libsToTest = args.names;

    // Валидация
    for (const name of libsToTest) {
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
    console.log(`  npm run test:lib -- --name=${exampleLib}`);
    console.log('  npm run test:lib -- --all');
    if (availableLibs.length > 1) {
      console.log(
        `  npm run test:lib -- --name=${availableLibs[0]} --name=${availableLibs[1]} --parallel`,
      );
      console.log(`  npm run test:lib -- --modules=${exampleLibs}`);
    }
    console.log(`  MODULES=${exampleLibs} npm run test:lib`);
    console.log('  npm run test:lib -- --watch  # режим наблюдения');
    console.log('  npm run test:lib -- --ui  # UI режим');
    console.log('  npm run test:lib -- --coverage  # с покрытием кода');
    if (availableLibs.length > 0) {
      console.log(
        chalk.gray(`\nAvailable libraries: ${availableLibs.join(', ')}`),
      );
    }
    process.exit(1);
  }

  if (libsToTest.length === 0) {
    console.log(chalk.yellow('No libraries found to test'));
    process.exit(0);
  }

  const options = {
    watch: args.watch,
    ui: args.ui,
    coverage: args.coverage,
    verbose: args.verbose,
  };

  if (args.parallel) {
    await testLibsParallel(libsToTest, options);
  } else {
    await testLibsSequential(libsToTest, options);
  }

  console.log(chalk.green('\n✨ All libraries tested successfully!\n'));
}

main().catch((err) => {
  console.error(chalk.red('❌ Test failed:'), err.message);
  process.exit(1);
});
