import { type FC } from 'react';
import { Typography } from '@platform/ui';
import { DocSection, DocFileTree } from '../../../common';

export const ConfigSection: FC = () => (
  <DocSection title="config/ — Конфигурации" sx={(theme) => ({ scrollMarginTop: theme.spacing(2) })}>
    <Typography variant="body1" paragraph>
      Директория config/ содержит фабрики конфигураций для инструментов разработки:
    </Typography>

    <DocFileTree
      tree={`config/
├── vite-config/        # Фабрика конфигураций Vite
├── eslint-config/      # Фабрика конфигураций ESLint
└── dev-server/         # Dev-сервер для API-проксирования`}
    />

    <Typography variant="body2" paragraph sx={(theme) => ({ mt: theme.spacing(2) })}>
      Каждая фабрика предоставляет функцию для создания конфигурации с учетом типа
      проекта (host, lib, module).
    </Typography>
  </DocSection>
);
