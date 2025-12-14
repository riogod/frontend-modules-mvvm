#!/usr/bin/env node
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';
import ora from 'ora';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const packagesDir = path.resolve(__dirname, '../packages');

/**
 * Универсальный скрипт для тестирования MFE модулей
 *
 * Использование:
 *   npm run test:module -- --name=<module>
 *   npm run test:module -- --all
 *   npm run test:module -- --name=<module1> --name=<module2> --parallel
 *   npm run test:module -- --modules=<module1>,<module2>
 *   MODULES=<module1>,<module2> npm run test:module
 */

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
      const hasViteConfig =
        fs.existsSync(path.join(packagesDir, d.name, 'vite.config.mts')) ||
        fs.existsSync(path.join(packagesDir, d.name, 'vite.config.ts')) ||
        fs.existsSync(path.join(packagesDir, d.name, 'vite.config.js'));
      return hasViteConfig;
    })
    .map((d) => d.name);
}

function parseArgs() {
  const args = process.argv.slice(2);

  // Поддержка списка модулей через --modules=module1,module2
  const modulesArg = args.find((a) => a.startsWith('--modules='));
  let modulesFromArg = [];
  if (modulesArg) {
    modulesFromArg = modulesArg
      .replace('--modules=', '')
      .split(',')
      .map((m) => m.trim())
      .filter((m) => m.length > 0);
  }

  // Поддержка переменной окружения MODULES
  const modulesFromEnv = process.env.MODULES
    ? process.env.MODULES.split(',')
        .map((m) => m.trim())
        .filter((m) => m.length > 0)
    : [];

  // Объединяем все источники списка модулей
  const allModuleNames = [
    ...args
      .filter((a) => a.startsWith('--name='))
      .map((a) => a.replace('--name=', '')),
    ...modulesFromArg,
    ...modulesFromEnv,
  ];

  return {
    all: args.includes('--all'),
    names: allModuleNames,
    parallel: args.includes('--parallel'),
    watch: args.includes('--watch') || args.includes('-w'),
    ui: args.includes('--ui'),
    coverage: args.includes('--coverage'),
    verbose: args.includes('--verbose') || args.includes('-v'),
  };
}

async function testModule(moduleName, options = {}) {
  const modulePath = path.join(packagesDir, moduleName);
  const viteConfigPath = path.join(modulePath, 'vite.config.mts');

  // Проверяем наличие конфига vitest
  const hasViteConfig =
    fs.existsSync(viteConfigPath) ||
    fs.existsSync(path.join(modulePath, 'vite.config.ts')) ||
    fs.existsSync(path.join(modulePath, 'vite.config.js'));

  if (!hasViteConfig) {
    throw new Error(`Vite config not found for module: ${moduleName}`);
  }

  const spinner = ora(`Testing ${chalk.cyan(moduleName)}`).start();

  return new Promise((resolve, reject) => {
    const configFile = fs.existsSync(viteConfigPath)
      ? 'vite.config.mts'
      : 'vite.config.ts';
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
      cwd: modulePath,
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
        spinner.succeed(`Tests passed for ${chalk.cyan(moduleName)}`);
        resolve({ name: moduleName, success: true });
      } else if (noTestsFound) {
        // Если тестов нет, это не ошибка
        spinner.info(`No tests found for ${chalk.cyan(moduleName)}`);
        resolve({ name: moduleName, success: true, noTests: true });
      } else {
        spinner.fail(`Tests failed for ${chalk.red(moduleName)}`);
        if (!options.verbose && (stdout || stderr)) {
          console.error(stdout || stderr);
        }
        resolve({ name: moduleName, success: false, code });
      }
    });

    test.on('error', (error) => {
      spinner.fail(`Failed to test ${chalk.red(moduleName)}`);
      reject(error);
    });
  });
}

async function testModulesParallel(moduleNames, options) {
  console.log(
    chalk.cyan(`\n🧪 Testing ${moduleNames.length} modules in parallel...\n`),
  );

  const results = await Promise.allSettled(
    moduleNames.map((name) => testModule(name, options)),
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

async function testModulesSequential(moduleNames, options) {
  console.log(chalk.cyan(`\n🧪 Testing ${moduleNames.length} modules...\n`));

  const results = [];
  for (const name of moduleNames) {
    const result = await testModule(name, options);
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

  let modulesToTest = [];

  if (args.all) {
    modulesToTest = discoverModules(packagesDir);
  } else if (args.names.length > 0) {
    modulesToTest = args.names;

    // Валидация
    for (const name of modulesToTest) {
      if (!fs.existsSync(path.join(packagesDir, name))) {
        console.error(chalk.red(`Module "${name}" not found in packages/`));
        process.exit(1);
      }
    }
  } else {
    const availableModules = discoverModules(packagesDir);
    const exampleModules =
      availableModules.length > 0
        ? availableModules.slice(0, 2).join(',')
        : 'module1,module2';
    const exampleModule =
      availableModules.length > 0 ? availableModules[0] : 'module1';

    console.log(chalk.yellow('Usage:'));
    console.log(`  npm run test:module -- --name=${exampleModule}`);
    console.log('  npm run test:module -- --all');
    if (availableModules.length > 1) {
      console.log(
        `  npm run test:module -- --name=${availableModules[0]} --name=${availableModules[1]} --parallel`,
      );
      console.log(`  npm run test:module -- --modules=${exampleModules}`);
    }
    console.log(`  MODULES=${exampleModules} npm run test:module`);
    console.log('  npm run test:module -- --watch  # режим наблюдения');
    console.log('  npm run test:module -- --ui  # UI режим');
    console.log('  npm run test:module -- --coverage  # с покрытием кода');
    if (availableModules.length > 0) {
      console.log(
        chalk.gray(`\nAvailable modules: ${availableModules.join(', ')}`),
      );
    }
    process.exit(1);
  }

  if (modulesToTest.length === 0) {
    console.log(chalk.yellow('No modules found to test'));
    process.exit(0);
  }

  const options = {
    watch: args.watch,
    ui: args.ui,
    coverage: args.coverage,
    verbose: args.verbose,
  };

  if (args.parallel) {
    await testModulesParallel(modulesToTest, options);
  } else {
    await testModulesSequential(modulesToTest, options);
  }

  console.log(chalk.green('\n✨ All modules tested successfully!\n'));
}

main().catch((err) => {
  console.error(chalk.red('❌ Test failed:'), err.message);
  process.exit(1);
});
