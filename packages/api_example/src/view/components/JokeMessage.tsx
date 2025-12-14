import { type FC } from 'react';
import { observer } from 'mobx-react-lite';
import {
  useVM,
  Typography,
  Button,
  Skeleton,
  Card,
  CardContent,
  CardActions,
  CardHeader,
} from '@platform/ui';
import type { JokeViewModel } from '../../viewmodels/joke.vm';
import { useTranslation } from 'react-i18next';
import { API_EXAMPLE_DI_TOKENS } from '../../config/di.tokens';

export interface SharedJokeMessageProps {
  title?: string;
}

const JokeMessage: FC<SharedJokeMessageProps> = ({ title }) => {
  const { t } = useTranslation('api');
  const jokeMessage = useVM<JokeViewModel>(
    API_EXAMPLE_DI_TOKENS.VIEW_MODEL_JOKE,
  );

  const getJoke = () => {
    void (async () => {
      await jokeMessage.getJoke();
    })();
  };

  const jokeContent = jokeMessage.joke ? (
    <>
      {jokeMessage.joke?.setup}
      <br />
      <br />
      {jokeMessage.joke?.punchline}
    </>
  ) : (
    'Ups... Joke not found'
  );

  return (
    <Card
      sx={{
        width: 1,
        minHeight: 300,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
      }}
      elevation={3}
    >
      <CardHeader title={title} />
      {jokeMessage.loading ? (
        <Skeleton
          animation="wave"
          variant="rounded"
          height={150}
          sx={{ width: 1 }}
        />
      ) : (
        <>
          <CardContent>
            <Typography variant="body2">{jokeContent}</Typography>
          </CardContent>
          <CardActions>
            <Button size="small" onClick={getJoke}>
              {t('api:button.get-joke')}
            </Button>
          </CardActions>
        </>
      )}
    </Card>
  );
};

export default observer(JokeMessage);
