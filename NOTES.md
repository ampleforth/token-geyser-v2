# Notes

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

## Base Goerli via Tenderly RPC

Deploy:

```bash
npx hardhat deploy --network base-goerli --mock
npx hardhat --network base-goerli create-vault
npx hardhat --network base-goerli create-geyser --stakingtoken 0x75602e8a08FAf915987589CB7fE59136aE35b0fc --rewardtoken 0x39e47c370411cE01fa09A81A8C842FAE66929976  --floor 0 --ceiling 10000000 --time 3600
npx hardhat --network base-goerli fund-geyser --geyser 0x18ec4E75E276981bd0c1929DC400DBEA60Ea7bF5 --amount 876 --duration 31536000
```

## Base Goerli: using aTokens

Assumes `deploy` and `create-vault` task was run to initalize factories:

```bash
# old weth aToken
npx hardhat --network base-goerli create-geyser --stakingtoken 0xf4781a935Fe1F177f9ef65C69Fc64706a19e9F25 --rewardtoken 0x980d0cbb2e314c496b808cac88a8a4e8893161e1  --floor 10000000 --ceiling 1000000000 --time 3600

# usdc aToken
npx hardhat --network base-goerli create-geyser --stakingtoken 0x6a3639B76cfA1C47f7d4794c87cA791A8294AFC8 --rewardtoken 0x980d0cbb2e314c496b808cac88a8a4e8893161e1  --floor 10000000 --ceiling 1000000000 --time 3600

# new weth aToken
npx hardhat --network base-goerli create-geyser --stakingtoken 0x2311D94F5a407D1AA3D8400a7dECF8E2324A033D --rewardtoken 0x980d0cbb2e314c496b808cac88a8a4e8893161e1  --floor 1000000000 --ceiling 100000000000 --time 3600
```

The following deposits 1 million reward tokens (with 1e18) decimals. The deploy script scales by 1e9, then internally the contract scaled by 1000. An amount of `100000000000 = 1e11` will scale to `1e23`. Can change the way scripts work.

```bash
# old weth
npx hardhat --network base-goerli fund-geyser --geyser 0x74d0a42e4578F19Ab79ab5a948F5588bb655023E --amount 100000000000 --duration 31536000

# usdc geyser (changed parseUnits since it has wierd math)
npx hardhat --network base-goerli fund-geyser --geyser 0xc8Ae4370818c4566E5993E7Dd9429D217330FE26 --amount 1 --duration 31536000

# new weth
npx hardhat --network base-goerli fund-geyser --geyser 0x3C7012982B05B26F91FCafece4Cf4759fcFBC43B --amount 10000000 --duration 31536000
```
