import { type FC } from 'react';
import { DocSection, DocFileTree } from '../../../common';

export const ScriptsSection: FC = () => (
  <DocSection title="scripts/ — Скрипты">
    <p>Директория scripts/ содержит утилиты для сборки и разработки:</p>

    <DocFileTree
      tree={`scripts/
 ├── dev-runner.mjs      # CLI-лаунчер разработки
 └── launcher/           # CLI-лаунчер модулей`}
    />

    <p style={{ marginTop: '16px' }}>
      dev-runner.mjs — интерактивный CLI для управления конфигурациями
      разработки, выбора модулей (LOCAL/REMOTE) и запуска проекта.
    </p>
  </DocSection>
);
