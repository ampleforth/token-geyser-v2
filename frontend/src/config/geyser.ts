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
    address: '0x4a679253410272dd5232b3ff7cf5dbb88f295319',
    stakingToken: StakingToken.MOCK,
    rewardToken: RewardToken.MOCK,
  },
]

const mainnetGeyserConfigs: GeyserConfig[] = [
  {
    name: 'Pescadero V2 (Sushiswap ETH-AMPL)',
    address: '0x56eD0272f99eBD903043399A51794f966D72E526',
    stakingToken: StakingToken.SUSHISWAP,
    rewardToken: RewardToken.AMPL,
    // staking token / pool address: 0xCb2286d9471cc185281c4f763d34A962ED212962
  },
  {
    name: 'Old Faithful V2 (Balancer AMPL-USDC)',
    address: '0x914A766578C2397da969b3ca088e3e757249A435',
    stakingToken: StakingToken.BALANCER_SMART_POOL_V1,
    rewardToken: RewardToken.AMPL,
    // staking token / pool address: 0x49F2befF98cE62999792Ec98D0eE4Ad790E7786F
  },
  {
    name: 'Trinity V2 (Balancer BTC-ETH-AMPL)',
    address: '0x0ec93391752ef1A06AA2b83D15c3a5814651C891',
    stakingToken: StakingToken.BALANCER_V1,
    rewardToken: RewardToken.AMPL,
    // staking token / pool address: 0xa751A143f8fe0a108800Bfb915585E4255C2FE80
  },
  {
    name: 'Beehive V4 (Uniswap ETH-AMPL)',
    address: '0x88F12aE68315A89B885A2f1b0610fE2A9E1720B9',
    stakingToken: StakingToken.UNISWAP_V2,
    rewardToken: RewardToken.AMPL,
    // staking token / pool address: 0xc5be99A02C6857f9Eac67BbCE58DF5572498F40c
  },
]

export const geyserConfigs: GeyserConfig[] =
  process.env.NODE_ENV === 'development' ? mockGeyserConfigs : mainnetGeyserConfigs
