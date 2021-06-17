import { RewardToken, StakingToken } from '../constants'
import { GeyserConfig } from '../types'

/**
 *
 * `address` should be the actual address to which the geyser contract was deployed
 *
 */
const mockGeyserConfigs: GeyserConfig[] = [
  {
    name: 'Trinity V1 (Balancer BTC-ETH-AMPL)',
    address: '0xa85233c63b9ee964add6f2cffe00fd84eb32338f',
    stakingToken: StakingToken.MOCK,
    rewardToken: RewardToken.MOCK,
  },
  {
    name: 'Beehive V3 (Uniswap ETH-AMPL)',
    address: '0x0000000000000000000000000000000000000000',
    stakingToken: StakingToken.MOCK,
    rewardToken: RewardToken.MOCK,
  },
]

const mainnetGeyserConfigs: GeyserConfig[] = [
  {
    name: 'Pescadero V1 (Sushiswap ETH-AMPL)',
    address: '0x0000000000000000000000000000000000000000',
    stakingToken: StakingToken.SUSHISWAP,
    rewardToken: RewardToken.AMPL,
    // staking token / pool address: 0xCb2286d9471cc185281c4f763d34A962ED212962
  },
  {
    name: 'Beehive V3 (Uniswap ETH-AMPL)',
    address: '0x0000000000000000000000000000000000000000',
    stakingToken: StakingToken.UNISWAP_V2,
    rewardToken: RewardToken.AMPL,
    // staking token / pool address: 0xc5be99A02C6857f9Eac67BbCE58DF5572498F40c
  },
  {
    name: 'Trinity V1 (Balancer BTC-ETH-AMPL)',
    address: '0x0000000000000000000000000000000000000000',
    stakingToken: StakingToken.BALANCER_V1,
    rewardToken: RewardToken.AMPL,
    // staking token / pool address: 0xa751A143f8fe0a108800Bfb915585E4255C2FE80
  },
  {
    name: 'Old Faithful V1 (Balancer AMPL-USDC)',
    address: '0x0000000000000000000000000000000000000000',
    stakingToken: StakingToken.BALANCER_SMART_POOL_V1,
    rewardToken: RewardToken.AMPL,
  },
  // staking token / pool address: 0x49F2befF98cE62999792Ec98D0eE4Ad790E7786F
]

export const geyserConfigs: GeyserConfig[] =
  process.env.NODE_ENV === 'development' ? mockGeyserConfigs : mainnetGeyserConfigs
