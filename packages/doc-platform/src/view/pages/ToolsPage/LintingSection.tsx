import { type FC } from 'react';
import { DocSection, DocCodeBlock, DocList, DocNote } from '../../common';

/**
 * Секция документации по инструментам линтинга кода.
 * Содержит информацию о командах ESLint, конфигурации, интеграции с IDE
 * и настройке правил.
 *
 * @component
 */
export const LintingSection: FC = () => (
  <DocSection title="Linting">
    <DocSection title="Команды">
      <DocCodeBlock
        code={`# Линтинг всего проекта
npm run lint

# Линтинг хоста
npm run lint:host

# Линтинг всех библиотек
npm run lint:libs

# Линтинг всех модулей
npm run lint:modules

# Линтинг конкретного модуля/библиотеки
npm run lint:modules -- --name=todo
npm run lint:libs -- --name=core

# Линтинг всех модулей параллельно
npm run lint:modules -- --all --parallel

# Исправить ошибки автоматически
npm run lint -- --fix

# Подробный вывод
npm run lint -- --verbose`}
        language="bash"
      />
    </DocSection>

    <DocSection title="Конфигурация ESLint">
      <p>Используйте `createEslintConfig` фабрику:</p>

      <DocCodeBlock
        code={`// .eslintrc.js
const { createEslintConfig } = require('@platform/eslint-config');

module.exports = createEslintConfig({
  type: 'module', // 'host' | 'lib' | 'module'
  tsconfigPath: './tsconfig.base.json',
  localConfigPath: './.eslintrc.local.js', // Опционально
});`}
        language="javascript"
      />

      <p>Типы конфигураций:</p>

      <DocList
        items={[
          'base - базовые правила',
          'host - правила для хоста',
          'lib - правила для библиотек',
          'module - правила для модулей',
        ]}
      />
    </DocSection>

    <DocSection title="Локальная конфигурация">
      <p>Создайте `.eslintrc.local.js` для локальных правил:</p>

      <DocCodeBlock
        code={`// .eslintrc.local.js
module.exports = {
  rules: {
    // Добавить правило
    'no-console': 'warn',

    // Отключить правило
    'prefer-const': 'off',

    // Переопределить правило
    'max-len': ['error', { code: 120 }],
  },
};`}
        language="javascript"
      />

      <p>Локальная конфигурация мёржится с базовой.</p>
    </DocSection>

    <DocSection title="Игнорирование файлов">
      <p>Создайте `.eslintignore`:</p>

      <DocCodeBlock
        code={`dist/
node_modules/
*.config.js
*.config.mjs
coverage/
.vitest/
*.stories.tsx`}
        language="text"
      />
    </DocSection>

    <DocSection title="Интеграция с IDE">
      <p>VS Code:</p>

      <DocCodeBlock
        code={`// .vscode/settings.json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "eslint.workingDirectories": [
    {
      "directory": "host",
      "changeProcessCWD": true
    },
    {
      "directory": "packages",
      "changeProcessCWD": true
    },
    {
      "directory": "libs",
      "changeProcessCWD": true
    }
  ]
}`}
        language="json"
      />

      <p>WebStorm:</p>

      <DocCodeBlock
        code={`Settings → Languages & Frameworks → JavaScript → Code Quality Tools → ESLint
→ Automatic ESLint configuration`}
        language="text"
      />
    </DocSection>

    <DocSection title="Скрипт lint-module.mjs">
      <p>Параметры скрипта:</p>

      <DocCodeBlock
        code={`node scripts/lint-module.mjs [options]

Options:
  --name, -n      Имя модуля/библиотеки
  --all, -a       Все модули/библиотеки
  --parallel, -p  Параллельный линтинг
  --fix, -f       Исправить ошибки
  --verbose, -v    Подробный вывод`}
        language="bash"
      />
    </DocSection>

    <DocNote type="warning" title="Важно">
      Всегда выполняйте <code>npm run lint</code> перед коммитом. Используйте
      <code>--fix</code> для автоматического исправления ошибок.
    </DocNote>
  </DocSection>
);
