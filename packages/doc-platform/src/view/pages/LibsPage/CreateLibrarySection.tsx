import { type FC } from 'react';
import { DocSection, DocCodeBlock, DocList, DocNote } from '../../common';

export const CreateLibrarySection: FC = () => (
  <DocSection title="Create Library">
    <DocSection title="Когда создавать библиотеку">
      <p>Создавайте библиотеку, если:</p>
      <DocList
        items={[
          'Несколько модулей используют один и тот же код',
          'Код переиспользуется и имеет четкую область ответственности',
          'Хотите изолировать и независимо тестировать функциональность',
          'Код может использоваться как внешняя зависимость',
        ]}
      />
    </DocSection>
    <DocSection title="Структура библиотеки">
      <DocCodeBlock
        code={`my-lib/
├── src/
│   └── index.ts    # Экспорт всех публичных API
├── package.json
├── tsconfig.json
├── tsconfig.base.json
├── vite.config.mts
├── vitest.config.ts
└── README.md`}
        language="text"
      />
    </DocSection>
    <DocSection title="package.json">
      <DocCodeBlock
        code={`{
  "name": "@platform/my-lib",
  "version": "1.0.0",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "files": [
    "dist"
  ],
  "scripts": {
    "build": "vite build",
    "test": "vitest",
    "lint": "eslint src --ext .ts,.tsx"
  },
  "peerDependencies": {
    "@platform/core": "*",
    "@platform/ui": "*",
    "react": "^19",
    "react-dom": "^19"
  },
  "dependencies": {
    "@platform/core": "*"
  },
  "devDependencies": {
    "typescript": "*",
    "vite": "*",
    "vitest": "*"
  }
}`}
        language="json"
      />
      <DocList
        items={[
          'name: должен начинаться с @platform/',
          'main: путь к собранному файлу',
          'types: путь к .d.ts файлу',
          'files: файлы для публикации',
        ]}
      />
    </DocSection>
    <DocSection title="src/index.ts">
      <p>Экспортируйте только публичное API библиотеки.</p>
      <DocCodeBlock
        code={`// Экспорт типов
export type { MyType } from './types';

// Экспорт функций
export { myFunction } from './functions';

// Экспорт компонентов
export { MyComponent } from './components';

// Экспорт констант
export { MY_CONSTANT } from './constants';`}
        language="typescript"
      />
    </DocSection>
    <DocSection title="vite.config.mts">
      <DocCodeBlock
        code={`import { defineConfig } from 'vite';
import { createViteConfig } from '@platform/vite-config';
import dts from 'vite-plugin-dts';

export default defineConfig(
  createViteConfig({
    type: 'lib',
    dirname: __dirname,
    plugins: [
      dts({
        rollupTypes: true,
      }),
    ],
  }),
);`}
        language="typescript"
      />
      <DocList
        items={[
          'type: lib',
          'dts плагин для генерации типов',
          'rollupTypes: true для объединения типов',
        ]}
      />
    </DocSection>
    <DocSection title="Регистрация алиаса">
      <p>Добавьте алиас в `tsconfig.base.json`:</p>
      <DocCodeBlock
        code={`{
  "compilerOptions": {
    "paths": {
      "@platform/my-lib": ["libs/my-lib/src"]
    }
  }
}`}
        language="json"
      />
      <p>Или автоматически:</p>
      <DocCodeBlock code={`npm run sync:tsconfig-paths`} language="bash" />
    </DocSection>
    <DocSection title="npm workspaces">
      <p>Библиотеки автоматически включаются в workspaces:</p>
      <DocCodeBlock
        code={`// package.json (root)
{
  "workspaces": [
    "libs/*",
    "packages/*"
  ]
}`}
        language="json"
      />
    </DocSection>
    <DocSection title="Порядок зависимостей">
      <p>Соблюдайте порядок зависимостей:</p>
      <DocCodeBlock
        code={`core
  ↓
common
  ↓
ui
  ↓
share
  ↓
my-lib
  ↓
modules`}
        language="text"
      />
      <DocList
        items={[
          'Библиотеки не должны зависеть от модулей',
          'ui не должен зависеть от common',
          'share может зависеть от ui',
          'my-lib может зависеть от любых библиотек',
        ]}
      />
    </DocSection>
    <DocSection title="Module Federation sharing">
      <p>Для использования в remote модулях, настройте shared scope:</p>
      <DocCodeBlock
        code={`// config/vite-config/host.config.js
export const createViteConfig = () => {
  return {
    module: {
      rules: [
        // ...
      ],
    },
    plugins: [
      federation({
        name: 'host',
        remotes: {
          // ...
        },
        shared: {
          react: { singleton: true },
          'react-dom': { singleton: true },
          '@platform/core': { singleton: true },
          '@platform/ui': { singleton: true },
          '@platform/my-lib': { singleton: true }, // Ваша библиотека
        },
      }),
    ],
  };
};`}
        language="javascript"
      />
    </DocSection>
    <DocSection title="Регистрация в FederationSharedHandler">
      <p>Зарегистрируйте библиотеку для автоматического шаринга:</p>
      <DocCodeBlock
        code={`// host/src/bootstrap/handlers/federation-shared.handler.ts
import { initFederationSharedDev } from '@platform/core';

export const initFederationSharedDev = (
  __webpack_share_scopes__: any,
) => {
  __webpack_share_scopes__.default.init({
    react: { requiredVersion: '^19' },
    'react-dom': { requiredVersion: '^19' },
    '@platform/core': { singleton: true, eager: true },
    '@platform/ui': { singleton: true, eager: true },
    '@platform/my-lib': { singleton: true, eager: true }, // Ваша библиотека
  });
};

// PROD
export const initFederationSharedProd = async () => {
  const manifest = await loadManifest();
  return {
    '@platform/my-lib': manifest.shared['@platform/my-lib'],
  };
};`}
        language="typescript"
      />
    </DocSection>
    <DocNote type="warning" title="Важно">
      Добавляйте библиотеку в shared scope если она используется в remote
      модулях и содержит React контексты, состояние или глобальные зависимости.
    </DocNote>
  </DocSection>
);
