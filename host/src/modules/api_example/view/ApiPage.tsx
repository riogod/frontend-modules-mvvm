import { type FC } from 'react';
import { Container } from '@platform/ui';
import JokeMessage from './components/JokeMessage';

const ApiPage: FC = () => {
  return (
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
  );
};

export default ApiPage;
