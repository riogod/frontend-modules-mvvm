import { PropsWithChildren, ReactElement } from 'react';
import { DIContext } from '../contexts';
import { Container } from 'inversify';

interface IProps {
  container: Container;
}

const DIProvider: ReactElement<PropsWithChildren<IProps>> = ({
  container,
  children,
}) => <DIContext.Provider value={container}>{children}</DIContext.Provider>;

export { DIProvider };
