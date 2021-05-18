# token-geyser-v2

[![Tests](https://github.com/ampleforth/token-geyser-v2/workflows/CI/badge.svg)](https://github.com/ampleforth/token-geyser-v2/actions) [![Coverage Status](https://coveralls.io/repos/github/ampleforth/token-geyser-v2/badge.svg?t=HP4Dtq)](https://coveralls.io/github/ampleforth/token-geyser-v2)

Reward distribution contract with time multiplier

## Install

```bash
# Install project dependencies
yarn
```

## Testing

```bash
# Run all unit tests (compatible with node v12+)
yarn test
```

## Deploy Local
1. `yarn hardhat node` -- this spins up a local hardhat network, it is useful to note down the accounts
2. `yarn hardhat compile`
3. `yarn hardhat deploy --mock --no-verify --network localhost`
4. `git clone https://github.com/graphprotocol/graph-node/`
5. `cd graph-node/docker`
6. If on Linux, `./setup.sh && docker-compose up`, otherwise `docker-compose up`
7. `cd subgraph`, update the addresses in `subgraph.yaml` with the addresses from step 3 (or from `sdk/deployment/localhost/factories-latest.json`)
8. `yarn && yarn codegen && yarn create-local && yarn deploy-local`

## Contribute

To report bugs within this package, create an issue in this repository.
For security issues, please contact dev-support@ampleforth.org.
When submitting code ensure that it is free of lint errors and has 100% test coverage.

```bash
# Compile contracts
yarn compile

# Lint code
yarn lint

# Format code
yarn format

# Run solidity coverage report (compatible with node v12)
yarn coverage

# Run solidity gas usage report
yarn profile
```

## License

[GNU General Public License v3.0 (c) 2020 Fragments, Inc.](./LICENSE)
