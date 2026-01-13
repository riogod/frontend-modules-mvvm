import { type FC } from 'react';
import { DocSection } from '../../../common';

export const OverviewSection: FC = () => (
  <DocSection title="Обзор">
    <p>
      Проект организован как монорепозиторий с использованием npm workspaces.
      Структура разделена на логические области: хост-приложение, библиотеки,
      модули, конфигурации и скрипты.
    </p>
  </DocSection>
);
