import { type FC, Suspense } from 'react';
import {
  Container,
  Box,
  Typography,
  Paper,
  Button,
  Divider,
  useSharedComponent,
} from '@platform/ui';
import { useTranslation } from 'react-i18next';
import { TestCssModule } from '../components/TestCssModule';
import type { SharedJokeMessageProps } from '@platform/module-api-example/view/components/JokeMessage';

const ApiCallExampleComponent: FC<SharedJokeMessageProps> = (props) => {
  const SharedComponentWithProps = useSharedComponent<SharedJokeMessageProps>(
    'ApiCallExample',
    {
      fallback: (
        <Typography color="text.secondary">
          Компонент из модуля api_example недоступен
        </Typography>
      ),
    },
  );

  return SharedComponentWithProps ? (
    <SharedComponentWithProps {...props} />
  ) : null;
};

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
          <Divider sx={{ my: 2 }} />
          <Typography variant="h5" gutterBottom>
            Зашаренный компонент из микрофронта api_example
          </Typography>
          <Box
            sx={{
              w: 1,
              display: 'flex',
              justifyContent: 'center',
            }}
          >
            <Box
              sx={{
                minWidth: 400,
              }}
            >
              <Suspense
                fallback={<Typography>Загрузка компонента...</Typography>}
              >
                <ApiCallExampleComponent title="Шутки за 300!" />
              </Suspense>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default HomePage;
