import { type FC } from 'react';
import { Container } from '@platform/ui';
import { ThemeSchema } from '@platform/share';
import JokeMessage from './components/JokeMessage';

const ApiPage: FC = () => {
  return (
    <ThemeSchema>
      <Container
        maxWidth="sm"
        sx={{
          height: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <JokeMessage />
      </Container>
    </ThemeSchema>
  );
};

export default ApiPage;
