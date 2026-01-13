import { type FC } from 'react';
import { DocSection, DocCodeBlock, DocList } from '../../common';

export const BootstrapProcessSection: FC = () => (
  <DocSection title="Обзор процесса загрузки">
    <DocCodeBlock
      code={`import { bootstrap } from './bootstrap';

await bootstrap({
  config: {
    devServerUrl: 'http://localhost:3001',
    apiUrl: 'https://api.example.com',
  },
});`}
      language="typescript"
    />
    <DocList
      items={[
        'Загрузка конфигурации приложения',
        'Инициализация обработчиков (handlers)',
        'Загрузка INIT модулей (синхронно)',
        'Рендер UI',
        'Загрузка NORMAL модулей (асинхронно)',
      ]}
    />
    <DocSection title="INIT модули">
      <DocList
        items={[
          'Загружаются до рендера UI',
          'Загружаются синхронно и последовательно',
          'Не поддерживают loadCondition',
          'Используются для core функциональности, layout, auth',
        ]}
      />
    </DocSection>
    <DocSection title="NORMAL модули">
      <DocList
        items={[
          'Загружаются после рендера UI',
          'Загружаются асинхронно',
          'Поддерживают loadCondition (dependencies, featureFlags, permissions)',
          'Загружаются параллельно по уровням зависимостей',
          'Используются для бизнес-модулей (todo, dashboard, etc.)',
        ]}
      />
    </DocSection>
    <DocSection title="Module Federation">
      <DocList
        items={[
          'MFE модули загружаются как remote приложения',
          'Shared scope используется для совместного использования зависимостей',
          'В DEV режиме: загрузка через dev-runner',
          'В PROD режиме: загрузка через манифест',
        ]}
      />
    </DocSection>
  </DocSection>
);
