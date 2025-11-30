# Задача 005: Генератор MFE модулей

## Статус: ⚪ Не начата

## Описание

Создание интерактивного генератора новых MFE модулей. Генератор создает полную структуру модуля по шаблону, включая MVVM архитектуру, конфигурационные файлы, Vite конфигурацию и базовые компоненты.

## Зависимости

- **Задача 002**: Централизованная Vite конфигурация (для шаблонов конфигов)
- **Задача 003**: Базовая структура CLI Runner (для интеграции в меню)

## Подзадачи

### 1. Создание структуры шаблонов

- [ ] Создать директорию `scripts/templates/module/`
- [ ] Создать структуру файлов шаблона:
  ```
  scripts/templates/module/
  ├── package.json.template
  ├── vite.config.mts.template
  ├── vite.config.local.mts.template
  ├── tsconfig.json.template
  ├── README.md.template
  └── src/
      ├── config/
      │   ├── module_config.ts.template
      │   ├── routes.ts.template
      │   ├── di.config.ts.template
      │   ├── di.tokens.ts.template
      │   └── i18n/
      │       ├── en.json.template
      │       └── ru.json.template
      ├── models/
      │   └── .gitkeep
      ├── usecases/
      │   └── .gitkeep
      ├── view/
      │   ├── index.ts.template
      │   └── pages/
      │       └── HomePage.tsx.template
      └── viewmodels/
          └── .gitkeep
  ```

### 2. Создание шаблона package.json

- [ ] Создать `scripts/templates/module/package.json.template`:
  ```json
  {
    "name": "@platform/module-{{MODULE_NAME}}",
    "version": "1.0.0",
    "description": "{{MODULE_DESCRIPTION}}",
    "author": "{{MODULE_AUTHOR}}",
    "type": "module",
    "main": "src/config/module_config.ts",
    "scripts": {
      "dev": "vite",
      "build": "vite build",
      "preview": "vite preview"
    },
    "peerDependencies": {
      "react": "^19.0.0",
      "@platform/core": "workspace:*",
      "@platform/ui": "workspace:*",
      "@platform/common": "workspace:*"
    },
    "devDependencies": {
      "@platform/vite-config": "workspace:*",
      "@originjs/vite-plugin-federation": "^1.4.1",
      "typescript": "~5.9.3",
      "vite": "^7.2.1"
    }
  }
  ```

### 3. Создание шаблона Vite конфигурации

- [ ] Создать `scripts/templates/module/vite.config.mts.template`:

  ```typescript
  import { defineConfig } from 'vite';
  import { createModuleConfig } from '@platform/vite-config';

  export default defineConfig(
    createModuleConfig({
      dirname: __dirname,
      moduleName: '{{MODULE_SCOPE_NAME}}',
    }),
  );
  ```

- [ ] Создать `scripts/templates/module/vite.config.local.mts.template`:
  ```typescript
  /**
   * Локальная конфигурация Module Federation для {{MODULE_NAME}} модуля
   */
  export default {
    name: '{{MODULE_SCOPE_NAME}}',
    exposes: {},
    shared: {},
    base: process.env.NODE_ENV === 'production' ? '{{MODULE_BASE_URL}}' : '/',
    remotes: {},
  };
  ```

### 4. Создание шаблона module_config.ts

- [ ] Создать `scripts/templates/module/src/config/module_config.ts.template`:

  ```typescript
  import type { ModuleConfig } from '@platform/host-types';
  import { ROUTES } from './routes';
  import { registerDI } from './di.config';
  import en from './i18n/en.json';
  import ru from './i18n/ru.json';

  const config: ModuleConfig = {
    ROUTES,
    I18N: (i18n) => {
      i18n.addResourceBundle('en', '{{MODULE_NAME}}', en);
      i18n.addResourceBundle('ru', '{{MODULE_NAME}}', ru);
    },
    onModuleInit: (bootstrap) => {
      registerDI(bootstrap.getDI);
      console.log('Module {{MODULE_NAME}} initialized');
    },
  };

  export default config;
  ```

### 5. Создание шаблона routes.ts

- [ ] Создать `scripts/templates/module/src/config/routes.ts.template`:

  ```typescript
  import { lazy } from 'react';
  import type { IRoute } from '@platform/core';

  export const ROUTES = (): IRoute[] => [
    {
      name: '{{MODULE_NAME}}',
      path: '/{{MODULE_NAME}}',
      component: lazy(() => import('../view/pages/HomePage')),
      meta: {
        title: '{{MODULE_TITLE}}',
        icon: 'Home',
      },
    },
  ];
  ```

### 6. Создание шаблона HomePage.tsx

- [ ] Создать `scripts/templates/module/src/view/pages/HomePage.tsx.template`:

  ```tsx
  import { observer } from 'mobx-react-lite';
  import { Box, Typography, Paper } from '@platform/ui';
  import { useTranslation } from 'react-i18next';

  const HomePage = observer(() => {
    const { t } = useTranslation('{{MODULE_NAME}}');

    return (
      <Box sx={{ p: 3 }}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h4" gutterBottom>
            {t('title')}
          </Typography>
          <Typography variant="body1">{t('description')}</Typography>
        </Paper>
      </Box>
    );
  });

  export default HomePage;
  ```

### 7. Создание шаблонов i18n

- [ ] Создать `scripts/templates/module/src/config/i18n/en.json.template`:
  ```json
  {
    "title": "{{MODULE_TITLE}}",
    "description": "Welcome to {{MODULE_NAME}} module"
  }
  ```
- [ ] Создать `scripts/templates/module/src/config/i18n/ru.json.template`:
  ```json
  {
    "title": "{{MODULE_TITLE_RU}}",
    "description": "Добро пожаловать в модуль {{MODULE_NAME}}"
  }
  ```

### 8. Создание шаблонов DI

- [ ] Создать `scripts/templates/module/src/config/di.config.ts.template`:

  ```typescript
  import type { Container } from 'inversify';

  export function registerDI(container: Container): void {
    // Регистрация зависимостей модуля
    // container.bind(TOKENS.SomeService).to(SomeService);
  }
  ```

- [ ] Создать `scripts/templates/module/src/config/di.tokens.ts.template`:
  ```typescript
  export const TOKENS = {
    // Определите токены для DI здесь
    // SomeService: Symbol.for('{{MODULE_NAME}}.SomeService'),
  };
  ```

### 9. Создание module-generator.mjs

- [ ] Создать `scripts/launcher/module-generator.mjs`:

  ```javascript
  import fs from 'fs';
  import path from 'path';
  import prompts from 'prompts';
  import chalk from 'chalk';
  import ora from 'ora';
  import { execSync } from 'child_process';
  import { fileURLToPath } from 'url';

  const __dirname = path.dirname(fileURLToPath(import.meta.url));

  export class ModuleGenerator {
    constructor() {
      this.templatesDir = path.resolve(__dirname, '../templates/module');
      this.packagesDir = path.resolve(__dirname, '../../packages');
    }

    async create() {
      console.log(chalk.cyan.bold('\n🆕 Создание нового MFE модуля\n'));

      // Сбор информации
      const answers = await this.collectInfo();
      if (!answers) return null;

      // Создание модуля
      const spinner = ora('Создание структуры модуля...').start();

      try {
        await this.generateModule(answers);
        spinner.succeed('Структура модуля создана');

        // Установка зависимостей
        spinner.start('Установка зависимостей...');
        await this.installDependencies(answers.name);
        spinner.succeed('Зависимости установлены');

        this.printSuccess(answers);

        // Предложить открыть в редакторе
        await this.offerOpenInEditor(answers.name);

        return answers.name;
      } catch (error) {
        spinner.fail('Ошибка при создании модуля');
        console.error(chalk.red(error.message));
        return null;
      }
    }

    async collectInfo() {
      return prompts(
        [
          {
            type: 'text',
            name: 'name',
            message: 'Название модуля (kebab-case):',
            validate: (value) => {
              if (!/^[a-z][a-z0-9-]*$/.test(value)) {
                return 'Используйте kebab-case (например: todo-list)';
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
            initial: process.env.USER || 'Developer',
          },
          {
            type: 'text',
            name: 'title',
            message: 'Заголовок страницы (EN):',
            initial: (prev, values) => this.toTitleCase(values.name),
          },
          {
            type: 'text',
            name: 'titleRu',
            message: 'Заголовок страницы (RU):',
            initial: (prev, values) => values.title,
          },
          {
            type: 'confirm',
            name: 'confirm',
            message: 'Создать модуль?',
            initial: true,
          },
        ],
        {
          onCancel: () => null,
        },
      );
    }

    toTitleCase(str) {
      return str
        .split('-')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    }

    async generateModule(answers) {
      const modulePath = path.join(this.packagesDir, answers.name);
      const variables = {
        '{{MODULE_NAME}}': answers.name,
        '{{MODULE_SCOPE_NAME}}': `module-${answers.name}`,
        '{{MODULE_DESCRIPTION}}': answers.description,
        '{{MODULE_AUTHOR}}': answers.author,
        '{{MODULE_TITLE}}': answers.title,
        '{{MODULE_TITLE_RU}}': answers.titleRu,
        '{{MODULE_BASE_URL}}': `/modules/${answers.name}/`,
        '{{YEAR}}': new Date().getFullYear().toString(),
      };

      await this.copyTemplateDir(this.templatesDir, modulePath, variables);
    }

    async copyTemplateDir(src, dest, variables) {
      fs.mkdirSync(dest, { recursive: true });

      const entries = fs.readdirSync(src, { withFileTypes: true });

      for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        let destName = entry.name.replace('.template', '');
        const destPath = path.join(dest, destName);

        if (entry.isDirectory()) {
          await this.copyTemplateDir(srcPath, destPath, variables);
        } else {
          let content = fs.readFileSync(srcPath, 'utf-8');

          // Замена переменных
          for (const [key, value] of Object.entries(variables)) {
            content = content.replace(new RegExp(key, 'g'), value);
          }

          fs.writeFileSync(destPath, content);
        }
      }
    }

    async installDependencies(moduleName) {
      const modulePath = path.join(this.packagesDir, moduleName);
      execSync('npm install', { cwd: process.cwd(), stdio: 'ignore' });
    }

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
      console.log('\nСледующие шаги:');
      console.log(
        `  1. Добавить модуль в ${chalk.cyan('host/src/modules/modules.ts')}`,
      );
      console.log('  2. Реализовать бизнес-логику в src/usecases/');
      console.log('  3. Создать view-модели в src/viewmodels/');
      console.log('  4. Добавить модуль в конфигурацию запуска (npm start)');
    }

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
          execSync(`code ${modulePath}`, { stdio: 'ignore' });
        } catch {
          try {
            execSync(`cursor ${modulePath}`, { stdio: 'ignore' });
          } catch {
            console.log(chalk.yellow('Не удалось открыть редактор'));
          }
        }
      }
    }
  }
  ```

### 10. Интеграция с CLI Runner

- [ ] Добавить в `dev-runner.mjs`:

  ```javascript
  import { ModuleGenerator } from './launcher/module-generator.mjs';

  // В главном меню добавить обработку
  if (action === 'create-module') {
    const generator = new ModuleGenerator();
    const moduleName = await generator.create();

    if (moduleName) {
      // Обновить список модулей
      await moduleDiscovery.refresh();
    }
  }
  ```

### 11. Создание tsconfig.json шаблона

- [ ] Создать `scripts/templates/module/tsconfig.json.template`:
  ```json
  {
    "extends": "../../tsconfig.base.json",
    "compilerOptions": {
      "composite": true,
      "outDir": "./dist",
      "rootDir": "./src"
    },
    "include": ["src/**/*"],
    "exclude": ["node_modules", "dist"]
  }
  ```

### 12. Тестирование генератора

- [ ] Запустить `npm start` и выбрать "Создать новый MFE модуль"
- [ ] Проверить создание структуры файлов
- [ ] Проверить корректность замены переменных в шаблонах
- [ ] Проверить установку зависимостей
- [ ] Проверить, что созданный модуль компилируется без ошибок
- [ ] Проверить запуск приложения с новым модулем

## Definition of Done (DoD)

1. ✅ Структура шаблонов создана в `scripts/templates/module/`
2. ✅ Все шаблоны содержат корректные плейсхолдеры
3. ✅ `ModuleGenerator` класс реализован и работает
4. ✅ Генератор интегрирован в CLI Runner меню
5. ✅ Валидация имени модуля работает (kebab-case, уникальность)
6. ✅ Переменные в шаблонах заменяются корректно
7. ✅ Зависимости устанавливаются автоматически
8. ✅ Сгенерированный модуль имеет полную MVVM структуру
9. ✅ Сгенерированный модуль компилируется без ошибок
10. ✅ i18n файлы создаются для en и ru локалей

## Структура сгенерированного модуля

```
packages/my-module/
├── package.json
├── tsconfig.json
├── vite.config.mts
├── vite.config.local.mts
├── README.md
└── src/
    ├── config/
    │   ├── module_config.ts
    │   ├── routes.ts
    │   ├── di.config.ts
    │   ├── di.tokens.ts
    │   └── i18n/
    │       ├── en.json
    │       └── ru.json
    ├── models/
    │   └── .gitkeep
    ├── usecases/
    │   └── .gitkeep
    ├── view/
    │   ├── index.ts
    │   └── pages/
    │       └── HomePage.tsx
    └── viewmodels/
        └── .gitkeep
```

## UX Flow

```
$ npm start
→ Создать новый MFE модуль

🆕 Создание нового MFE модуля

Название модуля (kebab-case): my-feature
Описание модуля: My Feature Module
Автор: Developer
Заголовок страницы (EN): My Feature
Заголовок страницы (RU): Моя функция
Создать модуль? (Y/n) y

⠋ Создание структуры модуля...
✔ Структура модуля создана
⠋ Установка зависимостей...
✔ Зависимости установлены

✅ Модуль 'my-feature' успешно создан!

📁 Путь: packages/my-feature/

Создана структура:
  ✓ MVVM архитектура (models, usecases, view, viewmodels)
  ✓ Конфигурационные файлы (package.json, vite.config, tsconfig)
  ✓ Module Federation настройки
  ✓ Базовый роут и компонент
  ✓ i18n переводы (en, ru)

Следующие шаги:
  1. Добавить модуль в host/src/modules/modules.ts
  2. Реализовать бизнес-логику в src/usecases/
  3. Создать view-модели в src/viewmodels/
  4. Добавить модуль в конфигурацию запуска (npm start)

Открыть папку в редакторе? (Y/n) y
```

## Риски и митигация

| Риск                         | Вероятность | Влияние | Митигация                                |
| ---------------------------- | ----------- | ------- | ---------------------------------------- |
| Некорректные шаблоны         | Средняя     | Среднее | Тщательное тестирование каждого шаблона  |
| Ошибки при замене переменных | Низкая      | Среднее | Регулярные выражения с глобальным флагом |
| Проблемы с путями на Windows | Средняя     | Среднее | Использование path.resolve везде         |

## Время выполнения

Ожидаемое время: **6-8 часов**

## Примечания

- Генератор следует архитектуре существующих модулей (todo, api_example)
- Шаблоны используют плейсхолдеры в формате `{{VARIABLE_NAME}}`
- После генерации модуль нужно вручную добавить в `host/src/modules/modules.ts`
- В будущем можно добавить автоматическое обновление modules.ts
