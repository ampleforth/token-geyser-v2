# token-geyser-v2

[![Tests](https://github.com/ampleforth/token-geyser-v2/workflows/CI/badge.svg)](https://github.com/ampleforth/token-geyser-v2/actions) [![Coverage Status](https://coveralls.io/repos/github/ampleforth/token-geyser-v2/badge.svg?t=HP4Dtq)](https://coveralls.io/github/ampleforth/token-geyser-v2)

Reward distribution contract with time multiplier.

## Live Deployments

```yaml
# Geyser V2 deployment
ethereum:
  router: 0x90013fB4D3f9844f930f5dB8DD53CfF38824e3CF
  vaultFactory: 0x8A09fFA4d4310c7F59DC538a1481D8Ba2214Cef0
  vaultTemplate: 0x9F723008Eec3493A31b6fAf7d9fdf3a82322223C
  proxyAdmin: 0xc70F5bc82ccb3de00400814ff8bD406C271db3c4
  geyserRegistry: 0xFc43803F203e3821213bE687120aD44C8a21A7e7
  geysers:
    - poolRef: "CHARM-WAMPL-WETH (Crystal V2)"
      deployment: 0x59d177f718e902e59CF3Cbd19519194bcC437FeF

    - poolRef: "STAMPL (Riverside V1)"
      deployment: 0xa19604b951592170DDa857CBE46609B85AB00Dee

    - poolRef: "BB-SPOT-USDC (Steamboat V1)"
      deployment: 0xF0a45FA4fBec33A2A51E08058bEA92761c08D7D5

    - poolRef: "CHARM-SPOT-USDC (Great geyser V1)"
      deployment: 0x7B2e9353D3Bf71d9f9246B1291eE29DFB11B32C7

    # - poolRef: "UNI-ETH-AMPL-V2 (Beehive V7)"
    #   deployment: 0x5Ec6f02D0b657E4a56d6020Bc21F19f2Ca13EcA9

    # - poolRef: "Arrakis Vault V1 USDC/SPOT (RAKIS-35) (Fly V2)"
    #   deployment: 0x392b58F407Efe1681a2EBB470600Bc2146D231a2

    # - poolRef: "UNI-ETH-AMPL-V2 (Beehive V6)"
    #   deployment: 0xfa3A1B55f77D0cEd6706283c16296F8317c70e52

    # - poolRef: "Arrakis Vault V1 USDC/SPOT (RAKIS-35) (Fly V1)"
    #   deployment: 0xAA17f42C2F28ba8eF1De171C5E8e4EBd3cd5F2Ec

    # - poolRef: "UNI-ETH-AMPL-V2 (Beehive V5)"
    #   deployment: 0x5Bc95edc2a05247235dd5D6d1773B8cCB95D083B

    # - poolRef: "WBTC-WETH-AMPL-BPT (Trinity V3)"
    #   deployment: 0x13ED22A00576E41B64B686857B484987a3Ad1A3B

    # - poolRef: "aAMPL (Splendid V1)"
    #   deployment: 0x1Fee4745E70509fBDc718beDf5050F471298c1CE

    # - poolRef: "WBTC-WETH-AMPL-BPT (Trinity V2)"
    #   deployment: 0x0ec93391752ef1A06AA2b83D15c3a5814651C891

    # - poolRef: "SUSHI-ETH-AMPL (Pescadero V2)"
    #   deployment: 0x56eD0272f99eBD903043399A51794f966D72E526

    # - poolRef: "BAL-SMART-AMPL-USDC (Old Faithful V2)"
    #   deployment: 0x914A766578C2397da969b3ca088e3e757249A435

    # - poolRef: "UNI-ETH-AMPL-V2 (Beehive V4)"
    #   deployment: 0x88F12aE68315A89B885A2f1b0610fE2A9E1720B9

  externalVaultFactoriesWhitelisted:
    - name: "Crucible"
      template: 0x54e0395CFB4f39beF66DBCd5bD93Cca4E9273D56

avalanche:
  owner: 0x2f47eD85fb37157D113243a150fc943d899701B1
  router: 0x25BcaEd6377CEAA345f12C2005a42e669B8a29fC
  vaultFactory: 0xceD5A1061F5507172059FE760CA2e9F050caBF02
  vaultTemplate: 0x404C875EF7e361295a1d595bb51D7DD1960A1D3c
  proxyAdmin: 0x5396479b65ed39360Ba6C16f6D7c9fd357674534
  geyserRegistry: 0x60156bB86e9125639c624712a360FD3AbBb52421
  geysers:
    # - poolRef: "PNG-AVAX-ETH-AMPL (The great geysir V1)"
    #   deployment: 0x26645e8513B1D20aDb729E7114eDfA930D411720
  externalVaultFactoriesWhitelisted: [ ]
```

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
