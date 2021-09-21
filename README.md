# token-geyser-v2

[![Tests](https://github.com/ampleforth/token-geyser-v2/workflows/CI/badge.svg)](https://github.com/ampleforth/token-geyser-v2/actions) [![Coverage Status](https://coveralls.io/repos/github/ampleforth/token-geyser-v2/badge.svg?t=HP4Dtq)](https://coveralls.io/github/ampleforth/token-geyser-v2)

Reward distribution contract with time multiplier.

## Live Deployments

```yaml
# Geyser V2 deployment
router: 0x90013fB4D3f9844f930f5dB8DD53CfF38824e3CF
vaultFactory: 0x8A09fFA4d4310c7F59DC538a1481D8Ba2214Cef0
vaultTemplate: 0x9F723008Eec3493A31b6fAf7d9fdf3a82322223C
proxyAdmin: 0xc70F5bc82ccb3de00400814ff8bD406C271db3c4
geyserRegistry: 0xFc43803F203e3821213bE687120aD44C8a21A7e7
geysers:
  - poolRef: "SUSHI-ETH-AMPL (Pescadero V2)"
    deployment: '0x56eD0272f99eBD903043399A51794f966D72E526'

  - poolRef: "BAL-SMART-AMPL-USDC (Old Faithful V2)"
    deployment: '0x914A766578C2397da969b3ca088e3e757249A435'

  - poolRef: "WBTC-WETH-AMPL-BPT (Trinity V2)"
    deployment: '0x0ec93391752ef1A06AA2b83D15c3a5814651C891'

  - poolRef: "UNI-ETH-AMPL-V2 (Beehive V4)"
    deployment: '0x88F12aE68315A89B885A2f1b0610fE2A9E1720B9'

  - poolRef: "aAMPL (Splendid V1)"
    deployment: '0x1Fee4745E70509fBDc718beDf5050F471298c1CE'

externalVaultFactoriesWhitelisted:
  - name: "Crucible"
    template: "0x54e0395CFB4f39beF66DBCd5bD93Cca4E9273D56"
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
