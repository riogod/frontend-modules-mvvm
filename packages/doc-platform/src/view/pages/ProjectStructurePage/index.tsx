import { type FC } from 'react';
import { Container, Typography, Paper } from '@platform/ui';
import { useTranslation } from 'react-i18next';
import { DocTOC } from '../../common';
import { OverviewSection } from './components/OverviewSection';
import { RootStructureSection } from './components/RootStructureSection';
import { HostSection } from './components/HostSection';
import { LibsSection } from './components/LibsSection';
import { PackagesSection } from './components/PackagesSection';
import { ConfigSection } from './components/ConfigSection';
import { ScriptsSection } from './components/ScriptsSection';
import { NamingSection } from './components/NamingSection';
import { AliasesSection } from './components/AliasesSection';

/**
 * Страница документации по структуре проекта.
 * Содержит информацию о монорепозитории, структуре директорий,
 * соглашениях об именовании и алиасах путей.
 *
 * @component
 */
const ProjectStructurePage: FC = () => {
  const { t } = useTranslation('doc-platform');

  return (
    <Container maxWidth={false} sx={{ padding: 0 }}>
      <Typography variant="h4" gutterBottom>
        {t('menu.project-structure')}
      </Typography>

      <Paper sx={(theme) => ({ width: '100%', p: theme.spacing(6) })}>
        <Typography variant="body1" paragraph>
          Проект организован как монорепозиторий с использованием npm
          workspaces. Структура разделена на логические области:
          хост-приложение, библиотеки, модули, конфигурации и скрипты.
        </Typography>

        <DocTOC
          items={[
            { id: 'обзор', title: 'Обзор' },
            { id: 'корневая-структура', title: 'Корневая структура' },
            { id: 'host-хост-приложение', title: 'host/ — Хост-приложение' },
            {
              id: 'libs-библиотеки-платформы',
              title: 'libs/ — Библиотеки платформы',
            },
            {
              id: 'packages-бизнес-модули',
              title: 'packages/ — Бизнес-модули',
            },
            { id: 'config-конфигурации', title: 'config/ — Конфигурации' },
            { id: 'scripts-скрипты', title: 'scripts/ — Скрипты' },
            {
              id: 'соглашения-об-именовании',
              title: 'Соглашения об именовании',
            },
            { id: 'алиасы-путей', title: 'Алиасы путей' },
          ]}
        />

        <div id="обзор">
          <OverviewSection />
        </div>

        <div id="корневая-структура">
          <RootStructureSection />
        </div>

        <div id="host-хост-приложение">
          <HostSection />
        </div>

        <div id="libs-библиотеки-платформы">
          <LibsSection />
        </div>

        <div id="packages-бизнес-модули">
          <PackagesSection />
        </div>

        <div id="config-конфигурации">
          <ConfigSection />
        </div>

        <div id="scripts-скрипты">
          <ScriptsSection />
        </div>

        <div id="соглашения-об-именовании">
          <NamingSection />
        </div>

        <div id="алиасы-путей">
          <AliasesSection />
        </div>
      </Paper>
    </Container>
  );
};

export default ProjectStructurePage;
