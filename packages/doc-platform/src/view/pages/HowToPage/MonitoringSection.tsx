import { type FC } from 'react';
import { DocSection, DocCodeBlock, DocList, DocNote } from '../../common';

export const MonitoringSection: FC = () => (
  <DocSection title="Monitoring">
    <DocSection title="Настройка errorMonitoringCallback">
      <p>Установите callback в log.setConfig:</p>
      <DocCodeBlock
        code={`import { log } from '@platform/core';

log.setConfig({
  errorMonitoringCallback: (error, context) => {
    // Отправка ошибок в Sentry, Rollbar, etc.
    sendToMonitoringService(error, context);
  },
});`}
        language="typescript"
      />
    </DocSection>
    <DocSection title="Автоматический захват ошибок">
      <p>Callback автоматически вызывается для:</p>
      <DocList
        items={[
          'window.onerror',
          'unhandledrejection',
          'log.error()',
          'Необработанные исключения в Promise',
        ]}
      />
    </DocSection>
    <DocSection title="Пример с Sentry">
      <DocCodeBlock
        code={`import * as Sentry from '@sentry/react';
import { log } from '@platform/core';

log.setConfig({
  errorMonitoringCallback: (error, context) => {
    Sentry.captureException(error, {
      extra: context,
    });
  },
});

// В компоненте
try {
  await riskyOperation();
} catch (error) {
  log.error('Operation failed', { prefix: 'my.module' }, error);
  // Sentry автоматически получит ошибку
}`}
        language="typescript"
      />
    </DocSection>
    <DocSection title="Пример с Rollbar">
      <DocCodeBlock
        code={`import Rollbar from 'rollbar';
import { log } from '@platform/core';

const rollbar = new Rollbar({
  accessToken: 'YOUR_ACCESS_TOKEN',
  environment: process.env.NODE_ENV,
});

log.setConfig({
  errorMonitoringCallback: (error, context) => {
    rollbar.error(error instanceof Error ? error : new Error(String(error)), context);
  },
});`}
        language="typescript"
      />
    </DocSection>
    <DocSection title="Дедупликация ошибок">
      <p>Предотвращайте дублирование ошибок:</p>
      <DocCodeBlock
        code={`import { log } from '@platform/core';

const sentErrors = new Set<string>();

log.setConfig({
  errorMonitoringCallback: (error, context) => {
    const errorKey = \`\${error.message}_\${context.stack}\`;

    if (sentErrors.has(errorKey)) {
      return; // Уже отправляли
    }

    sentErrors.add(errorKey);
    sendToMonitoringService(error, context);

    // Очистка через 1 минуту
    setTimeout(() => {
      sentErrors.delete(errorKey);
    }, 60000);
  },
});`}
        language="typescript"
      />
    </DocSection>
    <DocSection title="Контекст ошибки">
      <DocCodeBlock
        code={`// log.error добавляет контекст
log.error(
  'Failed to load todos',
  {
    prefix: 'todo.usecase',
    userId: '123',
    module: 'todo',
  },
  error,
);

// В callback:
errorMonitoringCallback: (error, context) => {
  console.log(context);
  // {
  //   prefix: 'todo.usecase',
  //   userId: '123',
  //   module: 'todo',
  //   stack: '...'
  // }
}`}
        language="typescript"
      />
    </DocSection>
    <DocNote type="info" title="Рекомендация">
      Настройте errorMonitoringCallback в самом начале bootstrap процесса, до
      загрузки модулей.
    </DocNote>
  </DocSection>
);
