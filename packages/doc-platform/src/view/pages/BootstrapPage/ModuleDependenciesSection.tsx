import { type FC } from 'react';
import { DocSection, DocCodeBlock, DocList } from '../../common';

export const ModuleDependenciesSection: FC = () => (
  <DocSection title="Зависимости модулей">
    <DocSection title="Конфигурация">
      <DocCodeBlock
        code={`// module_config.ts
export default {
  mockModuleInfo: {
    name: 'my-module',
    dependencies: ['auth', 'catalog'], // Модули, которые должны быть загружены первыми
  },
} as ModuleConfig;`}
        language="typescript"
      />
    </DocSection>
    <DocSection title="DEV режим">
      <DocList
        items={[
          'Модули регистрируются вручную в host/src/modules/modules.ts',
          'Зависимости проверяются и резолвятся при загрузке',
          'Все модули доступны локально',
        ]}
      />
    </DocSection>
    <DocSection title="PROD режим">
      <DocList
        items={[
          'Модули загружаются из манифеста',
          'Манифест содержит информацию о всех модулях и их зависимостях',
          'Зависимости резолвятся динамически',
          'Модули могут быть развернуты независимо',
        ]}
      />
    </DocSection>
    <DocSection title="Уровни зависимостей">
      <DocCodeBlock
        code={`// Пример структуры зависимостей
Level 0: core, layout, auth     // Базовые модули
Level 1: user, settings         // Зависят от Level 0
Level 2: dashboard, reports     // Зависят от Level 1
Level 3: analytics              // Зависит от Level 2

// Порядок загрузки:
// 1. Загружаются все модули Level 0 параллельно
// 2. После завершения Level 0 загружаются модули Level 1 параллельно
// 3. И так далее...`}
        language="typescript"
      />
    </DocSection>
    <DocSection title="Правила зависимостей">
      <DocList
        items={[
          '✅ NORMAL модуль может зависеть от NORMAL модулей',
          '✅ NORMAL модуль может зависеть от INIT модулей',
          '❌ INIT модуль НЕ может зависеть от других модулей',
          '❌ Циклические зависимости запрещены',
          '❌ Транзитивные зависимости неявны (A → B → C означает A зависит от C)',
        ]}
      />
    </DocSection>
    <DocSection title="Транзитивные зависимости">
      <DocCodeBlock
        code={`// Пример транзитивных зависимостей
// A зависит от B, B зависит от C
// Следовательно, A зависит и от C

// Правильный подход: указать все прямые зависимости
export default {
  mockModuleInfo: {
    name: 'module-a',
    dependencies: ['module-b'], // Прямая зависимость
  },
} as ModuleConfig;

export default {
  mockModuleInfo: {
    name: 'module-b',
    dependencies: ['module-c'], // Прямая зависимость
  },
} as ModuleConfig;

export default {
  mockModuleInfo: {
    name: 'module-c',
    dependencies: [], // Базовый модуль
  },
} as ModuleConfig;

// Порядок загрузки: C → B → A`}
        language="typescript"
      />
    </DocSection>
  </DocSection>
);
