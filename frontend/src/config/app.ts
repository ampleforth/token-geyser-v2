import { Network, RewardToken, StakingToken, ALCHEMY_PROJECT_ID } from '../constants'
import {
  AppGeysersList,
  NetworkConfig,
  GeyserConfig,
  ConnectionConfig,
  AdditionalTokenConfig,
  AppAdditionalTokensList,
} from '../types'

const networkConfig: NetworkConfig = {
  [Network.Mainnet]: {
    id: Network.Mainnet,
    networkId: 1,
    chainId: 1,
    ref: 'mainnet',
    name: 'Ethereum',
    rpcUrl: `https://eth-mainnet.alchemyapi.io/v2/${ALCHEMY_PROJECT_ID}`,
    graphUrl: 'https://api.thegraph.com/subgraphs/name/aalavandhan/amplgeyserv2beta',
    explorerUrl: 'https://etherscan.io/tx',
    indexStartBlock: 7953823,
    nativeCurrency: {
      name: 'Ethereum',
      symbol: 'ETH',
      decimals: 18,
    },
  },
  [Network.Avalanche]: {
    id: Network.Avalanche,
    networkId: 43114,
    chainId: 43114,
    ref: 'avalanche',
    name: 'AVAX C-Chain',
    rpcUrl: 'https://api.avax.network/ext/bc/C/rpc',
    graphUrl: 'https://api.thegraph.com/subgraphs/name/aalavandhan/geyserv2-avalanche',
    explorerUrl: 'https://snowtrace.io/tx',
    indexStartBlock: 4799745,
    nativeCurrency: {
      name: 'Avalanche',
      symbol: 'AVAX',
      decimals: 18,
    },
  },
  [Network.Kovan]: {
    id: Network.Kovan,
    networkId: 42,
    chainId: 42,
    ref: 'kovan',
    name: 'Kovan',
    rpcUrl: `https://eth-kovan.alchemyapi.io/v2/${ALCHEMY_PROJECT_ID}`,
    graphUrl: 'https://api.thegraph.com/subgraphs/name/aalavandhan/geyserv2-kovan',
    explorerUrl: 'https://kovan.etherscan.io/tx',
    indexStartBlock: 11666536,
    nativeCurrency: {
      name: 'KovanEthereum',
      symbol: 'KETH',
      decimals: 18,
    },
  },
}

const geyserList: AppGeysersList = {
  [Network.Mainnet]: [
    {
      name: 'ETH Beehive V4 (Uniswap ETH-AMPL)',
      address: '0x88F12aE68315A89B885A2f1b0610fE2A9E1720B9',
      stakingToken: StakingToken.UNISWAP_V2,
      rewardToken: RewardToken.AMPL,
      isWrapped: false,
      // staked pool address: 0xc5be99A02C6857f9Eac67BbCE58DF5572498F40c
    },
    {
      name: 'ETH Splendid Pilot (AAVE aAMPL)',
      address: '0x1Fee4745E70509fBDc718beDf5050F471298c1CE',
      stakingToken: StakingToken.AAVE_V2_AMPL,
      rewardToken: RewardToken.AMPL,
      isWrapped: true,
      // staked pool address: 0x1e6bb68acec8fefbd87d192be09bb274170a0548
    },
    {
      name: 'ETH Trinity V2 (Balancer BTC-ETH-AMPL)',
      address: '0x0ec93391752ef1A06AA2b83D15c3a5814651C891',
      stakingToken: StakingToken.BALANCER_V1,
      rewardToken: RewardToken.AMPL,
      isWrapped: false,
      // staked pool address: 0xa751A143f8fe0a108800Bfb915585E4255C2FE80
    },
    {
      name: 'ETH Old Faithful V2 (Balancer AMPL-USDC)',
      address: '0x914A766578C2397da969b3ca088e3e757249A435',
      stakingToken: StakingToken.BALANCER_SMART_POOL_V1,
      rewardToken: RewardToken.AMPL,
      isWrapped: false,
      // staked pool address: 0x49F2befF98cE62999792Ec98D0eE4Ad790E7786F
    },
    {
      name: 'ETH Pescadero V2 (Sushiswap ETH-AMPL)',
      address: '0x56eD0272f99eBD903043399A51794f966D72E526',
      stakingToken: StakingToken.SUSHISWAP,
      rewardToken: RewardToken.AMPL,
      isWrapped: false,
      // staked pool address: 0xCb2286d9471cc185281c4f763d34A962ED212962
    },
  ],
  [Network.Avalanche]: [
    {
      name: 'AVAX Crystal Geyser V1 (Pangolin AVAX-AMPL)',
      address: '0x26645e8513B1D20aDb729E7114eDfA930D411720',
      stakingToken: StakingToken.PANGOLIN,
      rewardToken: RewardToken.XCAMPLE,
      isWrapped: false,
    },
  ],
  [Network.Kovan]: [
    {
      name: 'Kovan testnet geyser (WAMPL)',
      address: '0xc92b6032a39b996054d7e1825abb273ef335d8e2',
      stakingToken: StakingToken.WAMPL,
      rewardToken: RewardToken.AMPL,
      isWrapped: false,
    },
  ],
}

const additionalTokens: AppAdditionalTokensList = {
  [Network.Mainnet]: [
    {
      token: 'balancer',
      address: '0xba100000625a3754423978a60c9317c58a424e3d',
      enabled: true,
    },
    {
      token: 'sushi',
      address: '0x6b3595068778dd592e39a122f4f5a5cf09c90fe2',
      enabled: true,
    },
    {
      token: 'aave',
      address: '0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9',
      enabled: true,
    },
  ],
  [Network.Kovan]: [],
  [Network.Avalanche]: [
    {
      token: 'pangolin',
      address: '0x60781c2586d68229fde47564546784ab3faca982',
      enabled: true,
    }
  ],
}

export const activeNetworks: Network[] = [Network.Mainnet, Network.Avalanche]

export function getConnectionConfig(networkId: number | null): ConnectionConfig {
  return networkConfig[networkId as Network] || networkConfig[Network.Mainnet]
}

export function getGeysersConfigList(networkId: number): GeyserConfig[] {
  return geyserList[networkId as Network] || geyserList[Network.Mainnet]
}

export function getAdditionalTokensList(networkId: number): AdditionalTokenConfig[] {
  return additionalTokens[networkId as Network] || additionalTokens[Network.Mainnet]
}
