import { type FC } from 'react';
import {
  DocSection,
  DocCodeBlock,
  DocList,
  DocTable,
  DocNote,
} from '../../common';

export const ModuleTypesSection: FC = () => (
  <DocSection title="Типы модулей">
    <DocSection title="Классификация модулей">
      <p>Модули классифицируются по двум признакам:</p>
      <DocList
        items={[
          'По типу загрузки: INIT vs NORMAL',
          'По расположению: Local vs MFE',
        ]}
      />
    </DocSection>
    <DocSection title="INIT vs NORMAL">
      <DocTable
        columns={[
          { header: 'Характеристика', key: 'characteristic' },
          { header: 'INIT модуль', key: 'init' },
          { header: 'NORMAL модуль', key: 'normal' },
        ]}
        rows={[
          {
            characteristic: 'Когда загружается',
            init: 'До рендера UI',
            normal: 'После рендера UI',
          },
          {
            characteristic: 'Способ загрузки',
            init: 'Синхронно, последовательно',
            normal: 'Асинхронно, параллельно по уровням',
          },
          {
            characteristic: 'loadCondition',
            init: 'Не поддерживается',
            normal: 'Поддерживается (dependencies, featureFlags, permissions)',
          },
          {
            characteristic: 'Когда использовать',
            init: 'Базовая функциональность, core, layout, auth',
            normal: 'Бизнес-модули, todo, dashboard, settings',
          },
        ]}
      />
    </DocSection>
    <DocSection title="Local vs MFE">
      <DocTable
        columns={[
          { header: 'Характеристика', key: 'characteristic' },
          { header: 'Local модуль', key: 'local' },
          { header: 'MFE модуль', key: 'mfe' },
        ]}
        rows={[
          {
            characteristic: 'Расположение',
            init: 'host/src/modules/',
            normal: 'packages/',
          },
          {
            characteristic: 'Сборка',
            init: 'Вместе с хостом',
            normal: 'Отдельно, независимый деплой',
          },
          {
            characteristic: 'Регистрация',
            init: 'Вручную в host/src/modules/modules.ts',
            normal: 'Автоматически через Launcher/manifest',
          },
          {
            characteristic: 'mockModuleInfo',
            init: 'Не требуется',
            normal: 'Обязателен',
          },
          {
            characteristic: 'Когда использовать',
            init: 'Простой модуль, базовая функциональность',
            normal: 'Бизнес-модуль, независимый деплой',
          },
        ]}
      />
    </DocSection>
    <DocSection title="Комбинации типов">
      <DocList
        items={[
          'INIT + Local - core, layout модули (host/src/modules/)',
          'INIT + MFE - auth, analytics (packages/)',
          'NORMAL + Local - простые фичи (host/src/modules/)',
          'NORMAL + MFE - бизнес-модули (packages/)',
        ]}
      />
    </DocSection>
    <DocSection title="Пример: INIT + Local">
      <DocCodeBlock
        code={`// host/src/modules/core/config/module_config.ts
export default {
  ROUTES: () => routes,
  onModuleInit: (bootstrap) => {
    DI_CONFIG(bootstrap.di);
  },
  I18N: (i18n) => {
    i18n.addResourceBundle('ru', 'core', ru);
  },
  // ✅ Нет mockModuleInfo - это Local модуль
} as ModuleConfig;

// ✅ Регистрация в host/src/modules/modules.ts
export const MODULES: Promise<ModuleConfig>[] = [
  import('./core/config/module_config'), // INIT + Local
];`}
        language="typescript"
      />
    </DocSection>
    <DocSection title="Пример: NORMAL + MFE">
      <DocCodeBlock
        code={`// packages/todo/config/module_config.ts
export default {
  ROUTES: () => routes,
  onModuleInit: (bootstrap) => {
    DI_CONFIG(bootstrap.di);
  },
  I18N: (i18n) => {
    i18n.addResourceBundle('ru', 'todo', ru);
  },
  // ✅ mockModuleInfo обязателен для MFE
  mockModuleInfo: {
    name: 'todo',
    loadType: 'normal',
    loadPriority: 10,
    dependencies: ['auth'],
    featureFlags: ['todo.enabled'],
    accessPermissions: ['todo.access'],
  },
} as ModuleConfig;

// ✅ Автоматическая регистрация через Launcher/manifest`}
        language="typescript"
      />
    </DocSection>
    <DocSection title="Как выбрать тип модуля">
      <DocCodeBlock
        code={`┌─────────────────────────────────────────────┐
│         Нужна базовая функциональность?      │
│         (core, layout, auth)                  │
│                    Да                          │
│                    ↓                           │
│          ┌─────────────────┐                  │
│          │   Модуль INIT    │                  │
│          └─────────────────┘                  │
│                    ↓                           │
│    ┌───────────────────────────────────┐       │
│    │   Нужен независимый деплой?      │       │
│    │           Да → MFE               │       │
│    │            Нет → Local           │       │
│    └───────────────────────────────────┘       │
└─────────────────────────────────────────────┘
         (нужна бизнес-логика)
                    ↓
          ┌─────────────────┐
          │  Модуль NORMAL   │
          └─────────────────┘
                    ↓
    ┌───────────────────────────────────┐
    │   Нужен независимый деплой?      │
    │           Да → MFE               │
    │            Нет → Local           │
    └───────────────────────────────────┘`}
        language="text"
      />
    </DocSection>
    <DocNote type="info" title="Рекомендации">
      <DocList
        items={[
          'Используйте INIT для критически важных модулей',
          'Используйте MFE для бизнес-модулей с независимым деплоем',
          'Используйте Local для простых модулей без сложных зависимостей',
          'START модулей можно 3-4 шт.',
          'NORMAL модулей можно 10+ шт.',
        ]}
      />
    </DocNote>
  </DocSection>
);
