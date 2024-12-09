import { ApolloClient, InMemoryCache, DefaultOptions } from '@apollo/client'
import { getConnectionConfig } from 'config/app'

export const makeClient = (networkId: number | null) => {
  const { graphUrl } = getConnectionConfig(networkId)

  const defaultOptions: DefaultOptions = {
    watchQuery: {
      fetchPolicy: 'cache-first',
    },
    query: {
      fetchPolicy: 'cache-first',
    },
    mutate: {
      fetchPolicy: 'no-cache',
    },
  }

  return new ApolloClient({
    uri: graphUrl,
    cache: new InMemoryCache(),
    defaultOptions,
  })
}
