import { type FC } from 'react';
import { Container, Typography, Paper } from '@platform/ui';
import { useTranslation } from 'react-i18next';
import { DocTOC } from '../../common';
import { ProductionSection } from './ProductionSection';
import { CicdSection } from './CicdSection';

/**
 * Страница документации по деплою приложения.
 * Содержит информацию о production конфигурации и CI/CD настройке.
 *
 * @component
 */
const DeploymentPage: FC = () => {
  const { t } = useTranslation('doc-platform');

  return (
    <Container maxWidth={false} sx={{ padding: 0 }}>
      <Typography variant="h4" gutterBottom>
        {t('menu.deployment')}
      </Typography>

      <Paper sx={(theme) => ({ width: '100%', p: theme.spacing(6) })}>
        <Typography variant="body1" paragraph>
          Деплой приложения в production окружение, настройка CI/CD и
          оптимизация сборки.
        </Typography>

        <DocTOC
          items={[
            { id: 'production', title: 'Production' },
            { id: 'cicd', title: 'CI/CD' },
          ]}
        />

        <div id="production">
          <ProductionSection />
        </div>

        <div id="cicd">
          <CicdSection />
        </div>
      </Paper>
    </Container>
  );
};

export default DeploymentPage;
