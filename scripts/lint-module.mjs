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
 * Универсальный скрипт для линтинга MFE модулей
 *
 * Использование:
 *   npm run lint:module -- --name=<module>
 *   npm run lint:module -- --all
 *   npm run lint:module -- --name=<module1> --name=<module2> --parallel
 *   npm run lint:module -- --modules=<module1>,<module2>
 *   MODULES=<module1>,<module2> npm run lint:module
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
      const hasEslintConfig =
        fs.existsSync(path.join(packagesDir, d.name, '.eslintrc.cjs')) ||
        fs.existsSync(path.join(packagesDir, d.name, '.eslintrc.js')) ||
        fs.existsSync(path.join(packagesDir, d.name, '.eslintrc.json'));
      return hasEslintConfig;
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
    fix: args.includes('--fix'),
    verbose: args.includes('--verbose') || args.includes('-v'),
  };
}

async function lintModule(moduleName, options = {}) {
  const modulePath = path.join(packagesDir, moduleName);
  const srcPath = path.join(modulePath, 'src');

  if (!fs.existsSync(srcPath)) {
    throw new Error(`Source directory not found: ${srcPath}`);
  }

  const spinner = ora(`Linting ${chalk.cyan(moduleName)}`).start();

  return new Promise((resolve, reject) => {
    const args = [srcPath];

    if (options.fix) {
      args.push('--fix');
    }

    const lint = spawn('npx', ['eslint', ...args], {
      cwd: modulePath,
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
        spinner.succeed(`Linted ${chalk.cyan(moduleName)}`);
        resolve({ name: moduleName, success: true });
      } else {
        spinner.fail(`Linting failed for ${chalk.red(moduleName)}`);
        if (!options.verbose && (stdout || stderr)) {
          console.error(stdout || stderr);
        }
        resolve({ name: moduleName, success: false, code });
      }
    });

    lint.on('error', (error) => {
      spinner.fail(`Failed to lint ${chalk.red(moduleName)}`);
      reject(error);
    });
  });
}

async function lintModulesParallel(moduleNames, options) {
  console.log(
    chalk.cyan(`\n🔍 Linting ${moduleNames.length} modules in parallel...\n`),
  );

  const results = await Promise.allSettled(
    moduleNames.map((name) => lintModule(name, options)),
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

async function lintModulesSequential(moduleNames, options) {
  console.log(chalk.cyan(`\n🔍 Linting ${moduleNames.length} modules...\n`));

  const results = [];
  for (const name of moduleNames) {
    const result = await lintModule(name, options);
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

  let modulesToLint = [];

  if (args.all) {
    modulesToLint = discoverModules(packagesDir);
  } else if (args.names.length > 0) {
    modulesToLint = args.names;

    // Валидация
    for (const name of modulesToLint) {
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
    console.log(`  npm run lint:module -- --name=${exampleModule}`);
    console.log('  npm run lint:module -- --all');
    if (availableModules.length > 1) {
      console.log(
        `  npm run lint:module -- --name=${availableModules[0]} --name=${availableModules[1]} --parallel`,
      );
      console.log(`  npm run lint:module -- --modules=${exampleModules}`);
    }
    console.log(`  MODULES=${exampleModules} npm run lint:module`);
    console.log('  npm run lint:module -- --fix  # автоматическое исправление');
    if (availableModules.length > 0) {
      console.log(
        chalk.gray(`\nAvailable modules: ${availableModules.join(', ')}`),
      );
    }
    process.exit(1);
  }

  if (modulesToLint.length === 0) {
    console.log(chalk.yellow('No modules found to lint'));
    process.exit(0);
  }

  const options = {
    fix: args.fix,
    verbose: args.verbose,
  };

  if (args.parallel) {
    await lintModulesParallel(modulesToLint, options);
  } else {
    await lintModulesSequential(modulesToLint, options);
  }

  console.log(chalk.green('\n✨ All modules linted successfully!\n'));
}

main().catch((err) => {
  console.error(chalk.red('❌ Lint failed:'), err.message);
  process.exit(1);
});
