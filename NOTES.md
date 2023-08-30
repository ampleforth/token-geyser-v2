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
npx hardhat --network base-goerli create-geyser --stakingtoken 0x4fc8603DAFFA1391F31c1F55b45d54E1424D6C82 --rewardtoken 0x980d0cbb2e314c496b808cac88a8a4e8893161e1  --floor 10000000000000000 --ceiling 100000000000000000000 --time 3600
```

The following deposits 1 million reward tokens (with 1e18) decimals. The deploy script scales by 1e9, then internally the contract scaled by 1000. An amount of `100000000000 = 1e11` will scale to `1e23`. Can change the way scripts work.

```bash
# old weth
npx hardhat --network base-goerli fund-geyser --geyser 0x74d0a42e4578F19Ab79ab5a948F5588bb655023E --amount 100000000000 --duration 31536000

# usdc geyser (changed parseUnits inside fund-geyser command on the fly due to lower decimals)
npx hardhat --network base-goerli fund-geyser --geyser 0xc8Ae4370818c4566E5993E7Dd9429D217330FE26 --amount 1 --duration 31536000

# new weth
npx hardhat --network base-goerli fund-geyser --geyser 0x1887f68767aC948c5d4AD94A95062D5Fe47CbA90 --amount 1000000 --duration 31536000
```

## Tenderly: Base mainnet fork

Deploy factories:

```bash
$ npx hardhat deploy --network tenderly

Deploying PowerSwitchFactory
  to 0x91D2409B5a4434863221795E009f064d90E8e056
  in 0x67027a68a73b53e3a543b749b7a76dd20864ac6da08d1b3975cc57ae2d83d87b
Deploying RewardPoolFactory
  to 0x46469a3ABf2Ccac3c7249d6540c7eccdF5646496
  in 0xf91bb96ef77246e7f636a2278e030e5ee1efbc524b2a57512d7d622b20c7b414
Deploying UniversalVault
  to 0xa1Ed2275F3a4aB09EFC94B94F50D9e73b22D2e9F
  in 0x6fb8d6376c45429c00148e4f4a0400a2d66c474660ebb8af953b7366e66b732e
Deploying VaultFactory
  to 0x5780092FcA7BA471Bd58480Ea83A487649C57772
  in 0x2ba2cb23bcdca56ef04ed67d10359e232c9ed1cd7039200069040ff6e216b08c
Deploying GeyserRegistry
  to 0xA576981bd534e229390B68fc8c0f0BCF101F6103
  in 0xf2545dcac44ba8b7d781a9651429d2636c7d684a3709c76516d720c0ccdb6a5c
Deploying RouterV1
  to 0xFe8a29e3c239153249802a05541565b9111c4904
  in 0xd4207cf11554d3543c9f6d4b4786dfe4cd74286d7bd1e34e23239c85ff89634e
Saving config to ./sdk/deployments/tenderly/factories-1693428080.json
```

Create vault:

```bash
$ npx hardhat create-vault --network tenderly

Deploying UniversalVault
  to 0xd799bB70C37D4029Cb39917E4B2CA13873CB0Eab
  in 0xfc048c2a16466b0724b7144d97dafc95a80cfb703327350d5ff904b4c18c1501
```

### WETH Geyser

Need to inpersonate `SEAM` admin and mint `SEAM` into deploy wallet.

Create geyser using `SEAM` as rewardtoken `0x178898686f23a50ccac17962df41395484804a6b`:

```bash
$ tbd
```

Fund geyser:

```bash
$ tbd
```

### USDC Geyser

Need to inpersonate `USDC` admin and mint `USDC` into deploy wallet.
