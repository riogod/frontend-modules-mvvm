import { type FC } from 'react';
import { DocSection, DocCodeBlock, DocTable, DocNote } from '../../common';

export const CreatingModuleSection: FC = () => (
  <DocSection title="Создание модуля">
    <DocSection title="Типы модулей">
      <DocTable
        columns={[
          { header: 'Тип', key: 'type' },
          { header: 'Расположение', key: 'location' },
          { header: 'Регистрация', key: 'registration' },
          { header: 'Когда использовать', key: 'when' },
        ]}
        rows={[
          {
            type: 'MFE',
            location: 'packages/module-name/',
            registration: 'Автоматически через Launcher/manifest',
            when: 'Для бизнес-модулей, независимый деплой',
          },
          {
            type: 'Local',
            location: 'host/src/modules/module-name/',
            registration: 'Вручную в host/src/modules/modules.ts',
            when: 'Для базовой функциональности, простой модуль',
          },
        ]}
      />
    </DocSection>
    <DocSection title="Создание MFE модуля">
      <p>Рекомендуется использовать Launcher:</p>
      <DocCodeBlock
        code={`# Запустить Launcher
npm run launcher

# Или напрямую
node scripts/launcher/cli.mjs create my-module

# Ответьте на вопросы:
# - Module type: module
# - Module location: packages/
# - Module name: my-module
# - Create routes: yes
# - Create i18n: yes
# - Create mocks: yes

# Модуль будет создан в packages/my-module/`}
        language="bash"
      />
    </DocSection>
    <DocSection title="Создание Local модуля">
      <p>Может быть создан вручную или скопирован из MFE:</p>
      <DocCodeBlock
        code={`# 1. Создать директорию
mkdir -p host/src/modules/my-module

# 2. Скопировать структуру из MFE модуля
# packages/api_example/ → host/src/modules/my-module/

# 3. Зарегистрировать в host/src/modules/modules.ts
import { ModuleA } from './module-a/config/module_config';

export const MODULES = [
  ModuleA,
  // Добавить ваш модуль
  import('./my-module/config/module_config'),
];`}
        language="bash"
      />
    </DocSection>
    <DocSection title="Регистрация Local модуля">
      <DocCodeBlock
        code={`// host/src/modules/modules.ts
import type { ModuleConfig } from '@platform/core';

export const MODULES: Promise<ModuleConfig>[] = [
  // INIT модули
  import('./core/config/module_config'),
  import('./layout/config/module_config'),

  // NORMAL модули
  import('./todo/config/module_config'),
  import('./my-module/config/module_config'), // Ваш модуль
];`}
        language="typescript"
      />
    </DocSection>
    <DocSection title="Структура модуля">
      <DocCodeBlock
        code={`my-module/
├── src/
│   ├── config/
│   │   ├── module_config.ts    # Главная конфигурация
│   │   ├── routes.ts           # Маршруты
│   │   ├── di.config.ts        # DI конфигурация
│   │   ├── di.tokens.ts        # DI токены
│   │   ├── endpoints.ts        # API эндпоинты
│   │   └── i18n/               # Переводы
│   │       ├── en_my-module.json
│   │       └── ru_my-module.json
│   ├── models/                 # Model слой
│   ├── viewmodels/             # ViewModel слой
│   ├── usecases/               # Use Cases
│   ├── view/                   # React компоненты
│   │   ├── pages/
│   │   └── components/
│   └── data/                   # Repository, DTO, валидация
│       ├── entity.repository.ts
│       ├── entity.dto.ts
│       ├── entity.map.ts
│       └── validation/
│           └── entity.response.schema.ts
├── vite.config.mts
├── tsconfig.json
└── package.json`}
        language="text"
      />
    </DocSection>
    <DocNote type="info" title="Рекомендация">
      Используйте Launcher для создания модулей. Это обеспечит правильную
      структуру и конфигурацию.
    </DocNote>
  </DocSection>
);
