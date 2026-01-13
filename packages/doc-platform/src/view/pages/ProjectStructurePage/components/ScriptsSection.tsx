import { type FC } from 'react';
import { Typography } from '@platform/ui';
import { DocSection, DocFileTree } from '../../../common';

export const ScriptsSection: FC = () => (
  <DocSection title="scripts/ — Скрипты" sx={(theme) => ({ scrollMarginTop: theme.spacing(2) })}>
    <Typography variant="body1" paragraph>
      Директория scripts/ содержит утилиты для сборки и разработки:
    </Typography>

    <DocFileTree
      tree={`scripts/
├── dev-runner.mjs      # CLI-лаунчер разработки
└── launcher/           # CLI-лаунчер модулей`}
    />

    <Typography variant="body2" paragraph sx={(theme) => ({ mt: theme.spacing(2) })}>
      dev-runner.mjs — интерактивный CLI для управления конфигурациями разработки,
      выбора модулей (LOCAL/REMOTE) и запуска проекта.
    </Typography>
  </DocSection>
);
