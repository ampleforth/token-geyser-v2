# Changelog

## Contract Changes

- RouterV1 mints vaults, so it needs to be a `IERC721Receiver` and implement `onERC721Received`.
- Added the `depositStake` contract function that does the same thing as the existing `create2VaultAndStake` function, except it doesn't create a vault.
- Fixed a bug relating to the logic for when to update partially unstaked stake in `unstakeAndClaim` of the Geyser contract. See lines 895-901 in `contracts/Geyser.sol` for a description of the change.

## Subgraph Changes

Mainly bug fixes. Also added a `PowerSwitch` entity to keep track of the `GeyserStatus`,
since the event is emitted by the `PowerSwitch` contract.

# Local Deployment

## Deploy Local

1. `yarn hardhat node` -- this spins up a local hardhat network, it is useful to note down the accounts
2. `yarn hardhat compile`
3. `yarn hardhat deploy --mock --no-verify --network localhost`
4. `git clone https://github.com/graphprotocol/graph-node/`
5. `cd graph-node/docker`
6. If on Linux, `./setup.sh && docker-compose up`, otherwise `docker-compose up`
7. `cd subgraph`, `cat subgraph.template.yaml > subgraph.yaml` and update the addresses in `subgraph.yaml` (see [here](#addresses-of-data-sources-in-subgraph))
8. `yarn && yarn codegen && yarn create-local && yarn deploy-local`

## Addresses of Data Sources in Subgraph

The following is the mapping between the data source name to its corresponding contract.
Consequently, the address of the data source should match the address of the deployed contract.

Data Source | Contract
------------|-----------
GeyserRegistry | GeyserRegistry
VaultFactory | VaultFactory
UniversalVaultNFT | VaultFactory
CrucibleFactory | VaultFactory (of alchemist)
CrucibleNFT | VaultFactory (of alchemist)

# Additional Info

Check out `frontend/README.md` for documentation relating to the frontend code.
