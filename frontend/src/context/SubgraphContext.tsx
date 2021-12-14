import React, { createContext, useContext } from 'react';
import { ApolloProvider } from '@apollo/client';
import Web3Context from 'context/Web3Context';
import { makeClient } from 'queries/client';

const SubgraphContext = createContext<{}>({});

export type SubgraphContextProps = {
  children?: React.ReactNode;
};

const defaultProps: SubgraphContextProps = {
  children: null,
};

const SubgraphProvider: React.FC<SubgraphContextProps> = ({
  children,
}: SubgraphContextProps) => {
  const { networkId } = useContext(Web3Context);
  const client = makeClient(networkId)
  return (
    <ApolloProvider client={client}>
      {children}
    </ApolloProvider>
  );
};

SubgraphProvider.defaultProps = defaultProps;

export { SubgraphProvider };

export default SubgraphContext;
