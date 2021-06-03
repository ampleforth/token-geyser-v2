import { StakingToken } from './stakingToken'

export type GeyserConfig = {
  name: string
  address: string
  stakingToken: StakingToken
  platformTokenAddress?: string
}

export const geysersConfig: GeyserConfig[] = [
  {
    name: 'Trinity V1 (Balancer BTC-ETH-AMPL)',
    address: '0x0dcd1bf9a1b36ce34237eeafef220932846bcd82',
    stakingToken: StakingToken.MOCK,
    platformTokenAddress: '0x0000000000000000000000000000000000000000',
  },
  {
    name: 'Trinity V2 (Balancer BTC-ETH-AMPL)',
    address: '0x4a679253410272dd5232b3ff7cf5dbb88f295319',
    stakingToken: StakingToken.MOCK,
    platformTokenAddress: '0x0000000000000000000000000000000000000000',
  },
  {
    name: 'Trinity V3 (Balancer BTC-ETH-AMPL)',
    address: '0x59b670e9fa9d0a427751af201d676719a970857b',
    stakingToken: StakingToken.MOCK,
    platformTokenAddress: '0x0000000000000000000000000000000000000000',
  },
]
