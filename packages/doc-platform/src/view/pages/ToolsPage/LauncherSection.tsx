import { type FC } from 'react';
import { DocSection, DocCodeBlock, DocList, DocNote } from '../../common';

/**
 * Секция документации по Launcher - инструменту для управления
 * конфигурациями разработки и запуска модулей.
 *
 * @component
 */
export const LauncherSection: FC = () => (
  <DocSection title="Launcher">
    <DocSection title="Запуск Launcher">
      <DocCodeBlock
        code={`# Запуск Launcher (интерактивное меню)
npm start

# Использовать последний конфиг
npm run dev -- --last

# Использовать конкретный конфиг
npm run dev -- --config=my-config

# Создать новый модуль через Launcher
npm run dev -- --create-module`}
        language="bash"
      />
    </DocSection>

    <DocSection title="Интерактивное меню">
      <p>Launcher показывает список конфигураций с информацией:</p>

      <DocList
        items={[
          'Количество модулей',
          'Частота использования',
          'Последнее использование',
        ]}
      />

      <p>Выберите модуль для запуска:</p>

      <DocCodeBlock
        code={`┌────────────────────────────────────────────┐
│              Launcher Configs               │
├────────────────────────────────────────────┤
│  [1] default (5 modules) [★★★★★]        │
│  [2] dev-api (3 modules) [★★★☆☆]         │
│  [3] minimal (1 module) [★☆☆☆☆]          │
│                                            │
│  [C] Create new config                    │
│  [M] Create new module                    │
│  [Q] Quit                                 │
└────────────────────────────────────────────┘`}
        language="text"
      />
    </DocSection>

    <DocSection title="Источники модулей">
      <p>Для каждого модуля укажите источник:</p>

      <DocList
        items={[
          'LOCAL - модуль из packages/ (DEV режим)',
          'REMOTE - модуль с удаленного сервера (PROD)',
          'REMOTE_CUSTOM - модуль с кастомного URL',
          'SKIP - пропустить модуль',
        ]}
      />
    </DocSection>

    <DocSection title="Настройки Launcher">
      <DocCodeBlock
        code={`# Уровни логирования
- NONE     # Без логов
- ERROR    # Только ошибки
- WARN     # Ошибки и предупреждения
- INFO     # Информационные сообщения
- DEBUG    # Отладочная информация
- TRACE    # Трассировка выполнения

# Другие настройки
- Use MSW mocks: включить/выключить моки
- Remote server URL: URL удаленного сервера
- API URL: URL API сервера`}
        language="text"
      />
    </DocSection>

    <DocSection title="Создание конфигурации">
      <p>Конфигурации сохраняются в `.launcher/configs.json`:</p>

      <DocCodeBlock
        code={`{
  "configs": [
    {
      "name": "default",
      "modules": {
        "todo": "LOCAL",
        "dashboard": "LOCAL",
        "auth": "REMOTE",
        "catalog": "SKIP"
      },
      "settings": {
        "logLevel": "INFO",
        "useMsMocks": true,
        "remoteServerUrl": "",
        "apiUrl": "http://localhost:3001"
      },
      "usageCount": 5,
      "lastUsed": "2024-01-01T12:00:00Z"
    }
  ],
  "defaultConfig": "default"
}`}
        language="json"
      />
    </DocSection>

    <DocSection title="Порты">
      <DocList
        items={[
          '1337 - Dev Server (API проксирование)',
          '4200 - Vite Dev Server',
          '6006 - Storybook (если запущен)',
        ]}
      />
    </DocSection>

    <DocSection title="Создание модуля">
      <p>Launcher может создать новый модуль:</p>

      <DocCodeBlock
        code={`# В Launcher выберите [M] Create new module

# Ответьте на вопросы:
Module type? (module/lib/host) [module]
Module name? my-module
Create routes? (Y/n) [Y]
Create i18n? (Y/n) [Y]
Create mocks? (Y/n) [Y]
Module location? (packages/host/modules/) [packages]`}
        language="bash"
      />
    </DocSection>

    <DocNote type="info" title="Рекомендация">
      Используйте Launcher для разработки. Это упростит управление
      конфигурациями и запуск модулей.
    </DocNote>
  </DocSection>
);
