import { ApolloClient, InMemoryCache } from '@apollo/client'
import { getConnectionConfig } from 'config/app'

export const makeClient = (networkId: number | null) => {
  const { graphUrl } = getConnectionConfig(networkId)
  return new ApolloClient({
    uri: graphUrl,
    cache: new InMemoryCache(),
  })
}
