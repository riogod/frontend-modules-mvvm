import { type FC } from 'react';
import { Container, Typography, Paper } from '@platform/ui';
import { useTranslation } from 'react-i18next';
import { DocTOC } from '../../common';
import { RoutingSection } from './RoutingSection';
import { OptimisticUISection } from './OptimisticUISection';
import { CssSection } from './CssSection';
import { MonitoringSection } from './MonitoringSection';
import { TeamworkSection } from './TeamworkSection';
import { PromDebugModeSection } from './PromDebugModeSection';

/**
 * Страница документации с практическими руководствами.
 * Содержит информацию о роутинге, оптимистичном UI, CSS, мониторинге,
 * командной работе и режиме отладки.
 *
 * @component
 */
const HowToPage: FC = () => {
  const { t } = useTranslation('doc-platform');

  return (
    <Container maxWidth={false} sx={{ padding: 0 }}>
      <Typography variant="h4" gutterBottom>
        {t('menu.how-to')}
      </Typography>

      <Paper sx={(theme) => ({ width: '100%', p: theme.spacing(6) })}>
        <Typography variant="body1" paragraph>
          Практические руководства по работе с платформой: роутинг, оптимизация,
          стилизация, мониторинг и командная работа.
        </Typography>

        <DocTOC
          items={[
            { id: 'routing', title: 'Routing' },
            { id: 'optimistic-ui', title: 'Optimistic UI' },
            { id: 'css', title: 'CSS' },
            { id: 'monitoring', title: 'Monitoring' },
            { id: 'teamwork', title: 'Teamwork' },
            { id: 'prom-debug-mode', title: 'Prom Debug Mode' },
          ]}
        />

        <div id="routing">
          <RoutingSection />
        </div>

        <div id="optimistic-ui">
          <OptimisticUISection />
        </div>

        <div id="css">
          <CssSection />
        </div>

        <div id="monitoring">
          <MonitoringSection />
        </div>

        <div id="teamwork">
          <TeamworkSection />
        </div>

        <div id="prom-debug-mode">
          <PromDebugModeSection />
        </div>
      </Paper>
    </Container>
  );
};

export default HowToPage;
