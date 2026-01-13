import { type FC } from 'react';
import { DocSection, DocFileTree } from '../../../common';

export const ConfigSection: FC = () => (
  <DocSection title="config/ — Конфигурации">
    <p>
      Директория config/ содержит фабрики конфигураций для инструментов
      разработки:
    </p>

    <DocFileTree
      tree={`config/
 ├── vite-config/        # Фабрика конфигураций Vite
 ├── eslint-config/      # Фабрика конфигураций ESLint
 └── dev-server/         # Dev-сервер для API-проксирования`}
    />

    <p style={{ marginTop: '16px' }}>
      Каждая фабрика предоставляет функцию для создания конфигурации с учетом
      типа проекта (host, lib, module).
    </p>
  </DocSection>
);
