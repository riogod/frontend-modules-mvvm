import { type FC } from 'react';
import { Typography } from '@platform/ui';
import { DocSection } from '../../../common';

export const OverviewSection: FC = () => (
  <DocSection title="Обзор" sx={(theme) => ({ scrollMarginTop: theme.spacing(2) })}>
    <Typography variant="body1" paragraph>
      Проект организован как монорепозиторий с использованием npm workspaces.
      Структура разделена на логические области: хост-приложение, библиотеки,
      модули, конфигурации и скрипты.
    </Typography>
  </DocSection>
);
