import { type FC } from 'react';
import {
  Container,
  Box,
  Typography,
  Paper,
  Button,
  Divider,
} from '@platform/ui';
import { useTranslation } from 'react-i18next';
import { TestCssModule } from '../components/TestCssModule';

const HomePage: FC = () => {
  const { t } = useTranslation('app-test');

  return (
    <Container>
      <Box sx={{ p: 3 }}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h4" gutterBottom>
            {t('title')}
          </Typography>
          <Typography variant="body1">{t('description')}</Typography>
          <Divider sx={{ my: 2 }} />
          <TestCssModule />
          <Divider sx={{ my: 2 }} />
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              p: 2,
            }}
          >
            <Button
              onClick={() => {
                throw new Error('Test error');
              }}
              variant="contained"
              color="error"
            >
              Test throw error
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default HomePage;
