import { ApolloClient, InMemoryCache } from '@apollo/client'

const uri =
  process.env.NODE_ENV === 'development' ? 'http://localhost:8000/subgraphs/name/thegostep/ampleforth-geyser-v2' : '' // TODO: should point to subgraph on `https://api.thegraph.com/subgraphs` in production

export const client = new ApolloClient({
  uri,
  cache: new InMemoryCache(),
})
