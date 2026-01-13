import { type FC } from 'react';
import { Container, Typography, Paper } from '@platform/ui';
import { useTranslation } from 'react-i18next';

const HomePage: FC = () => {
  const { t } = useTranslation('doc-platform');

  return (
    <Container maxWidth={false} sx={{ padding: 0 }}>
      <Typography variant="h4" gutterBottom>
        {t('title')}
      </Typography>
      <Paper
        sx={{
          width: '100%',
          p: 2,
        }}
      >
        asdas
      </Paper>
    </Container>
  );
};

export default HomePage;
