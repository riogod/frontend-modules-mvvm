import { type FC } from 'react';
import { DocSection, DocList, DocCodeBlock, DocCommand } from '../../../common';

export const TroubleshootingSection: FC = () => (
  <DocSection title="Устранение проблем">
    <h6>Порт уже занят</h6>
    <p>Если порт 4200 или 1337 занят другим процессом:</p>
    <p>
      <strong>Для Vite (порт 4200):</strong>
    </p>
    <p>Измените порт в host/vite.config.mts:</p>
    <DocCodeBlock
      code={`server: {
  port: 4201, // Измените на свободный порт
  // ...
}`}
      language="typescript"
    />
    <p>
      <strong>Для Dev Server (порт 1337):</strong>
    </p>
    <p>
      Измените порт в config/dev-server/index.ts (найдите app.listen(1337)).
    </p>

    <h6 style={{ marginTop: '16px' }}>Модули не загружаются</h6>
    <DocList
      items={[
        'Проверьте, что модули находятся в директории packages/',
        'Убедитесь, что у каждого модуля есть package.json и правильная структура',
        'Проверьте конфигурацию в .launcher/configs.json',
        'Посмотрите логи в консоли браузера (F12)',
        'Можно включить дебаг режим в конфигурации и посмотреть логи в консоли',
      ]}
    />

    <h6 style={{ marginTop: '16px' }}>Ошибки при установке зависимостей</h6>
    <DocList
      items={[
        'Убедитесь, что версия Node.js соответствует требованиям (22.16+)',
        'Очистите кеш npm: npm cache clean --force',
        'Удалите node_modules и package-lock.json, затем выполните npm install заново',
        'Проверьте, что у вас достаточно прав для записи в директорию проекта',
        'В случае ошибки с установкой зависимостей, попробуйте выполнить npm install --legacy-peer-deps',
      ]}
    />

    <h6 style={{ marginTop: '16px' }}>TypeScript ошибки после установки</h6>
    <p>
      После установки автоматически выполняется sync:tsconfig-paths. Если
      возникают ошибки:
    </p>
    <DocCommand command="npm run sync:tsconfig-paths" />
  </DocSection>
);
