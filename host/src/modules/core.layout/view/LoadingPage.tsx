import { type FC } from 'react';
import { Container } from '@platform/ui';

const LoadingPage: FC = () => {
  return (
    <Container
      sx={{
        height: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    ></Container>
  );
};

export default LoadingPage;
