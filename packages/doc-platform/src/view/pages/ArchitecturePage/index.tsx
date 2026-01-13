import { type FC } from 'react';
import { Container, Typography, Paper } from '@platform/ui';
import { useTranslation } from 'react-i18next';
import { DocTOC } from '../../common';
import { OverviewSection } from './components/OverviewSection';
import { KeyPrinciplesSection } from './components/KeyPrinciplesSection';
import { ArchitectureLayersSection } from './components/ArchitectureLayersSection';
import { CleanArchitectureSection } from './components/CleanArchitectureSection';
import { ModuleInterfacesSection } from './components/ModuleInterfacesSection';

/**
 * Страница документации по архитектуре платформы.
 * Содержит информацию о ключевых принципах, слоях архитектуры,
 * чистой архитектуре и интерфейсах модулей.
 *
 * @component
 */
const ArchitecturePage: FC = () => {
  const { t } = useTranslation('doc-platform');

  return (
    <Container maxWidth={false} sx={{ padding: 0 }}>
      <Typography variant="h4" gutterBottom>
        {t('menu.architecture')}
      </Typography>

      <Paper sx={(theme) => ({ width: '100%', p: theme.spacing(6) })}>
        <Typography variant="body1" paragraph>
          В этом разделе описана архитектура Modular Frontend Platform (MFP),
          ключевые принципы проектирования и структура слоев приложения.
        </Typography>

        <DocTOC
          items={[
            { id: 'обзор', title: 'Обзор' },
            { id: 'ключевые-принципы', title: 'Ключевые принципы' },
            { id: 'слои-архитектуры', title: 'Слои архитектуры' },
            { id: 'чистая-архитектура', title: 'Чистая архитектура' },
            { id: 'интерфейсы-модулей', title: 'Интерфейсы модулей' },
          ]}
        />

        <div id="обзор">
          <OverviewSection />
        </div>

        <div id="ключевые-принципы">
          <KeyPrinciplesSection />
        </div>

        <div id="слои-архитектуры">
          <ArchitectureLayersSection />
        </div>

        <div id="чистая-архитектура">
          <CleanArchitectureSection />
        </div>

        <div id="интерфейсы-модулей">
          <ModuleInterfacesSection />
        </div>
      </Paper>
    </Container>
  );
};

export default ArchitecturePage;
