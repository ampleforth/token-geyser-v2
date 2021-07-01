import { ApolloClient, InMemoryCache } from '@apollo/client'
import { GEYSER_SUBGRAPH_ENDPOINT } from '../constants'

const uri =
  process.env.NODE_ENV === 'development'
    ? 'http://localhost:8000/subgraphs/name/thegostep/ampleforth-geyser-v2'
    : GEYSER_SUBGRAPH_ENDPOINT

export const client = new ApolloClient({
  uri,
  cache: new InMemoryCache(),
})
