import { type FC } from 'react';
import { Container, Typography, Paper } from '@platform/ui';
import { useTranslation } from 'react-i18next';

/**
 * Страница раздела "Модули".
 *
 * @component
 */
const ModulesPage: FC = () => {
  const { t } = useTranslation('doc-platform');

  return (
    <Container maxWidth={false} sx={{ padding: 0 }}>
      <Typography variant="h4" gutterBottom>
        {t('menu.modules')}
      </Typography>
      <Paper
        sx={{
          width: '100%',
          p: 2,
        }}
      >
        <Typography variant="body1">
          Раздел документации о модулях платформы.
        </Typography>
      </Paper>
    </Container>
  );
};

export default ModulesPage;
