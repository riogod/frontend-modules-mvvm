import { type FC } from 'react';
import { Typography, Link } from '@platform/ui';
import { DocSection, DocCommand } from '../../../common';

export const LaunchingSection: FC = () => (
  <DocSection title="Запуск проекта" sx={(theme) => ({ scrollMarginTop: theme.spacing(2) })}>
    <Typography variant="body1" paragraph>
      MFP предоставляет несколько способов запуска проекта в режиме разработки.
      Выберите подходящий для вашей задачи.
    </Typography>

    <Typography variant="h6" gutterBottom>
      Интерактивный лаунчер
    </Typography>
    <Typography variant="body2" paragraph>
      Самый удобный способ для начала работы:
    </Typography>
    <DocCommand command="npm start" />
    <Typography variant="body2" paragraph>
      или
    </Typography>
    <DocCommand command="npm run dev" />

    <Typography variant="body2" color="text.secondary">
      Подробнее см.{' '}
      <Link href="/doc-platform/tools" underline="hover">
        Лаунчер
      </Link>{' '}
      для детального описания работы с конфигурациями.
    </Typography>
  </DocSection>
);
