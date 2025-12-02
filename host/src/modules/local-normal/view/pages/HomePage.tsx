import { type FC } from 'react';
import { Container, Box, Typography, Paper } from '@platform/ui';
import { useTranslation } from 'react-i18next';

const HomePage: FC = () => {
  const { t } = useTranslation('local-normal');

  return (
    <Container>
      <Box sx={{ p: 3 }}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h4" gutterBottom>
            {t('title')}
          </Typography>
          <Typography variant="body1">{t('description')}</Typography>
        </Paper>
      </Box>
    </Container>
  );
};

export default HomePage;

