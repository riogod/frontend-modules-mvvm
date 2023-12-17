import { FC } from 'react';
import { DIContext } from '../contexts';
import { Container } from 'inversify';

interface IProps extends React.PropsWithChildren {
  container: Container;
}

const DIProvider: FC<IProps> = ({ container, children }) => (
  <DIContext.Provider value={container}>{children}</DIContext.Provider>
);

export { DIProvider };
