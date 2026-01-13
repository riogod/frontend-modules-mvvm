import { type FC } from 'react';
import { DocSection, DocTable } from '../../../common';

export const AliasesSection: FC = () => (
  <DocSection title="Алиасы путей">
    <p>Для удобства импортов в проекте настроены алиасы путей:</p>
    <DocTable
      columns={[
        { header: 'Алиас', key: 'alias' },
        { header: 'Путь', key: 'path' },
      ]}
      rows={[
        {
          alias: '@platform/core',
          path: 'libs/core/src',
        },
        {
          alias: '@platform/common',
          path: 'libs/common/src',
        },
        {
          alias: '@platform/ui',
          path: 'libs/ui/src',
        },
        {
          alias: '@platform/share',
          path: 'libs/share/src',
        },
      ]}
    />
  </DocSection>
);
