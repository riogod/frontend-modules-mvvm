import { type FC } from 'react';
import { Container, Typography, Paper } from '@platform/ui';
import { useTranslation } from 'react-i18next';
import { DocTOC } from '../../common';
import { FeatureTogglesSection } from './FeatureTogglesSection';
import { PermissionsSection } from './PermissionsSection';
import { ServerParametersSection } from './ServerParametersSection';

/**
 * Страница документации по механикам платформы.
 * Содержит информацию о Feature Toggles, Permissions и Server Parameters.
 *
 * @component
 */
const MechanicsPage: FC = () => {
  const { t } = useTranslation('doc-platform');

  return (
    <Container maxWidth={false} sx={{ padding: 0 }}>
      <Typography variant="h4" gutterBottom>
        {t('menu.mechanics')}
      </Typography>

      <Paper sx={(theme) => ({ width: '100%', p: theme.spacing(6) })}>
        <Typography variant="body1" paragraph>
          Механики платформы для управления функциональностью: Feature Toggles,
          Permissions и Server Parameters.
        </Typography>

        <DocTOC
          items={[
            { id: 'feature-toggles', title: 'Feature Toggles' },
            { id: 'permissions', title: 'Permissions' },
            { id: 'server-parameters', title: 'Server Parameters' },
          ]}
        />

        <div id="feature-toggles">
          <FeatureTogglesSection />
        </div>

        <div id="permissions">
          <PermissionsSection />
        </div>

        <div id="server-parameters">
          <ServerParametersSection />
        </div>
      </Paper>
    </Container>
  );
};

export default MechanicsPage;
