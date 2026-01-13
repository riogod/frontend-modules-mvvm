import { type FC } from 'react';
import { DocSection, DocCodeBlock, DocList, DocNote } from '../../common';

export const PromDebugModeSection: FC = () => (
  <DocSection title="Prom Debug Mode">
    <DocSection title="Обзор">
      <p>
        Prom debug mode - режим отладки для включения debug логов в production.
      </p>
      <p>Используется для:</p>
      <DocList
        items={[
          'Диагностика проблем в production',
          'Просмотр подробной информации о загрузке модулей',
          'Отслеживание состояния DI контейнера',
          'Дебаг API запросов',
        ]}
      />
    </DocSection>
    <DocSection title="Включение debug mode">
      <p>Откройте browser console и выполните:</p>
      <DocCodeBlock
        code={`localStorage.setItem('platform_debug', 'true');

// Перезагрузите страницу
location.reload();`}
        language="javascript"
      />
    </DocSection>
    <DocSection title="Отключение debug mode">
      <DocCodeBlock
        code={`localStorage.removeItem('platform_debug');

// Перезагрузите страницу
location.reload();`}
        language="javascript"
      />
    </DocSection>
    <DocSection title="Что логируется">
      <p>При включенном debug mode вы увидите:</p>
      <DocList
        items={[
          'Детальный лог загрузки модулей',
          'Состояние DI контейнера',
          'Информация о загрузке фич и прав',
          'Лог API запросов',
          'Состояние бустрап процесса',
        ]}
      />
    </DocSection>
    <DocSection title="Пример логов">
      <DocCodeBlock
        code={`// Загрузка модулей
[ModuleLoader] Loading module: todo
[ModuleLoader] Module loaded: todo (status: loaded)

// DI контейнер
[DI] Container initialized
[DI] Registered: TodoListModel (singleton)
[DI] Registered: TodoListViewModel (transient)

// Фичи и права
[AccessControl] Features: { dashboard.enabled: true, todo.enabled: true }
[AccessControl] Permissions: { user.read: true, user.write: false }

// API запросы
[APIClient] GET /api/todos
[APIClient] Response: 200 OK (234ms)`}
        language="text"
      />
    </DocSection>
    <DocSection title="Использование в коде">
      <p>Проверьте debug mode в своем коде:</p>
      <DocCodeBlock
        code={`const isDebugMode = localStorage.getItem('platform_debug') === 'true';

if (isDebugMode) {
  console.log('[MyModule] Debug info:', data);
}`}
        language="typescript"
      />
    </DocSection>
    <DocSection title="Уровни логирования">
      <p>При debug mode включаются все уровни:</p>
      <DocCodeBlock
        code={`// Без debug mode: только ERROR и WARN
log.error('Error message');
log.warn('Warning message');

// С debug mode: все уровни
log.info('Info message');
log.debug('Debug message');
log.trace('Trace message');`}
        language="typescript"
      />
    </DocSection>
    <DocSection title="Для разработчиков">
      <p>Используйте debug mode для:</p>
      <DocList
        items={[
          'Отладки проблем с загрузкой модулей',
          'Проверки регистрации в DI контейнере',
          'Анализа производительности',
          'Понимания порядка инициализации',
        ]}
      />
    </DocSection>
    <DocNote type="warning" title="Важно">
      Не оставляйте debug mode включенным на production. Это может повлиять на
      производительность и раскрыть конфиденциальную информацию.
    </DocNote>
    <DocNote type="info" title="Совет">
      Используйте debug mode только для диагностики конкретных проблем.
      Отключайте его сразу после решения.
    </DocNote>
  </DocSection>
);
