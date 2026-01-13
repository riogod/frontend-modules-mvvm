import { type FC } from 'react';
import { Typography } from '@platform/ui';
import { DocSection, DocTable } from '../../../common';

export const AliasesSection: FC = () => (
  <DocSection title="Алиасы путей" sx={(theme) => ({ scrollMarginTop: theme.spacing(2) })}>
    <Typography variant="body1" paragraph>
      Для удобства импортов в проекте настроены алиасы путей:
    </Typography>
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
