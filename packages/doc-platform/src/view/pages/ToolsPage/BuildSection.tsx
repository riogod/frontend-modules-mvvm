import { type FC } from 'react';
import { DocSection, DocCodeBlock, DocList, DocNote } from '../../common';

/**
 * Секция документации по инструментам сборки проекта.
 * Содержит информацию о командах сборки, структуре dist, конфигурации Vite,
 * скриптах сборки и версионировании.
 *
 * @component
 */
export const BuildSection: FC = () => (
  <DocSection title="Build">
    <DocSection title="Команды сборки">
      <DocCodeBlock
        code={`# Сборка всех модулей + хоста
npm run build:all

# Сборка только хоста
npm run build:host

# Сборка всех модулей
npm run build:modules

# Сборка конкретного модуля
npm run build:module -- --name=todo

# Сборка с анализом бандла
npm run build:module -- --name=todo --analyze

# Сборка с verbose выводом
npm run build:module -- --name=todo --verbose`}
        language="bash"
      />
    </DocSection>

    <DocSection title="Структура dist">
      <DocCodeBlock
        code={`dist/
├── index.html              # Главный HTML файл
├── assets/                # Статические ресурсы
│   ├── index-[hash].js
│   └── index-[hash].css
└── modules/               # Загруженные модули
    ├── latest/             # Символическая ссылка на последнюю версию
    └── v1.0.0/            # Версионированная директория
        └── index.js`}
        language="text"
      />
    </DocSection>

    <DocSection title="Конфигурация Vite">
      <p>Использует `vite-config/host.config.js`:</p>

      <DocCodeBlock
        code={`import { createViteConfig } from '@platform/vite-config';

export default createViteConfig({
  type: 'host',
  dirname: __dirname,
  localConfigPath: './vite.config.local.mts',
});`}
        language="javascript"
      />

      <DocList
        items={[
          'emptyOutDir: false - сохраняет modules/ директорию',
          'Module Federation конфигурация',
          'Оптимизация бандла',
        ]}
      />
    </DocSection>

    <DocSection title="Скрипт сборки модуля">
      <p>build-module.mjs поддерживает параметры:</p>

      <DocCodeBlock
        code={`node scripts/build-module.mjs [options]

Options:
  --name, -n      Имя модуля для сборки
  --all, -a       Сборка всех модулей
  --parallel, -p  Параллельная сборка
  --analyze       Анализ бандла
  --verbose, -v   Подробный вывод`}
        language="bash"
      />
    </DocSection>

    <DocSection title="Версионирование">
      <p>Используйте скрипты для обновления версий:</p>

      <DocCodeBlock
        code={`# Обновить версию до major (1.0.0 → 2.0.0)
npm run version:major

# Обновить версию до minor (1.0.0 → 1.1.0)
npm run version:minor

# Обновить версию до patch (1.0.0 → 1.0.1)
npm run version:patch`}
        language="bash"
      />
    </DocSection>

    <DocNote type="info" title="Производительность">
      Используйте <code>--parallel</code> для ускорения сборки нескольких
      модулей. Используйте <code>--analyze</code> для анализа размера бандла.
    </DocNote>
  </DocSection>
);
