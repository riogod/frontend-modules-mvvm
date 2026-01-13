import { type FC } from 'react';
import { DocSection, DocCodeBlock, DocList, DocNote } from '../../common';

export const ModuleLoaderSection: FC = () => (
  <DocSection title="Загрузчик модулей">
    <DocSection title="Режимы загрузки">
      <DocCodeBlock
        code={`// DEV режим
export const ENV = 'dev';
// Модули загружаются через dev-runner
// Источник: host/src/modules/modules.ts

// PROD режим
export const ENV = 'prod';
// Модули загружаются из манифеста
// Источник: https://cdn.example.com/manifest.json`}
        language="typescript"
      />
    </DocSection>
    <DocSection title="Типы модулей">
      <DocList
        items={[
          'INIT модули - загружаются синхронно до рендера UI',
          'NORMAL модули - загружаются асинхронно после рендера UI',
        ]}
      />
    </DocSection>
    <DocSection title="Жизненный цикл модуля">
      <DocList
        items={[
          'pending - модуль ожидает загрузки',
          'loading - модуль загружается',
          'preloaded - модуль загружен, но не инициализирован',
          'loaded - модуль полностью загружен и инициализирован',
          'failed - ошибка при загрузке или инициализации',
        ]}
      />
    </DocSection>
    <DocSection title="preloadRoutes">
      <DocCodeBlock
        code={`// Предварительная загрузка маршрутов для быстрого старта
const preloadRoutes = [
  {
    path: '/dashboard',
    module: 'dashboard',
    priority: 10,
  },
  {
    path: '/settings',
    module: 'settings',
    priority: 5,
  },
];

// Эти модули будут загружены параллельно с основным модулем`}
        language="typescript"
      />
    </DocSection>
    <DocSection title="autoLoadModuleByRoute">
      <DocCodeBlock
        code={`// Автоматическая загрузка модуля при навигации
// Если модуль не загружен, он будет загружен динамически

// routes.ts
export const routes: IRoutes = [
  {
    name: 'todo',
    path: '/todo',
    pageComponent: lazy(() => import('../view/pages/TodoPage')),
    // При переходе на /todo модуль будет загружен автоматически
  },
];`}
        language="typescript"
      />
    </DocSection>
    <DocNote type="info" title="Производительность">
      Используйте <code>preloadRoutes</code> для критически важных модулей,{' '}
      которые должны быть доступны сразу. Остальные модули будут загружены
      лениво при навигации.
    </DocNote>
  </DocSection>
);
