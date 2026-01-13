import { type FC } from 'react';
import { Typography } from '@platform/ui';
import { DocSection, DocList, DocCodeBlock, DocCommand } from '../../../common';

export const TroubleshootingSection: FC = () => (
  <DocSection
    title="Устранение проблем"
    sx={(theme) => ({ scrollMarginTop: theme.spacing(2) })}
  >
    <Typography variant="h6" gutterBottom>
      Порт уже занят
    </Typography>
    <Typography variant="body2" paragraph>
      Если порт 4200 или 1337 занят другим процессом:
    </Typography>
    <Typography variant="body2" fontWeight="bold" gutterBottom>
      Для Vite (порт 4200):
    </Typography>
    <Typography variant="body2" paragraph>
      Измените порт в host/vite.config.mts:
    </Typography>
    <DocCodeBlock
      code={`server: {
  port: 4201, // Измените на свободный порт
  // ...
}`}
      language="typescript"
    />
    <Typography variant="body2" fontWeight="bold" gutterBottom>
      Для Dev Server (порт 1337):
    </Typography>
    <Typography variant="body2" paragraph>
      Измените порт в config/dev-server/index.ts (найдите app.listen(1337)).
    </Typography>

    <Typography variant="h6" gutterBottom sx={(theme) => ({ mt: theme.spacing(2) })}>
      Модули не загружаются
    </Typography>
    <DocList
      items={[
        'Проверьте, что модули находятся в директории packages/',
        'Убедитесь, что у каждого модуля есть package.json и правильная структура',
        'Проверьте конфигурацию в .launcher/configs.json',
        'Посмотрите логи в консоли браузера (F12)',
        'Можно включить дебаг режим в конфигурации и посмотреть логи в консоли',
      ]}
    />

    <Typography variant="h6" gutterBottom sx={(theme) => ({ mt: theme.spacing(2) })}>
      Ошибки при установке зависимостей
    </Typography>
    <DocList
      items={[
        'Убедитесь, что версия Node.js соответствует требованиям (18+)',
        'Очистите кеш npm: npm cache clean --force',
        'Удалите node_modules и package-lock.json, затем выполните npm install заново',
        'Проверьте, что у вас достаточно прав для записи в директорию проекта',
        'В случае ошибки с установкой зависимостей, попробуйте выполнить npm install --legacy-peer-deps',
      ]}
    />

    <Typography variant="h6" gutterBottom sx={(theme) => ({ mt: theme.spacing(2) })}>
      TypeScript ошибки после установки
    </Typography>
    <Typography variant="body2" paragraph>
      После установки автоматически выполняется sync:tsconfig-paths. Если возникают
      ошибки:
    </Typography>
    <DocCommand command="npm run sync:tsconfig-paths" />
  </DocSection>
);
