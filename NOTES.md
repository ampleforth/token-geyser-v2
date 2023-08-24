# Notes

## Base Goerli via Tenderly RPC

Deploy:

```bash
npx hardhat deploy --network base-goerli --mock
npx hardhat --network base-goerli create-vault
npx hardhat --network base-goerli create-geyser --stakingtoken 0x75602e8a08FAf915987589CB7fE59136aE35b0fc --rewardtoken 0x39e47c370411cE01fa09A81A8C842FAE66929976  --floor 0 --ceiling 10000000 --time 3600
npx hardhat --network base-goerli fund-geyser --geyser 0x18ec4E75E276981bd0c1929DC400DBEA60Ea7bF5 --amount 876 --duration 31536000
```

## Localhost node forking Base Mainnet

Run node, with Base mainnet fork in `hardhat.config.ts`:

```bash
npx hardhat node
```

Deploy, placeholder addresses grabbed from outputs of the hardhat tasks:

```bash
npx hardhat deploy --mock --network localhost
npx hardhat create-vault --network localhost
npx hardhat --network localhost create-geyser --stakingtoken {mockBAL} --rewardtoken {mockAMPLAddress}  --floor 0 --ceiling 10000 --time 360
npx hardhat --network localhost fund-geyser --geyser {gayserAddress} --amount 10 --duration 31536000
```
