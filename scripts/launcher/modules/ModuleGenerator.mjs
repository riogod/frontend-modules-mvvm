import fs from 'fs';
import path from 'path';
import prompts from 'prompts';
import chalk from 'chalk';
import ora from 'ora';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class ModuleGenerator {
  /**
   * @param {string} [rootDir] - Корневая директория проекта
   */
  constructor(rootDir = null) {
    const projectRoot = rootDir || path.resolve(__dirname, '../../..');
    this.templatesDir = path.resolve(projectRoot, 'scripts/templates/module');
    this.packagesDir = path.resolve(projectRoot, 'packages');
  }

  /**
   * Преобразует kebab-case в Title Case
   */
  toTitleCase(str) {
    return str
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * Преобразует kebab-case в UPPER_SNAKE_CASE
   */
  toUpperSnakeCase(str) {
    return str.toUpperCase().replace(/-/g, '_');
  }

  /**
   * Сбор информации о модуле
   */
  async collectInfo() {
    const answers = await prompts(
      [
        {
          type: 'text',
          name: 'name',
          message: 'Название модуля (kebab-case):',
          validate: (value) => {
            if (!value || value.trim() === '') {
              return 'Название не может быть пустым';
            }
            // Проверка на русские символы
            if (/[а-яёА-ЯЁ]/.test(value)) {
              return 'Название не должно содержать русские символы. Используйте только латинские буквы';
            }
            // Проверка на подчеркивания
            if (value.includes('_')) {
              return 'Название не должно содержать подчеркивания (_). Используйте дефисы (-)';
            }
            // Проверка формата kebab-case
            if (!/^[a-z][a-z0-9-]*$/.test(value)) {
              return 'Используйте kebab-case: только строчные латинские буквы, цифры и дефисы (например: todo-list)';
            }
            if (fs.existsSync(path.join(this.packagesDir, value))) {
              return `Модуль ${value} уже существует`;
            }
            return true;
          },
        },
        {
          type: 'text',
          name: 'description',
          message: 'Описание модуля:',
          initial: 'New MFE module',
        },
        {
          type: 'text',
          name: 'author',
          message: 'Автор:',
          initial: process.env.USER || process.env.USERNAME || 'Developer',
        },
        {
          type: 'text',
          name: 'title',
          message: 'Заголовок страницы (EN):',
          initial: (prev, values) => this.toTitleCase(values.name || ''),
        },
        {
          type: 'text',
          name: 'titleRu',
          message: 'Заголовок страницы (RU):',
          initial: (prev, values) => values.title || '',
        },
        {
          type: 'confirm',
          name: 'confirm',
          message: 'Создать модуль?',
          initial: true,
        },
      ],
      {
        onCancel: () => {
          console.log(chalk.yellow('\nСоздание модуля отменено.'));
          return null;
        },
      },
    );

    if (!answers || !answers.confirm) {
      return null;
    }

    return answers;
  }

  /**
   * Генерация модуля из шаблонов
   */
  async generateModule(answers) {
    const modulePath = path.join(this.packagesDir, answers.name);

    // Подготовка переменных для замены
    const variables = {
      '{{MODULE_NAME}}': answers.name,
      '{{MODULE_NAME_VAR}}': answers.name.replace(/-/g, '_'), // Для валидных JS идентификаторов
      '{{MODULE_SCOPE_NAME}}': `module-${answers.name}`,
      '{{MODULE_NAME_UPPER}}': this.toUpperSnakeCase(answers.name),
      '{{MODULE_DESCRIPTION}}': answers.description,
      '{{MODULE_AUTHOR}}': answers.author,
      '{{MODULE_TITLE}}': answers.title,
      '{{MODULE_TITLE_RU}}': answers.titleRu,
      '{{MODULE_BASE_URL}}': `/modules/${answers.name}/`,
      '{{YEAR}}': new Date().getFullYear().toString(),
    };

    await this.copyTemplateDir(this.templatesDir, modulePath, variables);
  }

  /**
   * Рекурсивное копирование директории шаблонов с заменой переменных
   */
  async copyTemplateDir(src, dest, variables) {
    fs.mkdirSync(dest, { recursive: true });

    const entries = fs.readdirSync(src, { withFileTypes: true });

    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);

      // Убираем .template из имени файла
      let destName = entry.name.replace(/\.template$/, '');
      const destPath = path.join(dest, destName);

      if (entry.isDirectory()) {
        await this.copyTemplateDir(srcPath, destPath, variables);
      } else {
        let content = fs.readFileSync(srcPath, 'utf-8');

        // Замена переменных в содержимом
        for (const [key, value] of Object.entries(variables)) {
          const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          content = content.replace(new RegExp(escapedKey, 'g'), value);
        }

        // Замена переменных в имени файла
        for (const [key, value] of Object.entries(variables)) {
          const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          destName = destName.replace(new RegExp(escapedKey, 'g'), value);
        }

        const finalDestPath = path.join(path.dirname(destPath), destName);
        fs.writeFileSync(finalDestPath, content, 'utf-8');
      }
    }
  }

  /**
   * Установка зависимостей
   */
  async installDependencies(moduleName) {
    // Устанавливаем зависимости в корне проекта (npm workspaces)
    try {
      // Используем --legacy-peer-deps для обхода конфликтов peer dependencies
      execSync('npm install --legacy-peer-deps', {
        cwd: path.resolve(__dirname, '../..'),
        stdio: 'pipe',
      });
    } catch (error) {
      // Если установка не удалась, это не критично - зависимости можно установить вручную
      console.log(
        chalk.yellow('\n⚠️  Не удалось автоматически установить зависимости.'),
      );
      console.log(
        chalk.gray(
          'Вы можете установить их вручную: npm install --legacy-peer-deps\n',
        ),
      );
      // Не пробрасываем ошибку дальше, так как модуль уже создан
    }
  }

  /**
   * Вывод информации об успешном создании
   */
  printSuccess(answers) {
    console.log(
      chalk.green.bold(`\n✅ Модуль '${answers.name}' успешно создан!\n`),
    );
    console.log(`📁 Путь: ${chalk.cyan(`packages/${answers.name}/`)}\n`);
    console.log('Создана структура:');
    console.log('  ✓ MVVM архитектура (models, usecases, view, viewmodels)');
    console.log(
      '  ✓ Конфигурационные файлы (package.json, vite.config, tsconfig)',
    );
    console.log('  ✓ Module Federation настройки');
    console.log('  ✓ Базовый роут и компонент');
    console.log('  ✓ i18n переводы (en, ru)');
    console.log('  ✓ DI конфигурация');
    console.log('\nСледующие шаги:');
    console.log(
      `  1. Добавить модуль в ${chalk.cyan('host/src/modules/modules.ts')}`,
    );
    console.log('  2. Реализовать бизнес-логику в src/usecases/');
    console.log('  3. Создать view-модели в src/viewmodels/');
    console.log('  4. Добавить модуль в конфигурацию запуска (npm start)');
  }

  /**
   * Предложение открыть модуль в редакторе
   */
  async offerOpenInEditor(moduleName) {
    const { open } = await prompts({
      type: 'confirm',
      name: 'open',
      message: 'Открыть папку в редакторе?',
      initial: true,
    });

    if (open) {
      const modulePath = path.join(this.packagesDir, moduleName);
      try {
        // Пробуем открыть в VSCode
        execSync(`code ${modulePath}`, { stdio: 'ignore' });
      } catch {
        try {
          // Пробуем открыть в Cursor
          execSync(`cursor ${modulePath}`, { stdio: 'ignore' });
        } catch {
          console.log(
            chalk.yellow('Не удалось открыть редактор автоматически'),
          );
        }
      }
    }
  }

  /**
   * Главный метод создания модуля
   */
  async create() {
    console.log(chalk.cyan.bold('\n🆕 Создание нового MFE модуля\n'));

    // Сбор информации
    const answers = await this.collectInfo();
    if (!answers) {
      return null;
    }

    // Создание модуля
    const spinner = ora('Создание структуры модуля...').start();

    try {
      await this.generateModule(answers);
      spinner.succeed('Структура модуля создана');

      // Установка зависимостей (не критично, если не удастся)
      spinner.start('Установка зависимостей...');
      try {
        await this.installDependencies(answers.name);
        spinner.succeed('Зависимости установлены');
      } catch (error) {
        // Ошибка уже обработана в installDependencies, просто останавливаем спиннер
        spinner.stop();
      }

      this.printSuccess(answers);

      // Предложить открыть в редакторе
      await this.offerOpenInEditor(answers.name);

      return answers.name;
    } catch (error) {
      spinner.fail('Ошибка при создании модуля');
      console.error(chalk.red(error.message));
      if (error.stack) {
        console.error(chalk.gray(error.stack));
      }

      // Проверяем, был ли модуль создан хотя бы частично
      const modulePath = path.join(this.packagesDir, answers.name);
      if (fs.existsSync(modulePath)) {
        console.log(
          chalk.yellow(`\n⚠️  Модуль частично создан в ${modulePath}`),
        );
        console.log(
          chalk.gray('Вы можете удалить его вручную или исправить ошибки.\n'),
        );
      }

      return null;
    }
  }
}
