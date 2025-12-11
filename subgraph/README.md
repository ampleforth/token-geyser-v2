## Geyser subgraph

The Graph is a tool for for indexing events emitted on the Ethereum blockchain. It provides you with an easy-to-use GraphQL API.

```
Public graphql endpoint:
https://api.thegraph.com/subgraphs/name/ampleforth/ampleforth-token-geyser-v2
```

## Getting started

Run a local instance of the graph node:

```
git clone https://github.com/graphprotocol/graph-node
cd graph-node/docker

# update docker-compose.yaml with alchemy rpc endpoint
docker-compose up

# NOTE: Ensure that the docker container is able to access the internet
```

Setup project:
```
yarn
```

To build and deploy the subgraph to the graph hosted service:

```
# local deployment
./scripts/deploy-local.sh mainnet ampleforth-token-geyser-v2
```

You should have your own Goldsky API key to use with the Goldsky CLI.

Note you must set the (new) version to deploy to, and then update the tag separately.
```
# prod deployment
./scripts/deploy.sh mainnet ampleforth-token-geyser-v2 <VERSION>
# once deployed, update the tag that frg-web-api looks for.
goldsky subgraph tag create ampleforth-token-geyser-v2/<VERSION> --tag prod
```
